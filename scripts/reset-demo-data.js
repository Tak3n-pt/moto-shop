const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const rootDir = path.resolve(__dirname, '..')
const dbPath = path.join(rootDir, 'moto-shop.db')

const now = new Date()
const startDate = new Date(now)
startDate.setMonth(startDate.getMonth() - 12)
startDate.setDate(1)

try {
  main()
} catch (err) {
  console.error('Failed to reset database:', err)
  process.exitCode = 1
}

function main() {
  console.log('Creating fresh moto-shop database...')
  cleanExistingDatabaseFiles()

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createSchema(db)
  seedSettings(db)
  const workers = seedUsers(db)
  const suppliers = seedSuppliers(db)
  const { parts, stock } = seedParts(db)
  seedJobTemplates(db, parts)
  const customers = seedCustomers(db)
  seedPurchases(db, suppliers, parts, stock)
  seedExpenses(db)
  seedJobs(db, { customers, workers, parts, stock })
  finalizePartStock(db, parts, stock)

  db.close()
  console.log('Database ready with fresh 12-month demo data!')
}

function cleanExistingDatabaseFiles() {
  for (const suffix of ['', '-wal', '-shm']) {
    const file = `${dbPath}${suffix}`
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  }
}

function createSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
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
      supplier_id INTEGER,
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
      motorcycle_brand TEXT,
      motorcycle_model TEXT,
      plate_number TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      amount_paid REAL NOT NULL DEFAULT 0,
      paid_at TEXT,
      discount REAL NOT NULL DEFAULT 0,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      warranty_months INTEGER NOT NULL DEFAULT 0,
      warranty_expires_at TEXT,
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

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

function seedSettings(db) {
  const defaults = {
    shop_name: 'Moto Okba Garage',
    shop_phone: '+213 550 123 456',
    shop_address: 'Cité Okba, Oran',
    language: 'en',
    currency: 'DZD',
    auto_backup_enabled: 'false',
    auto_backup_interval: '24',
    auto_backup_path: '',
    auto_backup_last: ''
  }
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (@key, @value)')
  for (const [key, value] of Object.entries(defaults)) {
    insert.run({ key, value })
  }
  return defaults
}

function makeIso(date) {
  return new Date(date).toISOString()
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function randomDateInMonth(baseMonth) {
  const year = baseMonth.getFullYear()
  const month = baseMonth.getMonth()
  const day = randomInt(1, 28)
  const hour = randomInt(8, 18)
  const minute = randomInt(0, 59)
  return new Date(year, month, day, hour, minute)
}

function seedUsers(db) {
  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, role, phone, is_active, created_at, updated_at)
    VALUES (@username, @passwordHash, @displayName, @role, @phone, @isActive, @createdAt, @updatedAt)
  `)

  const adminHash = bcrypt.hashSync('admin123', 10)
  const adminDate = makeIso(addDays(startDate, randomInt(1, 10)))
  insert.run({
    username: 'admin',
    passwordHash: adminHash,
    displayName: 'Administrator',
    role: 'admin',
    phone: '+213 540 000 001',
    isActive: 1,
    createdAt: adminDate,
    updatedAt: adminDate
  })

  const workerSeeds = [
    { username: 'w.aymen', displayName: 'Aymen Benaissa', phone: '+213 550 884 220' },
    { username: 'w.meriem', displayName: 'Meriem Saadi', phone: '+213 551 104 871' },
    { username: 'w.ilyes', displayName: 'Ilyes Ghezal', phone: '+213 555 087 456' },
    { username: 'w.karim', displayName: 'Karim Abdel', phone: '+213 553 908 332' }
  ]
  const workerHash = bcrypt.hashSync('worker123', 10)
  const workers = []
  for (const worker of workerSeeds) {
    const createdAt = makeIso(addDays(startDate, randomInt(5, 30)))
    const result = insert.run({
      username: worker.username,
      passwordHash: workerHash,
      displayName: worker.displayName,
      role: 'worker',
      phone: worker.phone,
      isActive: 1,
      createdAt,
      updatedAt: createdAt
    })
    workers.push({ id: Number(result.lastInsertRowid), ...worker })
  }

  return workers
}

function seedSuppliers(db) {
  const insert = db.prepare(`
    INSERT INTO suppliers (name, phone, email, address, notes, created_at, updated_at)
    VALUES (@name, @phone, @email, @address, @notes, @createdAt, @updatedAt)
  `)
  const suppliers = [
    { name: 'Atlas Parts', phone: '+213 551 111 223', email: 'sales@atlasparts.dz', address: 'Algiers', notes: 'OEM distributor' },
    { name: 'Desert Riders Supply', phone: '+213 552 554 120', email: 'contact@desertriders.dz', address: 'Oran', notes: 'Quick delivery' },
    { name: 'Kabyle Moto', phone: '+213 553 199 788', email: 'info@kabylemoto.dz', address: 'Tizi Ouzou', notes: 'Special parts' },
    { name: 'Mediterranean Imports', phone: '+213 554 437 665', email: 'orders@mediimports.dz', address: 'Annaba', notes: 'Premium brands' },
    { name: 'Steppe Wholesale', phone: '+213 555 201 954', email: 'hello@steppewholesale.dz', address: 'Ghardaïa', notes: 'Bulk deals' }
  ]
  return suppliers.map((supplier, index) => {
    const timestamp = makeIso(addDays(startDate, 3 + index))
    const result = insert.run({ ...supplier, createdAt: timestamp, updatedAt: timestamp })
    return { id: Number(result.lastInsertRowid), ...supplier }
  })
}

function seedParts(db) {
  const insert = db.prepare(`
    INSERT INTO parts (name, category, buy_price, sell_price, quantity, min_stock, barcode, created_at, updated_at)
    VALUES (@name, @category, @buyPrice, @sellPrice, @quantity, @minStock, @barcode, @createdAt, @updatedAt)
  `)

  const partsCatalog = [
    { name: 'Oil Filter OEM', category: 'Engine', buyPrice: 900, sellPrice: 1600, minStock: 8, barcode: 'OF-1001' },
    { name: 'Air Filter Pro', category: 'Engine', buyPrice: 1200, sellPrice: 2100, minStock: 10, barcode: 'AF-2210' },
    { name: 'Spark Plug NGK', category: 'Ignition', buyPrice: 450, sellPrice: 900, minStock: 20, barcode: 'SP-3100' },
    { name: 'Brake Pad Set', category: 'Brakes', buyPrice: 2800, sellPrice: 4400, minStock: 12, barcode: 'BP-4200' },
    { name: 'Chain Kit 520', category: 'Transmission', buyPrice: 5600, sellPrice: 8300, minStock: 6, barcode: 'CK-5200' },
    { name: 'LED Headlight', category: 'Electrical', buyPrice: 3200, sellPrice: 5200, minStock: 5, barcode: 'LH-1500' },
    { name: 'Battery 12V 8Ah', category: 'Electrical', buyPrice: 6400, sellPrice: 9200, minStock: 4, barcode: 'BT-8800' },
    { name: 'Fuel Pump Assembly', category: 'Fuel', buyPrice: 8700, sellPrice: 12800, minStock: 3, barcode: 'FP-3300' },
    { name: 'Clutch Plate Kit', category: 'Transmission', buyPrice: 4500, sellPrice: 7200, minStock: 5, barcode: 'CP-6400' },
    { name: 'Rear Tire 140/70', category: 'Tires', buyPrice: 11000, sellPrice: 15800, minStock: 6, barcode: 'RT-1470' },
    { name: 'Front Tire 110/70', category: 'Tires', buyPrice: 9800, sellPrice: 14000, minStock: 6, barcode: 'FT-1170' },
    { name: 'Brake Disc 300mm', category: 'Brakes', buyPrice: 6300, sellPrice: 9500, minStock: 5, barcode: 'BD-3000' },
    { name: 'Shock Absorber', category: 'Suspension', buyPrice: 7200, sellPrice: 10800, minStock: 4, barcode: 'SA-5000' },
    { name: 'Throttle Cable', category: 'Controls', buyPrice: 700, sellPrice: 1300, minStock: 15, barcode: 'TC-6000' },
    { name: 'Radiator Hose Kit', category: 'Cooling', buyPrice: 1900, sellPrice: 3200, minStock: 9, barcode: 'RH-2700' }
  ]

  const parts = []
  const stock = {}
  partsCatalog.forEach((part, index) => {
    const timestamp = makeIso(addDays(startDate, 4 + index))
    const result = insert.run({ ...part, quantity: 0, createdAt: timestamp, updatedAt: timestamp })
    const stored = { id: Number(result.lastInsertRowid), ...part }
    parts.push(stored)
    stock[stored.id] = 0
  })

  return { parts, stock }
}

function seedJobTemplates(db, parts) {
  const insertTemplate = db.prepare(`
    INSERT INTO job_templates (name, description, repair_fee, worker_markup, notes, created_at, updated_at)
    VALUES (@name, @description, @repairFee, @workerMarkup, @notes, @createdAt, @updatedAt)
  `)
  const insertPart = db.prepare(`
    INSERT INTO job_template_parts (template_id, part_id, quantity, created_at)
    VALUES (@templateId, @partId, @quantity, @createdAt)
  `)

  const partByName = new Map(parts.map((p) => [p.name, p]))
  const templates = [
    {
      name: 'Full Service Package',
      description: 'Complete maintenance service',
      repairFee: 18000,
      workerMarkup: 30,
      notes: 'Recommended every 6 months',
      parts: [
        { name: 'Oil Filter OEM', quantity: 1 },
        { name: 'Air Filter Pro', quantity: 1 },
        { name: 'Spark Plug NGK', quantity: 2 }
      ]
    },
    {
      name: 'Brake Refresh',
      description: 'Brake pad replacement and disc polish',
      repairFee: 14000,
      workerMarkup: 28,
      notes: 'Includes caliper cleaning',
      parts: [
        { name: 'Brake Pad Set', quantity: 1 },
        { name: 'Brake Disc 300mm', quantity: 1 }
      ]
    },
    {
      name: 'Electrical Diagnostic',
      description: 'Battery test and lighting inspection',
      repairFee: 9000,
      workerMarkup: 32,
      notes: 'Covers wiring and sensors',
      parts: [
        { name: 'Battery 12V 8Ah', quantity: 1 },
        { name: 'LED Headlight', quantity: 1 }
      ]
    }
  ]

  templates.forEach((template, index) => {
    const createdAt = makeIso(addDays(startDate, 7 + index))
    const result = insertTemplate.run({
      name: template.name,
      description: template.description,
      repairFee: template.repairFee,
      workerMarkup: template.workerMarkup,
      notes: template.notes,
      createdAt,
      updatedAt: createdAt
    })
    const templateId = Number(result.lastInsertRowid)
    template.parts.forEach((part) => {
      const partRef = partByName.get(part.name)
      if (partRef) {
        insertPart.run({ templateId, partId: partRef.id, quantity: part.quantity, createdAt })
      }
    })
  })
}

function seedCustomers(db) {
  const insert = db.prepare(`
    INSERT INTO customers (name, phone, motorcycle_brand, motorcycle_model, plate_number, notes, created_at, updated_at)
    VALUES (@name, @phone, @brand, @model, @plate, @notes, @createdAt, @updatedAt)
  `)

  const customerNames = [
    'Yacine Ben Salah','Lina Hamdi','Okba Khelifi','Imene Briki','Nassim Toumi','Salim Guettaf','Walid Brahmi','Souad Maouche','Amine Sidhoum','Houda Arar','Sami Guettache','Leila Bensalem','Zaki Boumediene','Manel Chentouf','Riad Dahmani','Sofiane Fadel','Farah Ghezali','Othmane Haddad','Khaled Ismail','Rania Kerras','Ilias Laoufi','Nihad Merabet','Sofiane Nehar','Sara Ouadah','Tahar Rezig','Nora Saighi','Fouad Taleb','Myriam Yahiaoui','Anis Zerguine','Karima Bouzid','Rafik Boulahbal','Kenza Abed','Mehdi Amrani','Latifa Ayadi','Chafik Belkacem','Hafsa Benameur','Akram Bensaci','Sabrina Cherif','Lotfi Debbah','Nawal Driouech','Idir Ferhat','Selma Gachi','Younes Guerfi','Lamia Haouari','Riad Hamimed','Chiraz Kadri','Tayeb Kefi','Linda Kessaci'
  ]

  const motoData = {
    Yamaha: ['MT-07', 'MT-09', 'Tracer 700', 'R3', 'XSR700'],
    Honda: ['CB500X', 'Africa Twin', 'CBR650R', 'Rebel 500', 'Hornet 750'],
    Suzuki: ['V-Strom 650', 'GSX-S750', 'SV650', 'Gixxer 250', 'Burgman 400'],
    Kawasaki: ['Z650', 'Ninja 400', 'Versys 650', 'Vulcan S', 'Z900'],
    KTM: ['Duke 390', 'Adventure 390', 'RC 390', '690 Enduro', '790 Duke']
  }
  const notesPool = ['Loyal client', 'Prefers SMS updates', 'VIP rider', 'Requests OEM parts', 'Enjoys coffee at lounge', 'Sometimes late on payments']

  const plateSet = new Set()
  function createPlate() {
    let plate
    do {
      plate = `${sample(['16','31','25','45','27'])}-${randomInt(100, 999)}-${randomInt(10, 99)}`
    } while (plateSet.has(plate))
    plateSet.add(plate)
    return plate
  }

  const customers = []
  customerNames.forEach((name, index) => {
    const brands = Object.keys(motoData)
    const brand = sample(brands)
    const model = sample(motoData[brand])
    const createdAt = makeIso(addDays(startDate, randomInt(1, 330)))
    const customer = {
      name,
      phone: `+213 55${randomInt(0, 9)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
      brand,
      model,
      plate: createPlate(),
      notes: sample(notesPool),
      createdAt,
      updatedAt: createdAt
    }
    const result = insert.run(customer)
    customers.push({ id: Number(result.lastInsertRowid), ...customer })
  })

  return customers
}

function seedPurchases(db, suppliers, parts, stock) {
  const insertInvoice = db.prepare(`
    INSERT INTO purchase_invoices (supplier_name, supplier_id, invoice_ref, total_amount, notes, purchased_at, created_at, updated_at)
    VALUES (@supplierName, @supplierId, @invoiceRef, @totalAmount, @notes, @purchasedAt, @createdAt, @updatedAt)
  `)
  const insertItem = db.prepare(`
    INSERT INTO purchase_invoice_items (purchase_invoice_id, part_id, quantity, unit_buy_price, unit_sell_price, created_at, updated_at)
    VALUES (@invoiceId, @partId, @quantity, @unitBuyPrice, @unitSellPrice, @createdAt, @updatedAt)
  `)

  let cursor = new Date(startDate)
  const invoicesPerMonth = 2
  const descriptions = ['Monthly restock', 'Special order', 'Fast-moving items', 'Seasonal inventory']

  while (cursor <= now) {
    for (let i = 0; i < invoicesPerMonth; i++) {
      const supplier = sample(suppliers)
      const purchaseDate = randomDateInMonth(cursor)
      const reference = `PI-${purchaseDate.getFullYear()}${String(purchaseDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      const partSelection = [...parts]
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(3, 5))

      const items = partSelection.map((part) => {
        const quantity = randomInt(4, 15)
        const unitBuyPrice = randomFloat(part.buyPrice * 0.95, part.buyPrice * 1.05)
        const unitSellPrice = part.sellPrice
        stock[part.id] += quantity
        return { partId: part.id, quantity, unitBuyPrice, unitSellPrice }
      })

      const total = items.reduce((sum, item) => sum + item.quantity * item.unitBuyPrice, 0)
      const isoDate = makeIso(purchaseDate)
      const invoiceId = Number(insertInvoice.run({
        supplierName: supplier.name,
        supplierId: supplier.id,
        invoiceRef: reference,
        totalAmount: Number(total.toFixed(2)),
        notes: sample(descriptions),
        purchasedAt: isoDate,
        createdAt: isoDate,
        updatedAt: isoDate
      }).lastInsertRowid)

      items.forEach((item) => {
        insertItem.run({
          invoiceId,
          partId: item.partId,
          quantity: item.quantity,
          unitBuyPrice: item.unitBuyPrice,
          unitSellPrice: item.unitSellPrice,
          createdAt: isoDate,
          updatedAt: isoDate
        })
      })
    }
    cursor = addMonths(cursor, 1)
  }
}

function seedExpenses(db) {
  const insert = db.prepare(`
    INSERT INTO expenses (category, amount, description, expense_date, created_at, updated_at)
    VALUES (@category, @amount, @description, @expenseDate, @createdAt, @updatedAt)
  `)

  const expenseCategories = [
    { category: 'Rent', description: 'Workshop rent and utilities', min: 90000, max: 105000 },
    { category: 'Payroll', description: 'Technician payouts', min: 65000, max: 90000 },
    { category: 'Supplies', description: 'Cleaning and office supplies', min: 8000, max: 16000 },
    { category: 'Marketing', description: 'Flyers and online ads', min: 5000, max: 12000 },
    { category: 'Tools', description: 'Tooling and calibration', min: 12000, max: 30000 }
  ]

  let cursor = new Date(startDate)
  while (cursor <= now) {
    expenseCategories.forEach((item) => {
      const date = randomDateInMonth(cursor)
      const isoDate = makeIso(date)
      const amount = randomInt(item.min, item.max)
      insert.run({
        category: item.category,
        amount,
        description: item.description,
        expenseDate: isoDate,
        createdAt: isoDate,
        updatedAt: isoDate
      })
    })
    cursor = addMonths(cursor, 1)
  }
}

function pickPartsForJob(parts, stock) {
  const available = parts.filter((p) => stock[p.id] > 0)
  if (available.length === 0) return []
  const partCount = randomInt(0, Math.min(3, available.length))
  const selected = [...available].sort(() => Math.random() - 0.5).slice(0, partCount)
  return selected.map((part) => {
    const maxQty = Math.min(stock[part.id], part.category === 'Tires' ? 2 : 3)
    const quantity = randomInt(1, Math.max(1, Math.min(maxQty, 3)))
    stock[part.id] -= quantity
    return {
      partId: part.id,
      quantity,
      buyPrice: part.buyPrice,
      sellPrice: part.sellPrice
    }
  })
}

function determinePayment(totalAmount, jobDate) {
  const roll = Math.random()
  if (roll < 0.6) {
    return { status: 'paid', amount: Number(totalAmount.toFixed(2)), paidAt: makeIso(addDays(jobDate, randomInt(0, 3))) }
  }
  if (roll < 0.85) {
    const amount = Number((totalAmount * randomFloat(0.35, 0.85)).toFixed(2))
    return { status: 'partial', amount, paidAt: makeIso(addDays(jobDate, randomInt(0, 5))) }
  }
  return { status: 'unpaid', amount: 0, paidAt: null }
}

function seedJobs(db, context) {
  const { customers, workers, parts, stock } = context
  const insertJob = db.prepare(`
    INSERT INTO jobs (
      customer_id, worker_id, status, description, repair_fee, worker_markup, worker_profit, store_repair_profit,
      parts_total, parts_cost, store_parts_profit, total_amount, notes, motorcycle_brand, motorcycle_model, plate_number,
      payment_status, amount_paid, paid_at, discount, discount_type, warranty_months, warranty_expires_at,
      started_at, completed_at, created_at, updated_at
    ) VALUES (
      @customerId, @workerId, @status, @description, @repairFee, @workerMarkup, @workerProfit, @storeRepairProfit,
      @partsTotal, @partsCost, @storePartsProfit, @totalAmount, @notes, @brand, @model, @plate,
      @paymentStatus, @amountPaid, @paidAt, @discount, @discountType, @warrantyMonths, @warrantyExpiresAt,
      @startedAt, @completedAt, @createdAt, @updatedAt
    )
  `)
  const insertJobPart = db.prepare(`
    INSERT INTO job_parts (job_id, part_id, quantity, buy_price, sell_price, created_at, updated_at)
    VALUES (@jobId, @partId, @quantity, @buyPrice, @sellPrice, @createdAt, @updatedAt)
  `)

  let cursor = new Date(startDate)
  const descriptions = ['Routine maintenance', 'Engine diagnostics', 'Electrical troubleshooting', 'Suspension tune-up', 'Brake overhaul', 'Track day prep', 'Touring setup', 'Fuel system cleaning']
  const notePool = ['Customer waited on-site', 'Requested OEM only', 'Provided own oil', 'Add photos to report', 'Double-check torque settings']

  while (cursor <= now) {
    const isRecentMonth = cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
    const jobsThisMonth = isRecentMonth ? randomInt(8, 12) : randomInt(10, 18)
    for (let i = 0; i < jobsThisMonth; i++) {
      const customer = sample(customers)
      const worker = sample(workers)
      const started = randomDateInMonth(cursor)
      const partsUsed = pickPartsForJob(parts, stock)
      const repairFee = randomInt(4000, 32000)
      const workerMarkup = sample([25, 28, 30, 32, 35, 40])
      const discountActive = Math.random() < 0.25
      const discountType = discountActive ? sample(['fixed', 'percent']) : 'fixed'
      const discountValue = discountActive ? (discountType === 'percent' ? randomInt(5, 15) : randomInt(500, 4000)) : 0

      const workerProfit = Number((repairFee * (workerMarkup / 100)).toFixed(2))
      const storeRepairProfit = Number((repairFee - workerProfit).toFixed(2))
      const partsTotal = partsUsed.reduce((sum, part) => sum + part.sellPrice * part.quantity, 0)
      const partsCost = partsUsed.reduce((sum, part) => sum + part.buyPrice * part.quantity, 0)
      const storePartsProfit = Number((partsTotal - partsCost).toFixed(2))
      const subtotal = repairFee + partsTotal
      const discountAmount = discountType === 'percent' ? (subtotal * (discountValue / 100)) : discountValue
      const totalAmount = Number(Math.max(0, subtotal - discountAmount).toFixed(2))

      const completion = addDays(started, randomInt(1, 4))
      const monthsDifference = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24 * 30)
      let status
      if (monthsDifference > 1) {
        status = 'completed'
      } else if (monthsDifference > 0.2) {
        status = Math.random() < 0.7 ? 'completed' : 'in_progress'
      } else {
        status = Math.random() < 0.5 ? 'in_progress' : 'pending'
      }

      const payment = determinePayment(totalAmount, started)
      const startedAt = status === 'pending' ? null : makeIso(started)
      const completedAt = status === 'completed' ? makeIso(completion) : null
      const warrantyMonths = status === 'completed' && Math.random() < 0.35 ? sample([1, 3, 6]) : 0
      const warrantyExpiresAt = warrantyMonths > 0 && completedAt ? makeIso(addMonths(completion, warrantyMonths)) : null
      const timestamps = {
        createdAt: makeIso(started),
        updatedAt: completedAt || makeIso(started)
      }

      const jobResult = insertJob.run({
        customerId: customer.id,
        workerId: worker.id,
        status,
        description: sample(descriptions),
        repairFee,
        workerMarkup,
        workerProfit,
        storeRepairProfit,
        partsTotal,
        partsCost,
        storePartsProfit,
        totalAmount,
        notes: sample(notePool),
        brand: customer.brand,
        model: customer.model,
        plate: customer.plate,
        paymentStatus: payment.status,
        amountPaid: payment.amount,
        paidAt: payment.paidAt,
        discount: discountValue,
        discountType,
        warrantyMonths,
        warrantyExpiresAt,
        startedAt,
        completedAt,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt
      })

      const jobId = Number(jobResult.lastInsertRowid)
      partsUsed.forEach((part) => {
        insertJobPart.run({
          jobId,
          partId: part.partId,
          quantity: part.quantity,
          buyPrice: part.buyPrice,
          sellPrice: part.sellPrice,
          createdAt: timestamps.createdAt,
          updatedAt: timestamps.updatedAt
        })
      })
    }

    cursor = addMonths(cursor, 1)
  }
}

function finalizePartStock(db, parts, stock) {
  const update = db.prepare('UPDATE parts SET quantity = @quantity, updated_at = @updatedAt WHERE id = @id')
  const timestamp = makeIso(now)
  for (const part of parts) {
    update.run({ id: part.id, quantity: Math.max(0, stock[part.id]), updatedAt: timestamp })
  }
}
