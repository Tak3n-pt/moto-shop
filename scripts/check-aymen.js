const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'moto-shop.db'))

const aymen = db.prepare("SELECT id, display_name FROM users WHERE display_name LIKE '%Aymen%'").get()
console.log('Aymen:', aymen)
if (!aymen) { db.close(); process.exit(0) }

const all = db.prepare('SELECT status, count(*) as cnt FROM jobs WHERE worker_id = ? GROUP BY status').all(aymen.id)
console.log('\nAll jobs by status:', all)

const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString()
const now = new Date()
const todayLocal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
const dayStart = new Date(`${todayLocal}T00:00:00.000`).toISOString()
const dayEnd = new Date(`${todayLocal}T23:59:59.999`).toISOString()

console.log('\n30d range:', thirtyDaysAgo, '→', dayEnd)
const stats30d = db.prepare('SELECT count(*) as cnt, coalesce(sum(worker_profit),0) as earnings FROM jobs WHERE worker_id = ? AND status = ? AND completed_at >= ?').get(aymen.id, 'completed', thirtyDaysAgo)
console.log('Completed last 30d:', stats30d)

console.log('\nToday range:', dayStart, '→', dayEnd)
const statsToday = db.prepare('SELECT count(*) as cnt FROM jobs WHERE worker_id = ? AND status = ? AND completed_at >= ? AND completed_at <= ?').get(aymen.id, 'completed', dayStart, dayEnd)
console.log('Completed today:', statsToday)

const recent = db.prepare('SELECT id, status, completed_at FROM jobs WHERE worker_id = ? AND status = ? ORDER BY completed_at DESC LIMIT 5').all(aymen.id, 'completed')
console.log('\nLast 5 completed_at dates:', recent)

// Also check what getStats returns (global, used for today revenue)
const globalToday = db.prepare('SELECT count(*) as cnt, coalesce(sum(total_amount),0) as rev FROM jobs WHERE status = ? AND completed_at >= ? AND completed_at <= ?').get('completed', dayStart, dayEnd)
console.log('\nGlobal completed today:', globalToday)

db.close()
process.exit(0)
