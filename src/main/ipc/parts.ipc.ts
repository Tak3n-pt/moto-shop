import { ipcMain } from 'electron'
import { partsService } from '../services/parts.service'

export function registerPartsIpc() {
  ipcMain.handle('parts:getAll', async (_event, search?: string, category?: string, page?: number, limit?: number) => {
    try {
      return { success: true, data: partsService.getAll(search, category, page, limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:getCategories', async () => {
    try {
      return { success: true, data: partsService.getCategories() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:getById', async (_event, id: number) => {
    try {
      return { success: true, data: partsService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:create', async (_event, data: any) => {
    try {
      return { success: true, data: partsService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: partsService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:delete', async (_event, id: number) => {
    try {
      partsService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:getLowStock', async () => {
    try {
      return { success: true, data: partsService.getLowStock() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:getLowStockCount', async () => {
    try {
      return { success: true, data: partsService.getLowStockCount() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:search', async (_event, query: string) => {
    try {
      return { success: true, data: partsService.search(query) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('parts:getByBarcode', async (_event, barcode: string) => {
    try {
      return { success: true, data: partsService.getByBarcode(barcode) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
