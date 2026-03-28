import { getDb, getSqlite } from '../db/connection'
import { purchaseInvoices, purchaseInvoiceItems, parts, suppliers } from '../db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

interface PurchaseItemInput {
  partId: number
  quantity: number
  unitBuyPrice: number
  unitSellPrice?: number
}

export const purchaseService = {
  getAll(page = 1, limit = 20) {
    const db = getDb()
    const offset = (page - 1) * limit
    const totalResult = db.select({ count: sql<number>`count(*)` }).from(purchaseInvoices).get()
    const total = totalResult?.count || 0
    const data = db.select().from(purchaseInvoices).orderBy(desc(purchaseInvoices.createdAt)).limit(limit).offset(offset).all()
    return { data, total, page, totalPages: Math.ceil(total / limit) }
  },

  getById(id: number) {
    const db = getDb()
    const invoice = db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get()
    if (!invoice) return null
    const items = db.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all()
    const itemsWithNames = items.map(item => {
      const part = db.select().from(parts).where(eq(parts.id, item.partId)).get()
      return { ...item, partName: part?.name || 'Unknown' }
    })
    return { ...invoice, items: itemsWithNames }
  },

  create(data: { supplierName: string; supplierId?: number; invoiceRef?: string; notes?: string; purchasedAt?: string; amountPaid?: number; items: PurchaseItemInput[] }) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      if (!data.items || data.items.length === 0) throw new Error('Purchase must have at least one item')

      let totalAmount = 0
      for (const item of data.items) {
        totalAmount += item.unitBuyPrice * item.quantity
      }

      const amountPaid = Math.min(Math.max(data.amountPaid || 0, 0), totalAmount)
      const paymentStatus = amountPaid >= totalAmount ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'

      const invoice = db.insert(purchaseInvoices).values({
        supplierName: data.supplierName,
        supplierId: data.supplierId,
        invoiceRef: data.invoiceRef,
        totalAmount,
        amountPaid,
        paymentStatus,
        notes: data.notes,
        purchasedAt: data.purchasedAt || new Date().toISOString()
      }).returning().get()

      for (const item of data.items) {
        db.insert(purchaseInvoiceItems).values({
          purchaseInvoiceId: invoice.id,
          partId: item.partId,
          quantity: item.quantity,
          unitBuyPrice: item.unitBuyPrice,
          unitSellPrice: item.unitSellPrice
        }).run()

        // Update stock and optionally update prices
        const currentPart = db.select().from(parts).where(eq(parts.id, item.partId)).get()
        if (currentPart) {
          const updates: any = { quantity: currentPart.quantity + item.quantity, updatedAt: new Date().toISOString() }
          if (item.unitBuyPrice > 0) updates.buyPrice = item.unitBuyPrice
          if (item.unitSellPrice !== undefined && item.unitSellPrice !== null) updates.sellPrice = item.unitSellPrice
          db.update(parts).set(updates).where(eq(parts.id, item.partId)).run()
        }
      }

      return invoice
    })

    return txn()
  }
}
