import { getDb, getSqlite } from '../db/connection'
import { jobs, jobParts, parts, customers, users } from '../db/schema'
import { eq, desc, and, gte, lte, sql, or, like } from 'drizzle-orm'

interface JobPartInput {
  partId: number
  quantity: number
  buyPrice: number
  sellPrice: number
}

interface CreateJobInput {
  customerId: number
  workerId: number
  description?: string
  repairFee: number
  workerMarkup: number
  notes?: string
  motorcycleBrand?: string
  motorcycleModel?: string
  plateNumber?: string
  discount?: number
  discountType?: 'fixed' | 'percent'
  warrantyMonths?: number
  parts: JobPartInput[]
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}

function calculateJobFinancials(repairFee: number, workerMarkup: number, jobParts: JobPartInput[], discount = 0, discountType: 'fixed' | 'percent' = 'fixed') {
  const workerProfit = repairFee * (workerMarkup / 100)
  let storeRepairProfit = repairFee - workerProfit
  let partsTotal = 0
  let partsCost = 0

  for (const p of jobParts) {
    partsTotal += p.sellPrice * p.quantity
    partsCost += p.buyPrice * p.quantity
  }

  let storePartsProfit = partsTotal - partsCost
  const discountAmount = discountType === 'percent'
    ? (repairFee + partsTotal) * (discount / 100)
    : discount
  const totalAmount = repairFee + partsTotal - discountAmount

  if (discountAmount > 0) {
    const revenueBeforeDiscount = repairFee + partsTotal
    if (revenueBeforeDiscount > 0) {
      const repairShare = repairFee / revenueBeforeDiscount
      const partsShare = 1 - repairShare
      storeRepairProfit -= discountAmount * repairShare
      storePartsProfit -= discountAmount * partsShare
    } else {
      storeRepairProfit -= discountAmount
    }
  }

  return { workerProfit, storeRepairProfit, partsTotal, partsCost, storePartsProfit, totalAmount }
}

export const jobsService = {
  getAll(filters?: { status?: string; workerId?: number; from?: string; to?: string; search?: string; page?: number; limit?: number }) {
    const db = getDb()
    const conditions: any[] = []
    if (filters?.status) conditions.push(eq(jobs.status, filters.status as any))
    if (filters?.workerId) conditions.push(eq(jobs.workerId, filters.workerId))
    if (filters?.from) conditions.push(gte(jobs.createdAt, filters.from))
    if (filters?.to) conditions.push(lte(jobs.createdAt, filters.to))
    if (filters?.search) {
      const pattern = `%${filters.search}%`
      conditions.push(
        or(
          like(jobs.description, pattern),
          like(jobs.plateNumber, pattern),
          like(jobs.motorcycleBrand, pattern),
          like(jobs.motorcycleModel, pattern),
          sql`${jobs.customerId} IN (SELECT id FROM customers WHERE name LIKE ${pattern} OR phone LIKE ${pattern})`
        )
      )
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = db.select({ count: sql<number>`count(*)` }).from(jobs).where(whereClause).get()
    const total = totalResult?.count || 0

    const rows = whereClause
      ? db.select().from(jobs).where(whereClause).orderBy(desc(jobs.createdAt)).limit(limit).offset(offset).all()
      : db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit).offset(offset).all()

    // Resolve customer/worker names in a single pass instead of requiring frontend to load all
    const customerIds = [...new Set(rows.map(j => j.customerId))]
    const workerIds = [...new Set(rows.map(j => j.workerId))]

    const customerMap: Record<number, string> = {}
    for (const id of customerIds) {
      const c = db.select({ name: customers.name }).from(customers).where(eq(customers.id, id)).get()
      if (c) customerMap[id] = c.name
    }

    const workerMap: Record<number, string> = {}
    for (const id of workerIds) {
      const u = db.select({ displayName: users.displayName }).from(users).where(eq(users.id, id)).get()
      if (u) workerMap[id] = u.displayName
    }

    const data = rows.map(j => ({
      ...j,
      customerName: customerMap[j.customerId] || '-',
      workerName: workerMap[j.workerId] || '-'
    }))

    return { data, total, page, totalPages: Math.ceil(total / limit) }
  },

  getById(id: number) {
    const db = getDb()
    const job = db.select().from(jobs).where(eq(jobs.id, id)).get()
    if (!job) return null

    const jobPartsData = db.select().from(jobParts).where(eq(jobParts.jobId, id)).all()
    const customer = db.select().from(customers).where(eq(customers.id, job.customerId)).get()
    const worker = db.select().from(users).where(eq(users.id, job.workerId)).get()

    const partsWithNames = jobPartsData.map(jp => {
      const part = db.select().from(parts).where(eq(parts.id, jp.partId)).get()
      return { ...jp, partName: part?.name || 'Unknown' }
    })

    return { ...job, parts: partsWithNames, customer, worker }
  },

  create(input: CreateJobInput) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      // Aggregate quantities per partId to handle duplicates
      const partTotals = new Map<number, number>()
      for (const p of input.parts) {
        partTotals.set(p.partId, (partTotals.get(p.partId) || 0) + p.quantity)
      }

      // Validate stock BEFORE any changes
      for (const [partId, totalQty] of partTotals) {
        const currentPart = db.select().from(parts).where(eq(parts.id, partId)).get()
        if (!currentPart) throw new Error(`Part not found: ID ${partId}`)
        if (currentPart.quantity < totalQty) {
          throw new Error(`Insufficient stock for ${currentPart.name}: available ${currentPart.quantity}, requested ${totalQty}`)
        }
      }

      const financials = calculateJobFinancials(
        input.repairFee, input.workerMarkup, input.parts,
        input.discount || 0, input.discountType || 'fixed'
      )

      const warrantyMonths = input.warrantyMonths || 0
      let warrantyExpiresAt: string | null = null
      if (warrantyMonths > 0) {
        const d = new Date()
        d.setMonth(d.getMonth() + warrantyMonths)
        warrantyExpiresAt = d.toISOString()
      }

      const job = db.insert(jobs).values({
        customerId: input.customerId,
        workerId: input.workerId,
        description: input.description,
        repairFee: input.repairFee,
        workerMarkup: input.workerMarkup,
        workerProfit: financials.workerProfit,
        storeRepairProfit: financials.storeRepairProfit,
        partsTotal: financials.partsTotal,
        partsCost: financials.partsCost,
        storePartsProfit: financials.storePartsProfit,
        totalAmount: financials.totalAmount,
        notes: input.notes,
        motorcycleBrand: input.motorcycleBrand,
        motorcycleModel: input.motorcycleModel,
        plateNumber: input.plateNumber,
        discount: input.discount || 0,
        discountType: input.discountType || 'fixed',
        warrantyMonths,
        warrantyExpiresAt,
        status: 'pending'
      }).returning().get()

      // Insert job parts and deduct stock
      for (const p of input.parts) {
        db.insert(jobParts).values({
          jobId: job.id,
          partId: p.partId,
          quantity: p.quantity,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice
        }).run()

        const currentPart = db.select().from(parts).where(eq(parts.id, p.partId)).get()
        if (currentPart) {
          db.update(parts).set({ quantity: currentPart.quantity - p.quantity, updatedAt: new Date().toISOString() }).where(eq(parts.id, p.partId)).run()
        }
      }

      return job
    })

    return txn()
  },

  update(id: number, input: CreateJobInput) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      const job = db.select().from(jobs).where(eq(jobs.id, id)).get()
      if (!job) throw new Error('Job not found')
      if (job.status !== 'pending') throw new Error('Can only edit jobs with pending status')

      // 1. Restore stock for old parts
      const oldParts = db.select().from(jobParts).where(eq(jobParts.jobId, id)).all()
      for (const op of oldParts) {
        const currentPart = db.select().from(parts).where(eq(parts.id, op.partId)).get()
        if (currentPart) {
          db.update(parts).set({ quantity: currentPart.quantity + op.quantity, updatedAt: new Date().toISOString() }).where(eq(parts.id, op.partId)).run()
        }
      }

      // 2. Delete old job_parts
      db.delete(jobParts).where(eq(jobParts.jobId, id)).run()

      // 3. Validate stock for new parts (aggregate duplicates)
      const updatePartTotals = new Map<number, number>()
      for (const p of input.parts) {
        updatePartTotals.set(p.partId, (updatePartTotals.get(p.partId) || 0) + p.quantity)
      }
      for (const [partId, totalQty] of updatePartTotals) {
        const currentPart = db.select().from(parts).where(eq(parts.id, partId)).get()
        if (!currentPart) throw new Error(`Part not found: ID ${partId}`)
        if (currentPart.quantity < totalQty) {
          throw new Error(`Insufficient stock for ${currentPart.name}: available ${currentPart.quantity}, requested ${totalQty}`)
        }
      }

      // 4. Deduct stock for new parts
      for (const p of input.parts) {
        db.insert(jobParts).values({
          jobId: id,
          partId: p.partId,
          quantity: p.quantity,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice
        }).run()

        const currentPart = db.select().from(parts).where(eq(parts.id, p.partId)).get()
        if (currentPart) {
          db.update(parts).set({ quantity: currentPart.quantity - p.quantity, updatedAt: new Date().toISOString() }).where(eq(parts.id, p.partId)).run()
        }
      }

      // 5. Recalculate financials
      const financials = calculateJobFinancials(
        input.repairFee, input.workerMarkup, input.parts,
        input.discount || 0, input.discountType || 'fixed'
      )

      // 6. Update job record
      const warrantyMonths = input.warrantyMonths || 0
      let warrantyExpiresAt: string | null = null
      if (warrantyMonths > 0) {
        const d = new Date(job.createdAt)
        d.setMonth(d.getMonth() + warrantyMonths)
        warrantyExpiresAt = d.toISOString()
      }

      return db.update(jobs).set({
        customerId: input.customerId,
        workerId: input.workerId,
        description: input.description,
        repairFee: input.repairFee,
        workerMarkup: input.workerMarkup,
        workerProfit: financials.workerProfit,
        storeRepairProfit: financials.storeRepairProfit,
        partsTotal: financials.partsTotal,
        partsCost: financials.partsCost,
        storePartsProfit: financials.storePartsProfit,
        totalAmount: financials.totalAmount,
        notes: input.notes,
        motorcycleBrand: input.motorcycleBrand,
        motorcycleModel: input.motorcycleModel,
        plateNumber: input.plateNumber,
        discount: input.discount || 0,
        discountType: input.discountType || 'fixed',
        warrantyMonths,
        warrantyExpiresAt,
        updatedAt: new Date().toISOString()
      }).where(eq(jobs.id, id)).returning().get()
    })

    return txn()
  },

  delete(id: number) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      const job = db.select().from(jobs).where(eq(jobs.id, id)).get()
      if (!job) throw new Error('Job not found')
      if (job.status !== 'pending') throw new Error('Can only delete jobs with pending status')

      // Restore stock
      const oldParts = db.select().from(jobParts).where(eq(jobParts.jobId, id)).all()
      for (const op of oldParts) {
        const currentPart = db.select().from(parts).where(eq(parts.id, op.partId)).get()
        if (currentPart) {
          db.update(parts).set({ quantity: currentPart.quantity + op.quantity, updatedAt: new Date().toISOString() }).where(eq(parts.id, op.partId)).run()
        }
      }

      db.delete(jobParts).where(eq(jobParts.jobId, id)).run()
      db.delete(jobs).where(eq(jobs.id, id)).run()
    })

    txn()
  },

  updateStatus(id: number, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    const db = getDb()
    const sqlite = getSqlite()

    const txn = sqlite.transaction(() => {
      const job = db.select().from(jobs).where(eq(jobs.id, id)).get()
      if (!job) throw new Error('Job not found')

      // Validate status transition
      const allowed = VALID_TRANSITIONS[job.status] || []
      if (!allowed.includes(status)) {
        throw new Error(`Cannot change status from ${job.status} to ${status}`)
      }

      const updates: any = { status, updatedAt: new Date().toISOString() }
      if (status === 'in_progress' && !job.startedAt) updates.startedAt = new Date().toISOString()
      if (status === 'completed') updates.completedAt = new Date().toISOString()

      // If cancelling, restore stock
      if (status === 'cancelled' && job.status !== 'cancelled') {
        const jobPartsData = db.select().from(jobParts).where(eq(jobParts.jobId, id)).all()
        for (const jp of jobPartsData) {
          const currentPart = db.select().from(parts).where(eq(parts.id, jp.partId)).get()
          if (currentPart) {
            db.update(parts).set({ quantity: currentPart.quantity + jp.quantity, updatedAt: new Date().toISOString() }).where(eq(parts.id, jp.partId)).run()
          }
        }
      }

      return db.update(jobs).set(updates).where(eq(jobs.id, id)).returning().get()
    })

    return txn()
  },

  updatePayment(id: number, amountPaid: number) {
    const db = getDb()
    const sqlite = getSqlite()

    const txn = sqlite.transaction(() => {
      const job = db.select().from(jobs).where(eq(jobs.id, id)).get()
      if (!job) throw new Error('Job not found')

      if (amountPaid < 0) throw new Error('Payment amount cannot be negative')
      const newAmountPaid = Math.min(amountPaid, job.totalAmount)
      const paymentStatus = newAmountPaid >= job.totalAmount ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'
      const paidAt = paymentStatus === 'paid' ? new Date().toISOString() : null

      return db.update(jobs).set({
        amountPaid: newAmountPaid,
        paymentStatus: paymentStatus as any,
        paidAt,
        updatedAt: new Date().toISOString()
      }).where(eq(jobs.id, id)).returning().get()
    })

    return txn()
  },

  getStats(from?: string, to?: string) {
    const db = getDb()
    const conditions: any[] = [eq(jobs.status, 'completed')]
    if (from) conditions.push(gte(jobs.completedAt, from))
    if (to) conditions.push(lte(jobs.completedAt, to))

    const result = db.select({
      totalJobs: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${jobs.totalAmount}), 0)`,
      totalWorkerProfit: sql<number>`coalesce(sum(${jobs.workerProfit}), 0)`,
      totalStoreRepairProfit: sql<number>`coalesce(sum(${jobs.storeRepairProfit}), 0)`,
      totalStorePartsProfit: sql<number>`coalesce(sum(${jobs.storePartsProfit}), 0)`,
      totalPartsTotal: sql<number>`coalesce(sum(${jobs.partsTotal}), 0)`,
      totalPartsCost: sql<number>`coalesce(sum(${jobs.partsCost}), 0)`
    }).from(jobs).where(and(...conditions)).get()

    return result
  },

  getWorkerStats(workerId: number, from?: string, to?: string) {
    const db = getDb()
    const conditions: any[] = [eq(jobs.workerId, workerId), eq(jobs.status, 'completed')]
    if (from) conditions.push(gte(jobs.completedAt, from))
    if (to) conditions.push(lte(jobs.completedAt, to))

    return db.select({
      totalJobs: sql<number>`count(*)`,
      totalEarnings: sql<number>`coalesce(sum(${jobs.workerProfit}), 0)`,
      totalRepairFees: sql<number>`coalesce(sum(${jobs.repairFee}), 0)`
    }).from(jobs).where(and(...conditions)).get()
  },

  getWorkerJobs(workerId: number, from: string, to: string) {
    const db = getDb()
    const rows = db.select().from(jobs)
      .where(and(
        eq(jobs.workerId, workerId),
        eq(jobs.status, 'completed'),
        gte(jobs.completedAt, from),
        lte(jobs.completedAt, to)
      ))
      .orderBy(desc(jobs.completedAt)).all()

    // Enrich with customer names and parts
    const customerIds = [...new Set(rows.map(j => j.customerId))]
    const customerMap: Record<number, string> = {}
    for (const id of customerIds) {
      const c = db.select({ name: customers.name }).from(customers).where(eq(customers.id, id)).get()
      if (c) customerMap[id] = c.name
    }
    return rows.map(j => {
      const jpData = db.select().from(jobParts).where(eq(jobParts.jobId, j.id)).all()
      const partsWithNames = jpData.map(jp => {
        const part = db.select({ name: parts.name }).from(parts).where(eq(parts.id, jp.partId)).get()
        return { ...jp, partName: part?.name || 'Unknown' }
      })
      return { ...j, customerName: customerMap[j.customerId] || '-', parts: partsWithNames }
    })
  },

  getActiveCount() {
    const db = getDb()
    const result = db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.status, 'in_progress')).get()
    return result?.count || 0
  },

  getRecent(limit = 10) {
    const db = getDb()
    return db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit).all()
  }
}
