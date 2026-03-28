import { getSqlite, getDb } from './connection'
import { users, settings } from './schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export function runMigrations() {
  const sqlite = getSqlite()

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'worker' CHECK(role IN ('admin','worker')),
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      motorcycle_brand TEXT,
      motorcycle_model TEXT,
      plate_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      buy_price REAL NOT NULL DEFAULT 0,
      sell_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      barcode TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      invoice_ref TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id),
      part_id INTEGER NOT NULL REFERENCES parts(id),
      quantity INTEGER NOT NULL,
      unit_buy_price REAL NOT NULL,
      unit_sell_price REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      worker_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
      description TEXT,
      repair_fee REAL NOT NULL DEFAULT 0,
      worker_markup REAL NOT NULL DEFAULT 0,
      worker_profit REAL NOT NULL DEFAULT 0,
      store_repair_profit REAL NOT NULL DEFAULT 0,
      parts_total REAL NOT NULL DEFAULT 0,
      parts_cost REAL NOT NULL DEFAULT 0,
      store_parts_profit REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      part_id INTEGER NOT NULL REFERENCES parts(id),
      quantity INTEGER NOT NULL,
      buy_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      repair_fee REAL NOT NULL DEFAULT 0,
      worker_markup REAL NOT NULL DEFAULT 30,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_template_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES job_templates(id),
      part_id INTEGER NOT NULL REFERENCES parts(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pos_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER NOT NULL REFERENCES users(id),
      cashier_name TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      notes TEXT,
      total_items INTEGER NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      cash_received REAL NOT NULL DEFAULT 0,
      change_due REAL NOT NULL DEFAULT 0,
      amount_due REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pos_sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES pos_sales(id),
      part_id INTEGER NOT NULL REFERENCES parts(id),
      part_name TEXT NOT NULL,
      barcode TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Create suppliers table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Migration: Add new columns to jobs table (safe for existing databases)
  const jobAlterColumns = [
    "ALTER TABLE jobs ADD COLUMN motorcycle_brand TEXT",
    "ALTER TABLE jobs ADD COLUMN motorcycle_model TEXT",
    "ALTER TABLE jobs ADD COLUMN plate_number TEXT",
    "ALTER TABLE jobs ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'",
    "ALTER TABLE jobs ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN paid_at TEXT",
    "ALTER TABLE jobs ADD COLUMN discount REAL NOT NULL DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'fixed'",
    "ALTER TABLE jobs ADD COLUMN warranty_months INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN warranty_expires_at TEXT"
  ]
  for (const stmt of jobAlterColumns) {
    try { sqlite.exec(stmt) } catch (_) { /* column already exists */ }
  }

  // Migration: Add columns to parts table (safe for existing databases)
  const partsAlterColumns = [
    "ALTER TABLE parts ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 5",
    "ALTER TABLE parts ADD COLUMN barcode TEXT"
  ]
  for (const stmt of partsAlterColumns) {
    try { sqlite.exec(stmt) } catch (_) { /* column already exists */ }
  }

  // Migration: Add supplier_id to purchase_invoices
  const purchaseAlterColumns = [
    "ALTER TABLE purchase_invoices ADD COLUMN supplier_id INTEGER"
  ]
  for (const stmt of purchaseAlterColumns) {
    try { sqlite.exec(stmt) } catch (_) { /* column already exists */ }
  }

  const posAlterColumns = [
    "ALTER TABLE pos_sales ADD COLUMN amount_due REAL NOT NULL DEFAULT 0",
    "ALTER TABLE pos_sales ADD COLUMN total_cost REAL NOT NULL DEFAULT 0",
    "ALTER TABLE pos_sale_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0"
  ]
  for (const stmt of posAlterColumns) {
    try { sqlite.exec(stmt) } catch (_) { /* column already exists */ }
  }

  // Seed default admin
  const db = getDb()
  const existingAdmin = db.select().from(users).where(eq(users.username, 'admin')).get()
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.insert(users).values({
      username: 'admin',
      passwordHash: hash,
      displayName: 'Administrator',
      role: 'admin'
    }).run()
  }

  // Seed default settings
  const defaultSettings = [
    { key: 'shop_name', value: 'Moto Repair Shop' },
    { key: 'shop_phone', value: '' },
    { key: 'shop_address', value: '' },
    { key: 'language', value: 'en' },
    { key: 'currency', value: 'DZD' }
  ]
  for (const s of defaultSettings) {
    const existing = db.select().from(settings).where(eq(settings.key, s.key)).get()
    if (!existing) {
      db.insert(settings).values(s).run()
    }
  }
}
