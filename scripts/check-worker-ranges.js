const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

// Check all workers
const workers = db.prepare("SELECT id, display_name FROM users WHERE role = 'worker'").all()

function toLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function toRangeBoundary(dateStr, end = false) {
  const boundary = end ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${dateStr}T${boundary}`).toISOString()
}

const now = new Date()
const todayLocal = toLocalDate(now)
const dayEnd = toRangeBoundary(todayLocal, true)

const ranges = {
  today: toRangeBoundary(todayLocal),
  week: toRangeBoundary(toLocalDate(new Date(now.getTime() - 6*24*60*60*1000))),
  month: toRangeBoundary(toLocalDate(new Date(now.getTime() - 29*24*60*60*1000))),
  year: toRangeBoundary(toLocalDate(new Date(now.getTime() - 364*24*60*60*1000)))
}

console.log('Date ranges:')
for (const [name, start] of Object.entries(ranges)) {
  console.log(`  ${name}: ${start} → ${dayEnd}`)
}

console.log('\n=== WORKER EARNINGS BY TIME RANGE ===\n')

for (const w of workers) {
  console.log(`--- ${w.display_name} (id=${w.id}) ---`)
  for (const [name, start] of Object.entries(ranges)) {
    const stats = db.prepare(
      "SELECT count(*) as jobs, coalesce(sum(worker_profit),0) as earnings, coalesce(sum(repair_fee),0) as fees FROM jobs WHERE worker_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?"
    ).get(w.id, start, dayEnd)
    console.log(`  ${name.padEnd(6)}: ${stats.jobs} jobs, earnings=${stats.earnings}, fees=${stats.fees}`)
  }
  console.log()
}

// Also verify the Dashboard's getWorkerStats query matches
console.log('=== VERIFY: What getWorkerStats SQL returns ===')
const karim = workers.find(w => w.display_name.includes('Karim'))
if (karim) {
  for (const [name, start] of Object.entries(ranges)) {
    const result = db.prepare(
      "SELECT count(*) as totalJobs, coalesce(sum(worker_profit),0) as totalEarnings, coalesce(sum(repair_fee),0) as totalRepairFees FROM jobs WHERE worker_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?"
    ).get(karim.id, start, dayEnd)
    console.log(`  Karim ${name}: `, result)
  }
}

db.close()
process.exit(0)
