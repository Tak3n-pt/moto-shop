import { ipcMain } from 'electron'
import { expensesService } from '../services/expenses.service'

export function registerExpensesIpc() {
  ipcMain.handle('expenses:getAll', async (_event, page?: number, limit?: number) => {
    try {
      return { success: true, data: expensesService.getAll(page, limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:getById', async (_event, id: number) => {
    try {
      return { success: true, data: expensesService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:create', async (_event, data: any) => {
    try {
      return { success: true, data: expensesService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: expensesService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:delete', async (_event, id: number) => {
    try {
      expensesService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:getByDateRange', async (_event, from: string, to: string) => {
    try {
      return { success: true, data: expensesService.getByDateRange(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('expenses:getTotalByDateRange', async (_event, from: string, to: string) => {
    try {
      return { success: true, data: expensesService.getTotalByDateRange(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
