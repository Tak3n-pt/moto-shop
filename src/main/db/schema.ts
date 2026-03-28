import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'worker'] }).notNull().default('worker'),
  phone: text('phone'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  motorcycleBrand: text('motorcycle_brand'),
  motorcycleModel: text('motorcycle_model'),
  plateNumber: text('plate_number'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const parts = sqliteTable('parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category'),
  buyPrice: real('buy_price').notNull().default(0),
  sellPrice: real('sell_price').notNull().default(0),
  quantity: integer('quantity').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  barcode: text('barcode'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const purchaseInvoices = sqliteTable('purchase_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierName: text('supplier_name').notNull(),
  supplierId: integer('supplier_id'),
  invoiceRef: text('invoice_ref'),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  purchasedAt: text('purchased_at').notNull().default(sql`(datetime('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const purchaseInvoiceItems = sqliteTable('purchase_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseInvoiceId: integer('purchase_invoice_id').notNull().references(() => purchaseInvoices.id),
  partId: integer('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull(),
  unitBuyPrice: real('unit_buy_price').notNull(),
  unitSellPrice: real('unit_sell_price'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  workerId: integer('worker_id').notNull().references(() => users.id),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled'] }).notNull().default('pending'),
  description: text('description'),
  repairFee: real('repair_fee').notNull().default(0),
  workerMarkup: real('worker_markup').notNull().default(0),
  workerProfit: real('worker_profit').notNull().default(0),
  storeRepairProfit: real('store_repair_profit').notNull().default(0),
  partsTotal: real('parts_total').notNull().default(0),
  partsCost: real('parts_cost').notNull().default(0),
  storePartsProfit: real('store_parts_profit').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  motorcycleBrand: text('motorcycle_brand'),
  motorcycleModel: text('motorcycle_model'),
  plateNumber: text('plate_number'),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'partial', 'paid'] }).notNull().default('unpaid'),
  amountPaid: real('amount_paid').notNull().default(0),
  paidAt: text('paid_at'),
  discount: real('discount').notNull().default(0),
  discountType: text('discount_type', { enum: ['fixed', 'percent'] }).notNull().default('fixed'),
  warrantyMonths: integer('warranty_months').notNull().default(0),
  warrantyExpiresAt: text('warranty_expires_at'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const jobParts = sqliteTable('job_parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  partId: integer('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull(),
  buyPrice: real('buy_price').notNull(),
  sellPrice: real('sell_price').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const jobTemplates = sqliteTable('job_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  repairFee: real('repair_fee').notNull().default(0),
  workerMarkup: real('worker_markup').notNull().default(30),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const jobTemplateParts = sqliteTable('job_template_parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').notNull().references(() => jobTemplates.id),
  partId: integer('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  description: text('description'),
  expenseDate: text('expense_date').notNull().default(sql`(datetime('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value')
})

export const posSales = sqliteTable('pos_sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cashierId: integer('cashier_id').notNull().references(() => users.id),
  cashierName: text('cashier_name').notNull(),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  notes: text('notes'),
  totalItems: integer('total_items').notNull().default(0),
  subtotal: real('subtotal').notNull().default(0),
  discount: real('discount').notNull().default(0),
  total: real('total').notNull().default(0),
  totalCost: real('total_cost').notNull().default(0),
  cashReceived: real('cash_received').notNull().default(0),
  changeDue: real('change_due').notNull().default(0),
  amountDue: real('amount_due').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

export const posSaleItems = sqliteTable('pos_sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => posSales.id),
  partId: integer('part_id').notNull().references(() => parts.id),
  partName: text('part_name').notNull(),
  barcode: text('barcode'),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  unitCost: real('unit_cost').notNull().default(0),
  lineTotal: real('line_total').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})
