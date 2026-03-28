const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

const from = new Date(Date.now() - 30*24*60*60*1000).toISOString()
const to = new Date().toISOString()
console.log('Range:', from, '→', to)

try {
  const jobs = db.prepare("SELECT * FROM jobs WHERE status = 'completed' AND completed_at >= ? AND completed_at <= ?").all(from, to)
  console.log('Completed jobs:', jobs.length)

  if (jobs.length > 0) {
    const first = jobs[0]
    console.log('First job:', { id: first.id, customerId: first.customer_id, workerId: first.worker_id })

    // Try to get customer
    const cust = db.prepare('SELECT name FROM customers WHERE id = ?').get(first.customer_id)
    console.log('Customer:', cust)

    // Try to get job_parts
    const parts = db.prepare('SELECT * FROM job_parts WHERE job_id = ?').all(first.id)
    console.log('Parts:', parts.length)

    // Check if parts table has the part
    if (parts.length > 0) {
      const part = db.prepare('SELECT name FROM parts WHERE id = ?').get(parts[0].part_id)
      console.log('Part name:', part)
    }
  }

  // Try the summary query
  const summary = db.prepare("SELECT count(*) as cnt, coalesce(sum(total_amount),0) as rev FROM jobs WHERE status = 'completed' AND completed_at >= ? AND completed_at <= ?").get(from, to)
  console.log('Summary:', summary)

  console.log('\nEverything works!')
} catch (err) {
  console.error('ERROR:', err.message)
  console.error(err.stack)
}

db.close()
process.exit(0)
