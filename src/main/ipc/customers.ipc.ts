import { ipcMain } from 'electron'
import { customersService } from '../services/customers.service'

export function registerCustomersIpc() {
  ipcMain.handle('customers:getAll', async (_event, search?: string, page?: number, limit?: number) => {
    try {
      return { success: true, data: customersService.getAll(search, page, limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:getById', async (_event, id: number) => {
    try {
      return { success: true, data: customersService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:create', async (_event, data: any) => {
    try {
      return { success: true, data: customersService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: customersService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:delete', async (_event, id: number) => {
    try {
      customersService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:getHistory', async (_event, customerId: number) => {
    try {
      return { success: true, data: customersService.getHistory(customerId) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:getStats', async (_event, customerId: number) => {
    try {
      return { success: true, data: customersService.getStats(customerId) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('customers:getDebts', async () => {
    try {
      return { success: true, data: customersService.getDebts() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
