import { getDb } from '../db/connection'
import { parts, jobParts, purchaseInvoiceItems } from '../db/schema'
import { eq, like, desc, lte, gt, or, and, sql } from 'drizzle-orm'

export const partsService = {
  getAll(search?: string, category?: string, page = 1, limit = 20) {
    const db = getDb()
    const offset = (page - 1) * limit
    const conditions: any[] = []
    if (search) conditions.push(or(like(parts.name, `%${search}%`), like(parts.category, `%${search}%`), like(parts.barcode, `%${search}%`)))
    if (category) conditions.push(eq(parts.category, category))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = db.select({ count: sql<number>`count(*)` }).from(parts).where(whereClause).get()
    const total = totalResult?.count || 0
    const data = db.select().from(parts).where(whereClause).orderBy(desc(parts.updatedAt)).limit(limit).offset(offset).all()

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  },

  getCategories() {
    const db = getDb()
    return db.selectDistinct({ category: parts.category }).from(parts).where(sql`${parts.category} IS NOT NULL AND ${parts.category} != ''`).all().map(r => r.category!)
  },

  getById(id: number) {
    const db = getDb()
    return db.select().from(parts).where(eq(parts.id, id)).get()
  },

  create(data: { name: string; category?: string; buyPrice: number; sellPrice: number; quantity: number; minStock?: number; barcode?: string }) {
    const db = getDb()
    if (data.buyPrice < 0) throw new Error('Buy price cannot be negative')
    if (data.sellPrice < 0) throw new Error('Sell price cannot be negative')
    if (data.quantity < 0) throw new Error('Quantity cannot be negative')
    return db.insert(parts).values(data).returning().get()
  },

  update(id: number, data: Partial<{ name: string; category: string; buyPrice: number; sellPrice: number; quantity: number; minStock: number; barcode: string }>) {
    const db = getDb()
    if (data.buyPrice !== undefined && data.buyPrice < 0) throw new Error('Buy price cannot be negative')
    if (data.sellPrice !== undefined && data.sellPrice < 0) throw new Error('Sell price cannot be negative')
    if (data.quantity !== undefined && data.quantity < 0) throw new Error('Quantity cannot be negative')
    return db.update(parts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(parts.id, id)).returning().get()
  },

  delete(id: number) {
    const db = getDb()
    const usageCount = db.select({ count: sql<number>`count(*)` }).from(jobParts).where(eq(jobParts.partId, id)).get()
    if (usageCount && usageCount.count > 0) {
      throw new Error('Cannot delete part that is used in jobs')
    }
    const purchaseCount = db.select({ count: sql<number>`count(*)` }).from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.partId, id)).get()
    if (purchaseCount && purchaseCount.count > 0) {
      throw new Error('Cannot delete part that has purchase history')
    }
    db.delete(parts).where(eq(parts.id, id)).run()
  },

  getLowStock() {
    const db = getDb()
    return db.select().from(parts).where(and(gt(parts.minStock, 0), lte(parts.quantity, parts.minStock))).all()
  },

  getLowStockCount() {
    const db = getDb()
    const result = db.select({ count: sql<number>`count(*)` }).from(parts).where(and(gt(parts.minStock, 0), lte(parts.quantity, parts.minStock))).get()
    return result?.count || 0
  },

  search(query: string) {
    const db = getDb()
    const pattern = `%${query}%`
    return db.select().from(parts).where(or(like(parts.name, pattern), like(parts.barcode, pattern))).limit(20).all()
  },

  getByBarcode(barcode: string) {
    const db = getDb()
    return db.select().from(parts).where(eq(parts.barcode, barcode)).get() || null
  }
}
