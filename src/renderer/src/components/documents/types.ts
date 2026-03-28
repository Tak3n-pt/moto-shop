// Document prop types — data is pre-fetched and passed as props

export interface DocumentCustomer {
  name: string
  phone?: string
  motorcycle?: string
}

export interface InvoiceItem {
  description: string
  qty: number
  unitPrice: number
  total: number
}

export interface FactureProps {
  isProforma?: boolean
  invoiceNumber: string
  date: string
  customer: {
    name: string
    phone?: string
  }
  motorcycle?: {
    brand?: string
    model?: string
    plate?: string
  }
  items: InvoiceItem[]
  subtotal: number
  discount?: number
  total: number
  amountPaid: number
  remaining: number
  paymentStatus: string
  warranty?: {
    months: number
    expiresAt?: string
  }
}

export interface DeliveryItem {
  description: string
  qty: number
}

export interface BonDeLivraisonProps {
  number: string
  date: string
  customer: {
    name: string
    phone?: string
  }
  jobReference: string
  items: DeliveryItem[]
}

export interface BonDeSortieItem {
  partName: string
  qty: number
}

export interface BonDeSortieProps {
  number: string
  date: string
  jobReference: string
  worker: string
  items: BonDeSortieItem[]
}

export interface RepairProfitReportProps {
  dateRange: { from: string; to: string }
  summary: {
    totalJobs: number
    totalRevenue: number
    totalWorkerProfit: number
    totalStoreRepairProfit: number
    totalStorePartsProfit: number
    totalPartsCost: number
  }
  posSummary: {
    saleCount: number
    totalRevenue: number
    totalProfit: number
  }
  totalExpenses: number
  netProfit: number
  jobs: any[]
}

export interface WorkerJob {
  id: number
  description?: string
  completedAt: string
  repairFee: number
  workerProfit: number
}

export interface WorkerEarningsStatementProps {
  worker: { displayName: string }
  dateRange: { from: string; to: string }
  jobs: WorkerJob[]
  totalEarnings: number
  totalJobs: number
}

export interface CatalogPart {
  name: string
  category?: string
  sellPrice: number
  quantity: number
}

export interface PartsCatalogProps {
  parts: CatalogPart[]
  generatedAt: string
}

export interface CustomerStatementJob {
  id: number
  createdAt: string
  description?: string
  totalAmount: number
  amountPaid: number
  paymentStatus: string
}

export interface CustomerStatementProps {
  customer: {
    name: string
    phone?: string
    motorcycle?: string
  }
  jobs: CustomerStatementJob[]
  totalSpent: number
  totalPaid: number
  outstanding: number
}

export interface InventoryPart {
  name: string
  category?: string
  quantity: number
  buyPrice: number
  sellPrice: number
  minStock: number
}

export interface InventoryValuationProps {
  parts: InventoryPart[]
  totals: {
    totalParts: number
    totalValue: number
    totalSellValue: number
    lowStockCount: number
    outOfStockCount: number
  }
  generatedAt: string
}

export interface DailyData {
  date: string
  jobRevenue: number
  posRevenue: number
  totalRevenue: number
  jobCount: number
  posCount: number
}

export interface PosSaleDetail {
  id: number
  createdAt: string
  cashierName: string
  customerName?: string
  total: number
  items: { partName: string; quantity: number; unitPrice: number; lineTotal: number }[]
}

export interface SalesSummaryProps {
  dateRange: { from: string; to: string }
  dailyData: DailyData[]
  totals: {
    totalJobRevenue: number
    totalPosRevenue: number
    totalRevenue: number
  }
  posSales?: PosSaleDetail[]
}
