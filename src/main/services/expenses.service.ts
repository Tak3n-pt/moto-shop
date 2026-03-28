import { getDb } from '../db/connection'
import { expenses } from '../db/schema'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'

export const expensesService = {
  getAll(page = 1, limit = 20) {
    const db = getDb()
    const offset = (page - 1) * limit

    const totalResult = db.select({ count: sql<number>`count(*)` }).from(expenses).get()
    const total = totalResult?.count || 0
    const data = db.select().from(expenses).orderBy(desc(expenses.expenseDate)).limit(limit).offset(offset).all()

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  },

  getById(id: number) {
    const db = getDb()
    return db.select().from(expenses).where(eq(expenses.id, id)).get()
  },

  create(data: { category: string; amount: number; description?: string; expenseDate?: string }) {
    const db = getDb()
    return db.insert(expenses).values(data).returning().get()
  },

  update(id: number, data: Partial<{ category: string; amount: number; description: string; expenseDate: string }>) {
    const db = getDb()
    return db.update(expenses).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(expenses.id, id)).returning().get()
  },

  delete(id: number) {
    const db = getDb()
    db.delete(expenses).where(eq(expenses.id, id)).run()
  },

  getByDateRange(from: string, to: string) {
    const db = getDb()
    return db.select().from(expenses).where(and(gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))).orderBy(desc(expenses.expenseDate)).all()
  },

  getTotalByDateRange(from: string, to: string) {
    const db = getDb()
    const result = db.select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`
    }).from(expenses).where(and(gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))).get()
    return result?.total || 0
  }
}
