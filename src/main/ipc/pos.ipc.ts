import { ipcMain } from 'electron'
import { posService } from '../services/pos.service'

export function registerPosIpc() {
  ipcMain.handle('pos:create', async (_event, data) => {
    try {
      return { success: true, data: posService.createSale(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:getRecent', async (_event, limit?: number, cashierId?: number) => {
    try {
      return { success: true, data: posService.getRecent(limit, cashierId) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:getSummary', async (_event, range?: { from?: string; to?: string; cashierId?: number }) => {
    try {
      return { success: true, data: posService.getSummary(range?.from, range?.to, range?.cashierId) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:getByDateRange', async (_event, range?: { from?: string; to?: string }) => {
    try {
      const from = range?.from
      const to = range?.to
      return { success: true, data: posService.getByDateRange(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:getById', async (_event, id: number) => {
    try {
      return { success: true, data: posService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:updatePayment', async (_event, id: number, cashReceived: number) => {
    try {
      return { success: true, data: posService.updatePayment(id, cashReceived) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pos:getOutstanding', async () => {
    try {
      return { success: true, data: posService.getOutstanding() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
