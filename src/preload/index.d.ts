interface IpcResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

interface Api {
  login(username: string, password: string): Promise<IpcResponse<{ userId: number; username: string; displayName: string; role: 'admin' | 'worker' }>>
  logout(): Promise<IpcResponse>
  getSession(): Promise<IpcResponse<{ userId: number; username: string; displayName: string; role: 'admin' | 'worker' } | null>>
  verifyPassword(userId: number, password: string): Promise<IpcResponse<boolean>>
  changePassword(userId: number, oldPassword: string, newPassword: string): Promise<IpcResponse>

  customers: {
    getAll(search?: string, page?: number, limit?: number): Promise<IpcResponse<PaginatedResponse>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
    getHistory(customerId: number): Promise<IpcResponse<any[]>>
    getStats(customerId: number): Promise<IpcResponse<any>>
    getDebts(): Promise<IpcResponse<{ jobDebts: any[]; posDebts: any[] }>>
  }

  parts: {
    getAll(search?: string, category?: string, page?: number, limit?: number): Promise<IpcResponse<PaginatedResponse>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
    getLowStock(): Promise<IpcResponse<any[]>>
    getLowStockCount(): Promise<IpcResponse<number>>
    getCategories(): Promise<IpcResponse<string[]>>
    search(query: string): Promise<IpcResponse<any[]>>
    getByBarcode(barcode: string): Promise<IpcResponse<any>>
  }

  jobs: {
    getAll(filters?: any): Promise<IpcResponse<PaginatedResponse>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
    updateStatus(id: number, status: string): Promise<IpcResponse<any>>
    updatePayment(id: number, amountPaid: number): Promise<IpcResponse<any>>
    getStats(from?: string, to?: string): Promise<IpcResponse<any>>
    getWorkerStats(workerId: number, from?: string, to?: string): Promise<IpcResponse<any>>
    getActiveCount(): Promise<IpcResponse<number>>
    getRecent(limit?: number): Promise<IpcResponse<any[]>>
  }

  purchase: {
    getAll(page?: number, limit?: number): Promise<IpcResponse<PaginatedResponse>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
  }

  reports: {
    profit(from: string, to: string): Promise<IpcResponse<any>>
    workerEarnings(from: string, to: string): Promise<IpcResponse<any>>
    inventory(): Promise<IpcResponse<any>>
    mostUsedParts(from: string, to: string, limit?: number): Promise<IpcResponse<any>>
    dailyRevenue(from: string, to: string): Promise<IpcResponse<any>>
  }

  expenses: {
    getAll(page?: number, limit?: number): Promise<IpcResponse<PaginatedResponse>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
    getByDateRange(from: string, to: string): Promise<IpcResponse<any[]>>
    getTotalByDateRange(from: string, to: string): Promise<IpcResponse<number>>
  }

  templates: {
    getAll(): Promise<IpcResponse<any[]>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
  }

  settings: {
    getAll(): Promise<IpcResponse<Record<string, string>>>
    get(key: string): Promise<IpcResponse<string | null>>
    set(key: string, value: string): Promise<IpcResponse>
    setMultiple(pairs: Record<string, string>): Promise<IpcResponse>
    getWorkers(): Promise<IpcResponse<any[]>>
    getAllUsers(): Promise<IpcResponse<any[]>>
    createWorker(data: any): Promise<IpcResponse<any>>
    updateWorker(id: number, data: any): Promise<IpcResponse<any>>
    resetWorkerPassword(id: number, newPassword: string): Promise<IpcResponse>
    backup(): Promise<IpcResponse<string>>
    restore(): Promise<IpcResponse<string>>
    selectBackupPath(): Promise<IpcResponse<string>>
    restartAutoBackup(): Promise<IpcResponse>
  }

  suppliers: {
    getAll(search?: string): Promise<IpcResponse<any[]>>
    getById(id: number): Promise<IpcResponse<any>>
    create(data: any): Promise<IpcResponse<any>>
    update(id: number, data: any): Promise<IpcResponse<any>>
    delete(id: number): Promise<IpcResponse>
  }

  search: {
    global(query: string): Promise<IpcResponse<any>>
  }

  pos: {
    createSale(data: any): Promise<IpcResponse<any>>
    getRecent(limit?: number): Promise<IpcResponse<any[]>>
    getSummary(range?: { from?: string; to?: string }): Promise<IpcResponse<{ saleCount: number; totalRevenue: number; totalItems: number; totalDue: number }>>
    getByDateRange(range?: { from?: string; to?: string }): Promise<IpcResponse<any[]>>
    getById(id: number): Promise<IpcResponse<any>>
    getOutstanding(): Promise<IpcResponse<any[]>>
  }
}

declare global {
  interface Window {
    api: Api
  }
}
