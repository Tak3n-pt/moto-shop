import { ipcMain } from 'electron'
import { jobsService } from '../services/jobs.service'

export function registerJobsIpc() {
  ipcMain.handle('jobs:getAll', async (_event, filters?: any) => {
    try {
      return { success: true, data: jobsService.getAll(filters) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getById', async (_event, id: number) => {
    try {
      return { success: true, data: jobsService.getById(id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:create', async (_event, data: any) => {
    try {
      return { success: true, data: jobsService.create(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:update', async (_event, id: number, data: any) => {
    try {
      return { success: true, data: jobsService.update(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:delete', async (_event, id: number) => {
    try {
      jobsService.delete(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:updateStatus', async (_event, id: number, status: string) => {
    try {
      return { success: true, data: jobsService.updateStatus(id, status as any) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:updatePayment', async (_event, id: number, amountPaid: number) => {
    try {
      return { success: true, data: jobsService.updatePayment(id, amountPaid) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getStats', async (_event, from?: string, to?: string) => {
    try {
      return { success: true, data: jobsService.getStats(from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getWorkerStats', async (_event, workerId: number, from?: string, to?: string) => {
    try {
      return { success: true, data: jobsService.getWorkerStats(workerId, from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getWorkerJobs', async (_event, workerId: number, from: string, to: string) => {
    try {
      return { success: true, data: jobsService.getWorkerJobs(workerId, from, to) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getActiveCount', async () => {
    try {
      return { success: true, data: jobsService.getActiveCount() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('jobs:getRecent', async (_event, limit?: number) => {
    try {
      return { success: true, data: jobsService.getRecent(limit) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
