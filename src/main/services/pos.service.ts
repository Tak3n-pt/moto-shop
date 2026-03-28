import { getDb, getSqlite } from '../db/connection'
import { posSales, posSaleItems, parts, users } from '../db/schema'
import { eq, desc, inArray, and, gte, lte, sql } from 'drizzle-orm'

type PartRow = typeof parts.$inferSelect
type PosSaleItemRow = typeof posSaleItems.$inferSelect

interface SaleItemInput {
  partId: number
  quantity: number
}

interface CreateSaleInput {
  cashierId: number
  customerName?: string
  customerPhone?: string
  notes?: string
  discount?: number
  cashReceived?: number
  items: SaleItemInput[]
}

export const posService = {
  createSale(data: CreateSaleInput) {
    const sqlite = getSqlite()
    const db = getDb()

    if (!data.items || data.items.length === 0) {
      throw new Error('Cart is empty')
    }

    const txn = sqlite.transaction(() => {
      const cashier = db.select().from(users).where(eq(users.id, data.cashierId)).get()
      if (!cashier) throw new Error('Cashier not found')

      const now = new Date().toISOString()
      const uniquePartIds = [...new Set(data.items.map(i => i.partId))]
      const partCache = new Map<number, PartRow>()

      for (const partId of uniquePartIds) {
        const part = db.select().from(parts).where(eq(parts.id, partId)).get()
        if (!part) throw new Error('Part not found')
        partCache.set(partId, part)
      }

      const lineItems = data.items.map(item => {
        const quantity = Number(item.quantity) || 0
        if (quantity <= 0) throw new Error('Invalid quantity')
        const part = partCache.get(item.partId)!
        if (part.quantity < quantity) {
          throw new Error("Not enough stock for " + part.name)
        }
        return {
          part,
          quantity,
          unitPrice: part.sellPrice,
          unitCost: part.buyPrice,
          lineTotal: part.sellPrice * quantity,
          lineCost: part.buyPrice * quantity
        }
      })

      const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
      const totalCost = lineItems.reduce((sum, item) => sum + item.lineCost, 0)
      const discount = Math.min(Math.max(Number(data.discount) || 0, 0), subtotal)
      const total = subtotal - discount
      if (total <= 0) throw new Error('Total cannot be zero')
      const cashReceived = data.cashReceived != null ? Math.max(Number(data.cashReceived) || 0, 0) : total
      const amountDue = Math.max(total - cashReceived, 0)
      const changeDue = amountDue > 0 ? 0 : Math.max(cashReceived - total, 0)
      const totalItems = lineItems.reduce((sum, item) => sum + item.quantity, 0)

      const saleRecord = db.insert(posSales).values({
        cashierId: cashier.id,
        cashierName: cashier.displayName,
        customerName: data.customerName?.trim() || null,
        customerPhone: data.customerPhone?.trim() || null,
        notes: data.notes?.trim() || null,
        totalItems,
        subtotal,
        discount,
        total,
        totalCost,
        cashReceived,
        changeDue,
        amountDue,
        createdAt: now
      }).returning().get()

      for (const item of lineItems) {
        db.insert(posSaleItems).values({
          saleId: saleRecord.id,
          partId: item.part.id,
          partName: item.part.name,
          barcode: item.part.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal,
          createdAt: now
        }).run()

        db.update(parts)
          .set({ quantity: item.part.quantity - item.quantity, updatedAt: now })
          .where(eq(parts.id, item.part.id))
          .run()

        item.part.quantity -= item.quantity
      }

      return {
        ...saleRecord,
        amountDue,
        items: lineItems.map(li => ({
          partId: li.part.id,
          partName: li.part.name,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.lineTotal
        }))
      }
    })

    return txn()
  },

  getRecent(limit = 10, cashierId?: number) {
    const db = getDb()
    const whereClause = cashierId ? eq(posSales.cashierId, cashierId) : undefined
    const query = whereClause
      ? db.select().from(posSales).where(whereClause).orderBy(desc(posSales.createdAt)).limit(limit)
      : db.select().from(posSales).orderBy(desc(posSales.createdAt)).limit(limit)
    const sales = query.all()
    if (sales.length === 0) return []

    const saleIds = sales.map(s => s.id)
    const items = db.select().from(posSaleItems).where(inArray(posSaleItems.saleId, saleIds)).all()
    const grouped: Record<number, PosSaleItemRow[]> = {}
    for (const item of items) {
      if (!grouped[item.saleId]) grouped[item.saleId] = []
      grouped[item.saleId].push(item)
    }

    return sales.map(sale => ({
      ...sale,
      items: grouped[sale.id] || []
    }))
  },

  getSummary(from?: string, to?: string, cashierId?: number) {
    const db = getDb()
    const conditions: any[] = []
    if (from) conditions.push(gte(posSales.createdAt, from))
    if (to) conditions.push(lte(posSales.createdAt, to))
    if (cashierId) conditions.push(eq(posSales.cashierId, cashierId))
    const whereClause = conditions.length ? and(...conditions) : undefined

    const summarySelect = db.select({
      saleCount: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${posSales.total}), 0)`,
      totalCost: sql<number>`coalesce(sum(${posSales.totalCost}), 0)`,
      totalItems: sql<number>`coalesce(sum(${posSales.totalItems}), 0)`,
      totalDue: sql<number>`coalesce(sum(${posSales.amountDue}), 0)`
    }).from(posSales)

    const result = whereClause ? summarySelect.where(whereClause).get() : summarySelect.get()
    const r = result || { saleCount: 0, totalRevenue: 0, totalCost: 0, totalItems: 0, totalDue: 0 }
    return { ...r, totalProfit: (r.totalRevenue || 0) - (r.totalCost || 0) }
  },

  getById(id: number) {
    const db = getDb()
    const sale = db.select().from(posSales).where(eq(posSales.id, id)).get()
    if (!sale) return null
    const items = db.select().from(posSaleItems).where(eq(posSaleItems.saleId, id)).all()
    return { ...sale, items }
  },

  getOutstanding() {
    const db = getDb()
    return db.select().from(posSales).where(sql`${posSales.amountDue} > 0`).orderBy(desc(posSales.createdAt)).all()
  },

  updatePayment(id: number, cashReceived: number) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      const sale = db.select().from(posSales).where(eq(posSales.id, id)).get()
      if (!sale) throw new Error('Sale not found')
      if (cashReceived < 0) throw new Error('Payment cannot be negative')

      const newCashReceived = Math.min(sale.cashReceived + cashReceived, sale.total)
      const newAmountDue = Math.max(sale.total - newCashReceived, 0)
      const newChangeDue = newAmountDue > 0 ? 0 : Math.max(newCashReceived - sale.total, 0)

      return db.update(posSales).set({
        cashReceived: newCashReceived,
        amountDue: newAmountDue,
        changeDue: newChangeDue
      }).where(eq(posSales.id, id)).returning().get()
    })

    return txn()
  },

  getByDateRange(from?: string, to?: string) {
    const db = getDb()
    const conditions: any[] = []
    if (from) conditions.push(gte(posSales.createdAt, from))
    if (to) conditions.push(lte(posSales.createdAt, to))
    const whereClause = conditions.length ? and(...conditions) : undefined

    let query = db.select().from(posSales)
    if (whereClause) {
      query = query.where(whereClause)
    }

    const sales = query.orderBy(desc(posSales.createdAt)).all()
    if (sales.length === 0) return []

    const saleIds = sales.map(s => s.id)
    const items = db.select().from(posSaleItems).where(inArray(posSaleItems.saleId, saleIds)).all()
    const grouped: Record<number, PosSaleItemRow[]> = {}
    for (const item of items) {
      if (!grouped[item.saleId]) grouped[item.saleId] = []
      grouped[item.saleId].push(item)
    }

    return sales.map(sale => ({
      ...sale,
      items: grouped[sale.id] || []
    }))
  }
}
