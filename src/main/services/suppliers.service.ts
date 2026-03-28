import { getDb } from '../db/connection'
import { suppliers, purchaseInvoices, supplierLedger } from '../db/schema'
import { eq, like, desc, or, sql } from 'drizzle-orm'

export const suppliersService = {
  getAll(search?: string) {
    const db = getDb()
    const whereClause = search
      ? or(like(suppliers.name, `%${search}%`), like(suppliers.phone, `%${search}%`), like(suppliers.email, `%${search}%`))
      : undefined

    const data = db.select().from(suppliers).where(whereClause).orderBy(desc(suppliers.updatedAt)).all()

    return data.map(s => {
      const countResult = db.select({ count: sql<number>`count(*)` }).from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, s.id)).get()
      const debtResult = db.select({ total: sql<number>`coalesce(sum(CASE WHEN type='debt' THEN amount ELSE 0 END), 0)` }).from(supplierLedger).where(eq(supplierLedger.supplierId, s.id)).get()
      const paymentResult = db.select({ total: sql<number>`coalesce(sum(CASE WHEN type='payment' THEN amount ELSE 0 END), 0)` }).from(supplierLedger).where(eq(supplierLedger.supplierId, s.id)).get()
      const balance = (debtResult?.total || 0) - (paymentResult?.total || 0)
      return { ...s, purchaseCount: countResult?.count || 0, balance }
    })
  },

  getById(id: number) {
    const db = getDb()
    const supplier = db.select().from(suppliers).where(eq(suppliers.id, id)).get()
    if (!supplier) return null

    const purchases = db.select().from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, id)).orderBy(desc(purchaseInvoices.purchasedAt)).all()
    const totalResult = db.select({ total: sql<number>`coalesce(sum(${purchaseInvoices.totalAmount}), 0)` }).from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, id)).get()

    const ledger = db.select().from(supplierLedger).where(eq(supplierLedger.supplierId, id)).orderBy(desc(supplierLedger.createdAt)).all()
    const totalDebt = ledger.filter(e => e.type === 'debt').reduce((s, e) => s + e.amount, 0)
    const totalPayments = ledger.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0)
    const balance = totalDebt - totalPayments

    return { ...supplier, purchases, totalPurchased: totalResult?.total || 0, ledger, totalDebt, totalPayments, balance }
  },

  create(data: { name: string; phone?: string; email?: string; address?: string; notes?: string }) {
    const db = getDb()
    return db.insert(suppliers).values(data).returning().get()
  },

  update(id: number, data: Partial<{ name: string; phone: string; email: string; address: string; notes: string }>) {
    const db = getDb()
    return db.update(suppliers).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(suppliers.id, id)).returning().get()
  },

  delete(id: number) {
    const db = getDb()
    const purchaseCount = db.select({ count: sql<number>`count(*)` }).from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, id)).get()
    if (purchaseCount && purchaseCount.count > 0) {
      throw new Error('Cannot delete supplier with purchase history')
    }
    const ledgerCount = db.select({ count: sql<number>`count(*)` }).from(supplierLedger).where(eq(supplierLedger.supplierId, id)).get()
    if (ledgerCount && ledgerCount.count > 0) {
      throw new Error('Cannot delete supplier with ledger entries')
    }
    db.delete(suppliers).where(eq(suppliers.id, id)).run()
  },

  addDebt(supplierId: number, amount: number, description?: string, purchaseInvoiceId?: number) {
    const db = getDb()
    if (amount <= 0) throw new Error('Amount must be positive')
    return db.insert(supplierLedger).values({
      supplierId, type: 'debt', amount, description, purchaseInvoiceId
    }).returning().get()
  },

  addPayment(supplierId: number, amount: number, description?: string) {
    const db = getDb()
    if (amount <= 0) throw new Error('Amount must be positive')
    return db.insert(supplierLedger).values({
      supplierId, type: 'payment', amount, description
    }).returning().get()
  },

  getAllDebts() {
    const db = getDb()
    const allSuppliers = db.select().from(suppliers).all()
    const result: any[] = []
    for (const s of allSuppliers) {
      const debtSum = db.select({ total: sql<number>`coalesce(sum(CASE WHEN type='debt' THEN amount ELSE 0 END), 0)` }).from(supplierLedger).where(eq(supplierLedger.supplierId, s.id)).get()
      const paySum = db.select({ total: sql<number>`coalesce(sum(CASE WHEN type='payment' THEN amount ELSE 0 END), 0)` }).from(supplierLedger).where(eq(supplierLedger.supplierId, s.id)).get()
      const balance = (debtSum?.total || 0) - (paySum?.total || 0)
      if (balance > 0) {
        result.push({ supplierId: s.id, supplierName: s.name, supplierPhone: s.phone, balance })
      }
    }
    return result
  }
}
