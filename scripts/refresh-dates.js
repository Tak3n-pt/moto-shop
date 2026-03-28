const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Update all completed jobs to have completedAt within the last 30 days
const completedJobs = db.prepare("SELECT id, created_at FROM jobs WHERE status = 'completed'").all()
console.log(`Refreshing ${completedJobs.length} completed jobs...`)

for (const job of completedJobs) {
  const daysOld = randomBetween(0, 28)
  const completedAt = daysAgo(daysOld)
  const startedAt = daysAgo(daysOld + randomBetween(1, 3))
  const createdAt = daysAgo(daysOld + randomBetween(2, 5))
  db.prepare('UPDATE jobs SET completed_at = ?, started_at = ?, created_at = ?, updated_at = ? WHERE id = ?').run(completedAt, startedAt, createdAt, completedAt, job.id)
}

// Update pending/in_progress jobs to recent dates
const activeJobs = db.prepare("SELECT id FROM jobs WHERE status IN ('pending', 'in_progress')").all()
for (const job of activeJobs) {
  const daysOld = randomBetween(0, 5)
  const createdAt = daysAgo(daysOld)
  db.prepare('UPDATE jobs SET created_at = ?, updated_at = ? WHERE id = ?').run(createdAt, createdAt, job.id)
}

// Update POS sales to recent dates
const sales = db.prepare('SELECT id FROM pos_sales').all()
for (const sale of sales) {
  const daysOld = randomBetween(0, 14)
  db.prepare('UPDATE pos_sales SET created_at = ? WHERE id = ?').run(daysAgo(daysOld), sale.id)
}

// Update expenses to recent dates
const expenses = db.prepare('SELECT id FROM expenses').all()
for (const exp of expenses) {
  const daysOld = randomBetween(0, 29)
  db.prepare('UPDATE expenses SET expense_date = ? WHERE id = ?').run(daysAgo(daysOld), exp.id)
}

console.log('All dates refreshed to the last 30 days.')
db.close()
process.exit(0)
