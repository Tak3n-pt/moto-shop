import { ipcMain } from 'electron'
import { reportsService } from '../services/reports.service'

export function registerReportsIpc() {
  ipcMain.handle('reports:profit', async (_event, from: string, to: string) => {
    try {
      return { success: true, data: reportsService.profitReport(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reports:workerEarnings', async (_event, from: string, to: string) => {
    try {
      return { success: true, data: reportsService.workerEarnings(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reports:inventory', async () => {
    try {
      return { success: true, data: reportsService.inventoryReport() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reports:mostUsedParts', async (_event, from: string, to: string, limit?: number) => {
    try {
      return { success: true, data: reportsService.mostUsedParts(from, to, limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reports:dailyRevenue', async (_event, from: string, to: string) => {
    try {
      return { success: true, data: reportsService.dailyRevenue(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
