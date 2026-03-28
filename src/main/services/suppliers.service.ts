import { getDb } from '../db/connection'
import { suppliers, purchaseInvoices } from '../db/schema'
import { eq, like, desc, or, sql } from 'drizzle-orm'

export const suppliersService = {
  getAll(search?: string) {
    const db = getDb()
    const whereClause = search
      ? or(like(suppliers.name, `%${search}%`), like(suppliers.phone, `%${search}%`), like(suppliers.email, `%${search}%`))
      : undefined

    const data = db.select().from(suppliers).where(whereClause).orderBy(desc(suppliers.updatedAt)).all()

    // Attach purchase count for each supplier
    return data.map(s => {
      const countResult = db.select({ count: sql<number>`count(*)` }).from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, s.id)).get()
      return { ...s, purchaseCount: countResult?.count || 0 }
    })
  },

  getById(id: number) {
    const db = getDb()
    const supplier = db.select().from(suppliers).where(eq(suppliers.id, id)).get()
    if (!supplier) return null

    const purchases = db.select().from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, id)).orderBy(desc(purchaseInvoices.purchasedAt)).all()
    const totalResult = db.select({ total: sql<number>`coalesce(sum(${purchaseInvoices.totalAmount}), 0)` }).from(purchaseInvoices).where(eq(purchaseInvoices.supplierId, id)).get()

    return { ...supplier, purchases, totalPurchased: totalResult?.total || 0 }
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
    db.delete(suppliers).where(eq(suppliers.id, id)).run()
  }
}
