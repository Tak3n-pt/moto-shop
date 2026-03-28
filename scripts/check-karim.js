const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

// Find Karim
const karim = db.prepare("SELECT id, display_name FROM users WHERE username = 'karim'").get()
console.log('Karim user:', karim)

if (!karim) { console.log('Karim not found!'); process.exit(0) }

// All his jobs
const allJobs = db.prepare("SELECT status, count(*) as cnt, coalesce(sum(worker_profit),0) as earnings, coalesce(sum(total_amount),0) as revenue FROM jobs WHERE worker_id = ? GROUP BY status").all(karim.id)
console.log('\nAll jobs by status:')
allJobs.forEach(j => console.log(`  ${j.status}: ${j.cnt} jobs, earnings=${j.earnings}, revenue=${j.revenue}`))

// Completed jobs only (what dashboard should show)
const completed = db.prepare("SELECT count(*) as cnt, coalesce(sum(worker_profit),0) as earnings FROM jobs WHERE worker_id = ? AND status = 'completed'").get(karim.id)
console.log('\nCompleted jobs:', completed)

// Last 30 days completed
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString()
const recent = db.prepare("SELECT count(*) as cnt, coalesce(sum(worker_profit),0) as earnings FROM jobs WHERE worker_id = ? AND status = 'completed' AND completed_at >= ?").get(karim.id, thirtyDaysAgo)
console.log('Last 30 days completed:', recent)

// Today only
const todayStart = new Date(); todayStart.setHours(0,0,0,0)
const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
const today = db.prepare("SELECT count(*) as cnt, coalesce(sum(worker_profit),0) as earnings FROM jobs WHERE worker_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?").get(karim.id, todayStart.toISOString(), todayEnd.toISOString())
console.log('Today completed:', today)

// Dashboard uses getStats with today range — but getStats is GLOBAL, not per-worker
// Dashboard uses getWorkerStats for the worker cards
const workerStats30d = db.prepare("SELECT count(*) as totalJobs, coalesce(sum(worker_profit),0) as totalEarnings, coalesce(sum(repair_fee),0) as totalRepairFees FROM jobs WHERE worker_id = ? AND status = 'completed' AND completed_at >= ?").get(karim.id, thirtyDaysAgo)
console.log('WorkerStats (30d):', workerStats30d)

// All jobs (any status) assigned to Karim
const allAssigned = db.prepare("SELECT count(*) as cnt FROM jobs WHERE worker_id = ?").get(karim.id)
console.log('\nTotal jobs assigned (any status):', allAssigned.cnt)

db.close()
process.exit(0)
