import { getDb } from '../db/connection'
import { customers, jobs, posSales } from '../db/schema'
import { eq, like, desc, or, sql } from 'drizzle-orm'

export const customersService = {
  getAll(search?: string, page = 1, limit = 20) {
    const db = getDb()
    const offset = (page - 1) * limit
    const whereClause = search
      ? or(like(customers.name, `%${search}%`), like(customers.phone, `%${search}%`), like(customers.plateNumber, `%${search}%`))
      : undefined

    const totalResult = db.select({ count: sql<number>`count(*)` }).from(customers).where(whereClause).get()
    const total = totalResult?.count || 0
    const data = db.select().from(customers).where(whereClause).orderBy(desc(customers.updatedAt)).limit(limit).offset(offset).all()

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  },

  getById(id: number) {
    const db = getDb()
    return db.select().from(customers).where(eq(customers.id, id)).get()
  },

  create(data: { name: string; phone?: string; motorcycleBrand?: string; motorcycleModel?: string; plateNumber?: string; notes?: string }) {
    const db = getDb()
    return db.insert(customers).values(data).returning().get()
  },

  update(id: number, data: Partial<{ name: string; phone: string; motorcycleBrand: string; motorcycleModel: string; plateNumber: string; notes: string }>) {
    const db = getDb()
    return db.update(customers).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(customers.id, id)).returning().get()
  },

  delete(id: number) {
    const db = getDb()
    const jobCount = db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.customerId, id)).get()
    if (jobCount && jobCount.count > 0) {
      throw new Error('Cannot delete customer with existing jobs')
    }
    db.delete(customers).where(eq(customers.id, id)).run()
  },

  getHistory(customerId: number) {
    const db = getDb()
    return db.select().from(jobs).where(eq(jobs.customerId, customerId)).orderBy(desc(jobs.createdAt)).all()
  },

  getStats(customerId: number) {
    const db = getDb()
    const result = db.select({
      totalJobs: sql<number>`count(*)`,
      totalSpent: sql<number>`coalesce(sum(${jobs.totalAmount}), 0)`,
      lastVisit: sql<string>`max(${jobs.createdAt})`
    }).from(jobs).where(eq(jobs.customerId, customerId)).get()
    return result || { totalJobs: 0, totalSpent: 0, lastVisit: null }
  },

  getDebts() {
    const db = getDb()
    const rows = db.select({
      customerId: jobs.customerId,
      totalDebt: sql<number>`coalesce(sum(${jobs.totalAmount} - ${jobs.amountPaid}), 0)`,
      unpaidJobs: sql<number>`count(*)`
    }).from(jobs).where(
      sql`${jobs.paymentStatus} IN ('unpaid', 'partial') AND ${jobs.status} != 'cancelled'`
    ).groupBy(jobs.customerId).all()

    const jobDebts = rows.filter(r => r.totalDebt > 0).map(r => {
      const customer = db.select().from(customers).where(eq(customers.id, r.customerId)).get()
      return { ...r, customer, source: 'job' as const }
    })

    const posRows = db.select().from(posSales)
      .where(sql`${posSales.amountDue} > 0`)
      .orderBy(desc(posSales.createdAt)).all()

    const posDebts = posRows.map(sale => ({
      source: 'pos' as const,
      saleId: sale.id,
      amountDue: sale.amountDue,
      totalDebt: sale.amountDue,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      createdAt: sale.createdAt,
      totalItems: sale.totalItems
    }))

    return { jobDebts, posDebts }
  }
}
