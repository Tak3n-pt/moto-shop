import { getDb } from '../db/connection'
import { parts, customers, jobs, suppliers } from '../db/schema'
import { like, or, sql } from 'drizzle-orm'

export const searchService = {
  globalSearch(query: string) {
    const db = getDb()
    const pattern = `%${query}%`

    const partsResults = db.select({
      id: parts.id,
      name: parts.name,
      extra: parts.barcode
    }).from(parts).where(
      or(like(parts.name, pattern), like(parts.barcode, pattern), like(parts.category, pattern))
    ).limit(10).all()

    const customersResults = db.select({
      id: customers.id,
      name: customers.name,
      extra: customers.phone
    }).from(customers).where(
      or(like(customers.name, pattern), like(customers.phone, pattern), like(customers.plateNumber, pattern))
    ).limit(10).all()

    const jobsResults = db.select({
      id: jobs.id,
      name: jobs.description,
      extra: sql<string>`'#' || ${jobs.id}`
    }).from(jobs).where(
      or(
        like(jobs.description, pattern),
        like(jobs.plateNumber, pattern),
        sql`CAST(${jobs.id} AS TEXT) LIKE ${pattern}`
      )
    ).limit(10).all()

    const suppliersResults = db.select({
      id: suppliers.id,
      name: suppliers.name,
      extra: suppliers.phone
    }).from(suppliers).where(
      or(like(suppliers.name, pattern), like(suppliers.phone, pattern))
    ).limit(10).all()

    return {
      parts: partsResults,
      customers: customersResults,
      jobs: jobsResults,
      suppliers: suppliersResults
    }
  }
}
