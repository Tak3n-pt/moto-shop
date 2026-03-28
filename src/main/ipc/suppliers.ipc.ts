import { ipcMain } from 'electron'
import { suppliersService } from '../services/suppliers.service'

export function registerSuppliersIpc() {
  ipcMain.handle('suppliers:getAll', async (_event, search?: string) => {
    try {
      return { success: true, data: suppliersService.getAll(search) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('suppliers:getById', async (_event, id: number) => {
    try {
      return { success: true, data: suppliersService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('suppliers:create', async (_event, data: any) => {
    try {
      return { success: true, data: suppliersService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('suppliers:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: suppliersService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('suppliers:delete', async (_event, id: number) => {
    try {
      suppliersService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
