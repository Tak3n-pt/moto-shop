import { ipcMain } from 'electron'
import { jobTemplatesService } from '../services/job-templates.service'

export function registerTemplatesIpc() {
  ipcMain.handle('templates:getAll', async () => {
    try {
      return { success: true, data: jobTemplatesService.getAll() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:getById', async (_event, id: number) => {
    try {
      return { success: true, data: jobTemplatesService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:create', async (_event, data: any) => {
    try {
      return { success: true, data: jobTemplatesService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: jobTemplatesService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:delete', async (_event, id: number) => {
    try {
      jobTemplatesService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
