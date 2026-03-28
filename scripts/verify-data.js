const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

console.log('=== DATABASE VERIFICATION ===\n')

// Counts
const counts = {
  users: db.prepare('SELECT count(*) as c FROM users').get().c,
  customers: db.prepare('SELECT count(*) as c FROM customers').get().c,
  parts: db.prepare('SELECT count(*) as c FROM parts').get().c,
  jobs: db.prepare('SELECT count(*) as c FROM jobs').get().c,
  jobParts: db.prepare('SELECT count(*) as c FROM job_parts').get().c,
  posSales: db.prepare('SELECT count(*) as c FROM pos_sales').get().c,
  posSaleItems: db.prepare('SELECT count(*) as c FROM pos_sale_items').get().c,
  expenses: db.prepare('SELECT count(*) as c FROM expenses').get().c,
  suppliers: db.prepare('SELECT count(*) as c FROM suppliers').get().c,
  purchaseInvoices: db.prepare('SELECT count(*) as c FROM purchase_invoices').get().c
}
console.log('RECORD COUNTS:', counts)

// Job stats
const jobStats = db.prepare(`
  SELECT status, count(*) as cnt,
    coalesce(sum(total_amount), 0) as revenue,
    coalesce(sum(worker_profit), 0) as workerProfit,
    coalesce(sum(store_repair_profit + store_parts_profit), 0) as storeProfit
  FROM jobs GROUP BY status
`).all()
console.log('\nJOB STATS BY STATUS:')
jobStats.forEach(s => console.log(`  ${s.status}: ${s.cnt} jobs, revenue=${s.revenue}, workerProfit=${s.workerProfit}, storeProfit=${s.storeProfit}`))

// Job debt
const jobDebt = db.prepare(`SELECT count(*) as cnt, coalesce(sum(total_amount - amount_paid), 0) as debt FROM jobs WHERE payment_status IN ('unpaid', 'partial') AND status != 'cancelled'`).get()
console.log(`\nJOB DEBTS: ${jobDebt.cnt} unpaid jobs, total debt=${jobDebt.debt}`)

// POS stats
const posStats = db.prepare(`
  SELECT count(*) as cnt,
    coalesce(sum(total), 0) as revenue,
    coalesce(sum(total_cost), 0) as cost,
    coalesce(sum(total - total_cost), 0) as profit,
    coalesce(sum(amount_due), 0) as outstanding
  FROM pos_sales
`).get()
console.log(`\nPOS STATS: ${posStats.cnt} sales, revenue=${posStats.revenue}, cost=${posStats.cost}, profit=${posStats.profit}, outstanding=${posStats.outstanding}`)

// POS items with cost check
const posItemCheck = db.prepare(`SELECT count(*) as total, count(CASE WHEN unit_cost > 0 THEN 1 END) as withCost FROM pos_sale_items`).get()
console.log(`POS ITEMS: ${posItemCheck.total} items, ${posItemCheck.withCost} with cost tracking`)

// Expenses
const expenseTotal = db.prepare(`SELECT coalesce(sum(amount), 0) as total FROM expenses`).get()
console.log(`\nEXPENSES TOTAL: ${expenseTotal.total}`)

// Net profit calculation
const completedJobProfit = db.prepare(`SELECT coalesce(sum(store_repair_profit + store_parts_profit), 0) as profit FROM jobs WHERE status = 'completed'`).get()
console.log(`\nNET PROFIT COMPONENTS:`)
console.log(`  Job Store Profit: ${completedJobProfit.profit}`)
console.log(`  POS Profit: ${posStats.profit}`)
console.log(`  Expenses: -${expenseTotal.total}`)
console.log(`  NET PROFIT: ${completedJobProfit.profit + posStats.profit - expenseTotal.total}`)

// Low stock check
const lowStock = db.prepare(`SELECT count(*) as c FROM parts WHERE min_stock > 0 AND quantity <= min_stock`).get()
console.log(`\nLOW STOCK PARTS: ${lowStock.c}`)

// Workers
const workerStats = db.prepare(`
  SELECT u.display_name, count(j.id) as jobs, coalesce(sum(j.worker_profit), 0) as earnings
  FROM users u LEFT JOIN jobs j ON j.worker_id = u.id AND j.status = 'completed'
  WHERE u.role = 'worker' GROUP BY u.id
`).all()
console.log('\nWORKER EARNINGS:')
workerStats.forEach(w => console.log(`  ${w.display_name}: ${w.jobs} jobs, earnings=${w.earnings}`))

db.close()
console.log('\n=== VERIFICATION COMPLETE ===')
process.exit(0)
