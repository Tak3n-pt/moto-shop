import { getDb } from '../db/connection'
import { jobs, jobParts, parts, users, customers, expenses, posSales } from '../db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

export const reportsService = {
  profitReport(from: string, to: string) {
    const db = getDb()
    const completedJobs = db.select().from(jobs)
      .where(and(eq(jobs.status, 'completed'), gte(jobs.completedAt, from), lte(jobs.completedAt, to)))
      .orderBy(desc(jobs.completedAt)).all()

    // Enrich jobs with customer/worker names and parts details
    const customerIds = [...new Set(completedJobs.map(j => j.customerId))]
    const workerIds = [...new Set(completedJobs.map(j => j.workerId))]
    const customerMap: Record<number, string> = {}
    const workerMap: Record<number, string> = {}
    for (const id of customerIds) {
      const c = db.select({ name: customers.name }).from(customers).where(eq(customers.id, id)).get()
      if (c) customerMap[id] = c.name
    }
    for (const id of workerIds) {
      const u = db.select({ displayName: users.displayName }).from(users).where(eq(users.id, id)).get()
      if (u) workerMap[id] = u.displayName
    }
    const enrichedJobs = completedJobs.map(j => {
      const jobPartsData = db.select().from(jobParts).where(eq(jobParts.jobId, j.id)).all()
      const partsWithNames = jobPartsData.map(jp => {
        const part = db.select({ name: parts.name }).from(parts).where(eq(parts.id, jp.partId)).get()
        return { ...jp, partName: part?.name || 'Unknown' }
      })
      return { ...j, customerName: customerMap[j.customerId] || '-', workerName: workerMap[j.workerId] || '-', parts: partsWithNames }
    })

    const summary = db.select({
      totalJobs: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${jobs.totalAmount}), 0)`,
      totalRepairFees: sql<number>`coalesce(sum(${jobs.repairFee}), 0)`,
      totalWorkerProfit: sql<number>`coalesce(sum(${jobs.workerProfit}), 0)`,
      totalStoreRepairProfit: sql<number>`coalesce(sum(${jobs.storeRepairProfit}), 0)`,
      totalStorePartsProfit: sql<number>`coalesce(sum(${jobs.storePartsProfit}), 0)`,
      totalPartsTotal: sql<number>`coalesce(sum(${jobs.partsTotal}), 0)`,
      totalPartsCost: sql<number>`coalesce(sum(${jobs.partsCost}), 0)`
    }).from(jobs).where(and(eq(jobs.status, 'completed'), gte(jobs.completedAt, from), lte(jobs.completedAt, to))).get()

    // Get expenses for the period
    const expenseTotal = db.select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`
    }).from(expenses).where(and(gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))).get()

    const posSummary = db.select({
      saleCount: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${posSales.total}), 0)`,
      totalItems: sql<number>`coalesce(sum(${posSales.totalItems}), 0)`,
      totalDue: sql<number>`coalesce(sum(${posSales.amountDue}), 0)`
    }).from(posSales).where(and(gte(posSales.createdAt, from), lte(posSales.createdAt, to))).get() || {
      saleCount: 0,
      totalRevenue: 0,
      totalItems: 0,
      totalDue: 0
    }

    return { jobs: enrichedJobs, summary, posSummary, totalExpenses: expenseTotal?.total || 0 }
  },

  workerEarnings(from: string, to: string) {
    const db = getDb()
    const workers = db.select().from(users).where(eq(users.role, 'worker')).all()

    return workers.map(worker => {
      const stats = db.select({
        totalJobs: sql<number>`count(*)`,
        totalEarnings: sql<number>`coalesce(sum(${jobs.workerProfit}), 0)`,
        totalRepairFees: sql<number>`coalesce(sum(${jobs.repairFee}), 0)`
      }).from(jobs).where(and(eq(jobs.workerId, worker.id), eq(jobs.status, 'completed'), gte(jobs.completedAt, from), lte(jobs.completedAt, to))).get()

      const defaults = { totalJobs: 0, totalEarnings: 0, totalRepairFees: 0 }
      return { worker: { id: worker.id, displayName: worker.displayName, username: worker.username }, ...defaults, ...stats }
    })
  },

  inventoryReport() {
    const db = getDb()
    const allParts = db.select().from(parts).orderBy(desc(parts.updatedAt)).all()
    const totalValue = allParts.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0)
    const totalSellValue = allParts.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0)
    const lowStock = allParts.filter(p => p.quantity <= p.minStock)
    const outOfStock = allParts.filter(p => p.quantity === 0)

    return { parts: allParts, totalValue, totalSellValue, lowStock, outOfStock, totalParts: allParts.length }
  },

  mostUsedParts(from: string, to: string, limit = 10) {
    const db = getDb()
    const result = db.select({
      partId: jobParts.partId,
      totalQuantity: sql<number>`sum(${jobParts.quantity})`,
      totalRevenue: sql<number>`sum(${jobParts.sellPrice} * ${jobParts.quantity})`,
      totalCost: sql<number>`sum(${jobParts.buyPrice} * ${jobParts.quantity})`
    }).from(jobParts)
      .innerJoin(jobs, eq(jobParts.jobId, jobs.id))
      .where(and(eq(jobs.status, 'completed'), gte(jobs.completedAt, from), lte(jobs.completedAt, to)))
      .groupBy(jobParts.partId)
      .orderBy(sql`sum(${jobParts.quantity}) desc`)
      .limit(limit).all()

    return result.map(r => {
      const part = db.select().from(parts).where(eq(parts.id, r.partId)).get()
      return { ...r, partName: part?.name || 'Unknown', profit: (r.totalRevenue || 0) - (r.totalCost || 0) }
    })
  },

  dailyRevenue(from: string, to: string) {
    const db = getDb()
    const jobRows = db.select({
      date: sql<string>`date(${jobs.completedAt})`,
      jobRevenue: sql<number>`coalesce(sum(${jobs.totalAmount}), 0)`,
      storeProfit: sql<number>`coalesce(sum(${jobs.storeRepairProfit} + ${jobs.storePartsProfit}), 0)`,
      jobCount: sql<number>`count(*)`
    }).from(jobs)
      .where(and(eq(jobs.status, 'completed'), gte(jobs.completedAt, from), lte(jobs.completedAt, to)))
      .groupBy(sql`date(${jobs.completedAt})`).all()

    const posRows = db.select({
      date: sql<string>`date(${posSales.createdAt})`,
      posRevenue: sql<number>`coalesce(sum(${posSales.total}), 0)`,
      posCount: sql<number>`count(*)`
    }).from(posSales)
      .where(and(gte(posSales.createdAt, from), lte(posSales.createdAt, to)))
      .groupBy(sql`date(${posSales.createdAt})`).all()

    const map = new Map<string, { date: string; jobRevenue: number; posRevenue: number; totalRevenue: number; storeProfit: number; jobCount: number; posCount: number }>()

    for (const row of jobRows) {
      map.set(row.date, {
        date: row.date,
        jobRevenue: row.jobRevenue,
        posRevenue: 0,
        storeProfit: row.storeProfit,
        jobCount: row.jobCount,
        posCount: 0,
        totalRevenue: row.jobRevenue
      })
    }

    for (const row of posRows) {
      const existing = map.get(row.date)
      if (existing) {
        existing.posRevenue = row.posRevenue
        existing.posCount = row.posCount
        existing.totalRevenue = existing.jobRevenue + row.posRevenue
      } else {
        map.set(row.date, {
          date: row.date,
          jobRevenue: 0,
          posRevenue: row.posRevenue,
          storeProfit: 0,
          jobCount: 0,
          posCount: row.posCount,
          totalRevenue: row.posRevenue
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }
}
