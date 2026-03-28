import { ipcMain } from 'electron'
import { purchaseService } from '../services/purchase.service'

export function registerPurchaseIpc() {
  ipcMain.handle('purchase:getAll', async (_event, page?: number, limit?: number) => {
    try {
      return { success: true, data: purchaseService.getAll(page, limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('purchase:getById', async (_event, id: number) => {
    try {
      return { success: true, data: purchaseService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('purchase:create', async (_event, data: any) => {
    try {
      return { success: true, data: purchaseService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
