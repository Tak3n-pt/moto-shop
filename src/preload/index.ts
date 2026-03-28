import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Auth
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),
  verifyPassword: (userId: number, password: string) =>
    ipcRenderer.invoke('auth:verify-password', userId, password),
  changePassword: (userId: number, oldPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:change-password', userId, oldPassword, newPassword),

  // Customers
  customers: {
    getAll: (search?: string, page?: number, limit?: number) => ipcRenderer.invoke('customers:getAll', search, page, limit),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (data: any) => ipcRenderer.invoke('customers:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
    getHistory: (customerId: number) => ipcRenderer.invoke('customers:getHistory', customerId),
    getStats: (customerId: number) => ipcRenderer.invoke('customers:getStats', customerId),
    getDebts: () => ipcRenderer.invoke('customers:getDebts')
  },

  // Parts
  parts: {
    getAll: (search?: string, category?: string, page?: number, limit?: number) => ipcRenderer.invoke('parts:getAll', search, category, page, limit),
    getCategories: () => ipcRenderer.invoke('parts:getCategories'),
    getById: (id: number) => ipcRenderer.invoke('parts:getById', id),
    create: (data: any) => ipcRenderer.invoke('parts:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('parts:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('parts:delete', id),
    getLowStock: () => ipcRenderer.invoke('parts:getLowStock'),
    getLowStockCount: () => ipcRenderer.invoke('parts:getLowStockCount'),
    search: (query: string) => ipcRenderer.invoke('parts:search', query),
    getByBarcode: (barcode: string) => ipcRenderer.invoke('parts:getByBarcode', barcode)
  },

  // Jobs
  jobs: {
    getAll: (filters?: any) => ipcRenderer.invoke('jobs:getAll', filters),
    getById: (id: number) => ipcRenderer.invoke('jobs:getById', id),
    create: (data: any) => ipcRenderer.invoke('jobs:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('jobs:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('jobs:delete', id),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('jobs:updateStatus', id, status),
    updatePayment: (id: number, amountPaid: number) => ipcRenderer.invoke('jobs:updatePayment', id, amountPaid),
    getStats: (from?: string, to?: string) => ipcRenderer.invoke('jobs:getStats', from, to),
    getWorkerStats: (workerId: number, from?: string, to?: string) =>
      ipcRenderer.invoke('jobs:getWorkerStats', workerId, from, to),
    getWorkerJobs: (workerId: number, from: string, to: string) => ipcRenderer.invoke('jobs:getWorkerJobs', workerId, from, to),
    getActiveCount: () => ipcRenderer.invoke('jobs:getActiveCount'),
    getRecent: (limit?: number) => ipcRenderer.invoke('jobs:getRecent', limit)
  },

  // Purchase
  purchase: {
    getAll: (page?: number, limit?: number) => ipcRenderer.invoke('purchase:getAll', page, limit),
    getById: (id: number) => ipcRenderer.invoke('purchase:getById', id),
    create: (data: any) => ipcRenderer.invoke('purchase:create', data)
  },

  // Reports
  reports: {
    profit: (from: string, to: string) => ipcRenderer.invoke('reports:profit', from, to),
    workerEarnings: (from: string, to: string) => ipcRenderer.invoke('reports:workerEarnings', from, to),
    inventory: () => ipcRenderer.invoke('reports:inventory'),
    mostUsedParts: (from: string, to: string, limit?: number) =>
      ipcRenderer.invoke('reports:mostUsedParts', from, to, limit),
    dailyRevenue: (from: string, to: string) => ipcRenderer.invoke('reports:dailyRevenue', from, to)
  },

  // Expenses
  expenses: {
    getAll: (page?: number, limit?: number) => ipcRenderer.invoke('expenses:getAll', page, limit),
    getById: (id: number) => ipcRenderer.invoke('expenses:getById', id),
    create: (data: any) => ipcRenderer.invoke('expenses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('expenses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('expenses:delete', id),
    getByDateRange: (from: string, to: string) => ipcRenderer.invoke('expenses:getByDateRange', from, to),
    getTotalByDateRange: (from: string, to: string) => ipcRenderer.invoke('expenses:getTotalByDateRange', from, to)
  },

  // Templates
  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    getById: (id: number) => ipcRenderer.invoke('templates:getById', id),
    create: (data: any) => ipcRenderer.invoke('templates:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('templates:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id)
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setMultiple: (pairs: Record<string, string>) => ipcRenderer.invoke('settings:setMultiple', pairs),
    getWorkers: () => ipcRenderer.invoke('settings:getWorkers'),
    getAllUsers: () => ipcRenderer.invoke('settings:getAllUsers'),
    createWorker: (data: any) => ipcRenderer.invoke('settings:createWorker', data),
    updateWorker: (id: number, data: any) => ipcRenderer.invoke('settings:updateWorker', id, data),
    resetWorkerPassword: (id: number, newPassword: string) =>
      ipcRenderer.invoke('settings:resetWorkerPassword', id, newPassword),
    backup: () => ipcRenderer.invoke('settings:backup'),
    restore: () => ipcRenderer.invoke('settings:restore'),
    selectBackupPath: () => ipcRenderer.invoke('settings:selectBackupPath'),
    restartAutoBackup: () => ipcRenderer.invoke('settings:restartAutoBackup')
  },

  // Suppliers
  suppliers: {
    getAll: (search?: string) => ipcRenderer.invoke('suppliers:getAll', search),
    getById: (id: number) => ipcRenderer.invoke('suppliers:getById', id),
    create: (data: any) => ipcRenderer.invoke('suppliers:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('suppliers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id),
    addDebt: (supplierId: number, amount: number, description?: string) => ipcRenderer.invoke('suppliers:addDebt', supplierId, amount, description),
    addPayment: (supplierId: number, amount: number, description?: string) => ipcRenderer.invoke('suppliers:addPayment', supplierId, amount, description),
    getDebts: () => ipcRenderer.invoke('suppliers:getDebts')
  },

  // Search
  search: {
    global: (query: string) => ipcRenderer.invoke('search:global', query)
  },

  // POS
  pos: {
    createSale: (data: any) => ipcRenderer.invoke('pos:create', data),
    getRecent: (limit?: number, cashierId?: number) => ipcRenderer.invoke('pos:getRecent', limit, cashierId),
    getSummary: (range?: { from?: string; to?: string; cashierId?: number }) => ipcRenderer.invoke('pos:getSummary', range),
    getByDateRange: (range?: { from?: string; to?: string }) => ipcRenderer.invoke('pos:getByDateRange', range),
    getById: (id: number) => ipcRenderer.invoke('pos:getById', id),
    getOutstanding: () => ipcRenderer.invoke('pos:getOutstanding'),
    updatePayment: (id: number, cashReceived: number) => ipcRenderer.invoke('pos:updatePayment', id, cashReceived)
  },

  // Print
  print: () => ipcRenderer.invoke('app:print')
}

contextBridge.exposeInMainWorld('api', api)
