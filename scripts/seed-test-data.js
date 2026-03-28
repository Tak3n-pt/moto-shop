/**
 * Seed script - populates the moto-shop database with realistic test data.
 * Run: node scripts/seed-test-data.js
 */
let Database
try {
  Database = require('better-sqlite3')
} catch (_) {
  // Fallback: use Electron's rebuilt version
  Database = require('../node_modules/better-sqlite3')
}
const bcrypt = require('bcryptjs')
const path = require('path')
const { existsSync } = require('fs')

const dbPath = path.join(__dirname, '..', 'moto-shop.db')
if (!existsSync(dbPath)) {
  console.error('Database not found at', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Run pending migrations for new columns
const migrations = [
  "ALTER TABLE pos_sales ADD COLUMN total_cost REAL NOT NULL DEFAULT 0",
  "ALTER TABLE pos_sale_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0"
]
for (const stmt of migrations) {
  try { db.exec(stmt) } catch (_) { /* column already exists */ }
}

const now = new Date().toISOString()
const today = new Date()

function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// --- Workers ---
const workerHash = bcrypt.hashSync('worker123', 10)
const workers = [
  { username: 'karim', displayName: 'Karim Bouzid', phone: '0555123456' },
  { username: 'youcef', displayName: 'Youcef Merah', phone: '0666789012' },
  { username: 'amine', displayName: 'Amine Khelifi', phone: '0777345678' }
]

const workerIds = []
for (const w of workers) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(w.username)
  if (existing) {
    workerIds.push(existing.id)
  } else {
    const info = db.prepare('INSERT INTO users (username, password_hash, display_name, role, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)').run(w.username, workerHash, w.displayName, 'worker', w.phone)
    workerIds.push(info.lastInsertRowid)
  }
}
console.log('Workers:', workerIds.length)

// --- Customers ---
const customerNames = [
  { name: 'Mohamed Benali', phone: '0550111222', brand: 'Honda', model: 'CG 125', plate: '01234-100-16' },
  { name: 'Ahmed Djebbar', phone: '0661222333', brand: 'Yamaha', model: 'YBR 125', plate: '02345-200-09' },
  { name: 'Samir Hadj', phone: '0772333444', brand: 'Suzuki', model: 'GN 125', plate: '03456-300-31' },
  { name: 'Omar Rais', phone: '0550444555', brand: 'Lifan', model: 'LF 150', plate: '04567-400-16' },
  { name: 'Rachid Boudiaf', phone: '0661555666', brand: 'Honda', model: 'Wave 110', plate: '05678-500-25' },
  { name: 'Khaled Merzak', phone: '0772666777', brand: 'Yamaha', model: 'FZ 150', plate: '06789-600-42' },
  { name: 'Nabil Zerrouki', phone: '0550777888', brand: 'Suzuki', model: 'EN 125', plate: '07890-700-05' },
  { name: 'Farid Belkacem', phone: '0661888999', brand: 'Kawasaki', model: 'Bajaj 150', plate: '08901-800-16' }
]

const customerIds = []
for (const c of customerNames) {
  const existing = db.prepare('SELECT id FROM customers WHERE name = ?').get(c.name)
  if (existing) {
    customerIds.push(existing.id)
  } else {
    const info = db.prepare('INSERT INTO customers (name, phone, motorcycle_brand, motorcycle_model, plate_number) VALUES (?, ?, ?, ?, ?)').run(c.name, c.phone, c.brand, c.model, c.plate)
    customerIds.push(info.lastInsertRowid)
  }
}
console.log('Customers:', customerIds.length)

// --- Parts ---
const partsList = [
  { name: 'Oil Filter', category: 'Filters', buyPrice: 200, sellPrice: 350, quantity: 50, minStock: 10, barcode: 'OIL-FLT-001' },
  { name: 'Air Filter', category: 'Filters', buyPrice: 300, sellPrice: 500, quantity: 30, minStock: 8, barcode: 'AIR-FLT-001' },
  { name: 'Brake Pads Front', category: 'Brakes', buyPrice: 400, sellPrice: 700, quantity: 25, minStock: 5, barcode: 'BRK-PAD-F01' },
  { name: 'Brake Pads Rear', category: 'Brakes', buyPrice: 350, sellPrice: 600, quantity: 20, minStock: 5, barcode: 'BRK-PAD-R01' },
  { name: 'Spark Plug NGK', category: 'Electrical', buyPrice: 150, sellPrice: 300, quantity: 60, minStock: 15, barcode: 'SPK-NGK-001' },
  { name: 'Chain Kit 428', category: 'Drivetrain', buyPrice: 1500, sellPrice: 2500, quantity: 12, minStock: 3, barcode: 'CHN-428-001' },
  { name: 'Engine Oil 10W40 1L', category: 'Fluids', buyPrice: 600, sellPrice: 900, quantity: 40, minStock: 10, barcode: 'OIL-10W-001' },
  { name: 'Clutch Cable', category: 'Cables', buyPrice: 250, sellPrice: 450, quantity: 15, minStock: 4, barcode: 'CBL-CLT-001' },
  { name: 'Throttle Cable', category: 'Cables', buyPrice: 200, sellPrice: 400, quantity: 18, minStock: 4, barcode: 'CBL-THR-001' },
  { name: 'Battery 12V 7Ah', category: 'Electrical', buyPrice: 2000, sellPrice: 3200, quantity: 8, minStock: 2, barcode: 'BAT-12V-001' },
  { name: 'Headlight Bulb H4', category: 'Electrical', buyPrice: 100, sellPrice: 250, quantity: 35, minStock: 10, barcode: 'BLB-H4-001' },
  { name: 'Tire Front 2.75-18', category: 'Tires', buyPrice: 2500, sellPrice: 4000, quantity: 6, minStock: 2, barcode: 'TIR-F-275' },
  { name: 'Tire Rear 3.00-18', category: 'Tires', buyPrice: 2800, sellPrice: 4500, quantity: 5, minStock: 2, barcode: 'TIR-R-300' },
  { name: 'Piston Kit 125cc', category: 'Engine', buyPrice: 1200, sellPrice: 2000, quantity: 4, minStock: 2, barcode: 'PST-125-001' },
  { name: 'Gasket Set Full', category: 'Engine', buyPrice: 800, sellPrice: 1400, quantity: 7, minStock: 3, barcode: 'GSK-FUL-001' },
  { name: 'Brake Fluid DOT4', category: 'Fluids', buyPrice: 300, sellPrice: 500, quantity: 2, minStock: 5, barcode: 'BRK-FLD-001' }
]

const partIds = []
for (const p of partsList) {
  const existing = db.prepare('SELECT id FROM parts WHERE barcode = ?').get(p.barcode)
  if (existing) {
    partIds.push(existing.id)
  } else {
    const info = db.prepare('INSERT INTO parts (name, category, buy_price, sell_price, quantity, min_stock, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)').run(p.name, p.category, p.buyPrice, p.sellPrice, p.quantity, p.minStock, p.barcode)
    partIds.push(info.lastInsertRowid)
  }
}
console.log('Parts:', partIds.length)

// --- Suppliers ---
const supplierNames = ['Algerie Moto Parts', 'Sahara Auto', 'Atlas Pieces', 'El Watan Moto']
for (const s of supplierNames) {
  const existing = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(s)
  if (!existing) {
    db.prepare('INSERT INTO suppliers (name, phone) VALUES (?, ?)').run(s, '021' + randomBetween(100000, 999999))
  }
}
console.log('Suppliers seeded')

// --- Expenses (last 30 days) ---
const expenseCategories = ['rent', 'utilities', 'supplies', 'maintenance']
for (let i = 0; i < 15; i++) {
  const day = randomBetween(0, 29)
  const cat = expenseCategories[randomBetween(0, expenseCategories.length - 1)]
  const amount = cat === 'rent' ? 30000 : randomBetween(500, 5000)
  db.prepare('INSERT INTO expenses (category, amount, description, expense_date) VALUES (?, ?, ?, ?)').run(cat, amount, `${cat} expense`, daysAgo(day))
}
console.log('Expenses seeded')

// --- Jobs (mix of statuses across last 30 days) ---
const jobStatuses = ['completed', 'completed', 'completed', 'completed', 'in_progress', 'in_progress', 'pending', 'cancelled']
for (let i = 0; i < 25; i++) {
  const custIdx = randomBetween(0, customerIds.length - 1)
  const workerIdx = randomBetween(0, workerIds.length - 1)
  const custId = customerIds[custIdx]
  const workerId = workerIds[workerIdx]
  const customer = customerNames[custIdx]
  const status = jobStatuses[randomBetween(0, jobStatuses.length - 1)]
  const repairFee = randomBetween(1, 8) * 500
  const workerMarkup = 30
  const workerProfit = repairFee * 0.3
  const daysOld = randomBetween(0, 29)
  const createdAt = daysAgo(daysOld)

  // Pick 0-3 parts for this job
  const numParts = randomBetween(0, 3)
  let partsTotal = 0, partsCost = 0
  const jobPartsList = []
  const usedPartIds = new Set()
  for (let j = 0; j < numParts; j++) {
    let pIdx = randomBetween(0, partIds.length - 1)
    if (usedPartIds.has(pIdx)) continue
    usedPartIds.add(pIdx)
    const p = partsList[pIdx]
    const qty = randomBetween(1, 2)
    partsTotal += p.sellPrice * qty
    partsCost += p.buyPrice * qty
    jobPartsList.push({ partId: partIds[pIdx], qty, buyPrice: p.buyPrice, sellPrice: p.sellPrice })
  }

  const storeRepairProfit = repairFee - workerProfit
  const storePartsProfit = partsTotal - partsCost
  const totalAmount = repairFee + partsTotal

  const completedAt = status === 'completed' ? daysAgo(Math.max(0, daysOld - randomBetween(0, 3))) : null
  const startedAt = (status === 'in_progress' || status === 'completed') ? daysAgo(Math.max(0, daysOld - 1)) : null

  // Payment: completed jobs are mostly paid
  let amountPaid = 0, paymentStatus = 'unpaid', paidAt = null
  if (status === 'completed') {
    const payChoice = randomBetween(0, 4)
    if (payChoice <= 2) { amountPaid = totalAmount; paymentStatus = 'paid'; paidAt = completedAt }
    else if (payChoice === 3) { amountPaid = Math.round(totalAmount * 0.5); paymentStatus = 'partial' }
  }

  const info = db.prepare(`INSERT INTO jobs (customer_id, worker_id, status, description, repair_fee, worker_markup, worker_profit, store_repair_profit, parts_total, parts_cost, store_parts_profit, total_amount, motorcycle_brand, motorcycle_model, plate_number, payment_status, amount_paid, paid_at, started_at, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    custId, workerId, status, 'Repair job #' + (i + 1), repairFee, workerMarkup, workerProfit, storeRepairProfit, partsTotal, partsCost, storePartsProfit, totalAmount,
    customer.brand, customer.model, customer.plate,
    paymentStatus, amountPaid, paidAt, startedAt, completedAt, createdAt, createdAt
  )

  const jobId = info.lastInsertRowid
  for (const jp of jobPartsList) {
    db.prepare('INSERT INTO job_parts (job_id, part_id, quantity, buy_price, sell_price) VALUES (?, ?, ?, ?, ?)').run(jobId, jp.partId, jp.qty, jp.buyPrice, jp.sellPrice)
  }
}
console.log('Jobs seeded: 25')

// --- POS Sales (last 15 days) ---
const adminUser = db.prepare('SELECT id, display_name FROM users WHERE role = ?').get('admin')
for (let i = 0; i < 20; i++) {
  const daysOld = randomBetween(0, 14)
  const createdAt = daysAgo(daysOld)
  const numItems = randomBetween(1, 4)
  const saleItems = []
  const usedParts = new Set()

  for (let j = 0; j < numItems; j++) {
    let pIdx = randomBetween(0, partIds.length - 1)
    if (usedParts.has(pIdx)) continue
    usedParts.add(pIdx)
    const p = partsList[pIdx]
    const qty = randomBetween(1, 3)
    saleItems.push({ partId: partIds[pIdx], partName: p.name, barcode: p.barcode, qty, unitPrice: p.sellPrice, unitCost: p.buyPrice, lineTotal: p.sellPrice * qty, lineCost: p.buyPrice * qty })
  }

  const subtotal = saleItems.reduce((s, i) => s + i.lineTotal, 0)
  const totalCost = saleItems.reduce((s, i) => s + i.lineCost, 0)
  const discount = randomBetween(0, 2) === 0 ? randomBetween(50, 200) : 0
  const total = subtotal - discount
  const totalItems = saleItems.reduce((s, i) => s + i.qty, 0)

  // Most pay full, some partial
  const payChoice = randomBetween(0, 5)
  let cashReceived = total, amountDue = 0, changeDue = 0
  const hasCustomer = payChoice >= 4
  if (payChoice === 4) {
    cashReceived = Math.round(total * 0.6)
    amountDue = total - cashReceived
  } else if (payChoice === 5) {
    cashReceived = 0
    amountDue = total
  }
  changeDue = amountDue > 0 ? 0 : Math.max(cashReceived - total, 0)

  const custName = hasCustomer ? customerNames[randomBetween(0, customerNames.length - 1)].name : null
  const custPhone = hasCustomer ? customerNames[randomBetween(0, customerNames.length - 1)].phone : null

  const info = db.prepare('INSERT INTO pos_sales (cashier_id, cashier_name, customer_name, customer_phone, total_items, subtotal, discount, total, total_cost, cash_received, change_due, amount_due, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    adminUser.id, adminUser.display_name, custName, custPhone, totalItems, subtotal, discount, total, totalCost, cashReceived, changeDue, amountDue, createdAt
  )

  const saleId = info.lastInsertRowid
  for (const si of saleItems) {
    db.prepare('INSERT INTO pos_sale_items (sale_id, part_id, part_name, barcode, quantity, unit_price, unit_cost, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(saleId, si.partId, si.partName, si.barcode, si.qty, si.unitPrice, si.unitCost, si.lineTotal)
  }
}
console.log('POS Sales seeded: 20')

// --- Purchase Invoices ---
for (let i = 0; i < 3; i++) {
  const supplier = supplierNames[randomBetween(0, supplierNames.length - 1)]
  const numItems = randomBetween(2, 5)
  let totalAmount = 0
  const items = []
  const usedParts = new Set()

  for (let j = 0; j < numItems; j++) {
    let pIdx = randomBetween(0, partIds.length - 1)
    if (usedParts.has(pIdx)) continue
    usedParts.add(pIdx)
    const p = partsList[pIdx]
    const qty = randomBetween(5, 20)
    totalAmount += p.buyPrice * qty
    items.push({ partId: partIds[pIdx], qty, buyPrice: p.buyPrice })
  }

  const info = db.prepare('INSERT INTO purchase_invoices (supplier_name, invoice_ref, total_amount, purchased_at) VALUES (?, ?, ?, ?)').run(supplier, `INV-${2024}-${randomBetween(100, 999)}`, totalAmount, daysAgo(randomBetween(5, 25)))
  const invoiceId = info.lastInsertRowid

  for (const item of items) {
    db.prepare('INSERT INTO purchase_invoice_items (purchase_invoice_id, part_id, quantity, unit_buy_price) VALUES (?, ?, ?, ?)').run(invoiceId, item.partId, item.qty, item.buyPrice)
  }
}
console.log('Purchase invoices seeded: 3')

db.close()
console.log('\nDone! Database seeded with test data.')
console.log('Login: admin / admin123')
console.log('Workers: karim / worker123, youcef / worker123, amine / worker123')
