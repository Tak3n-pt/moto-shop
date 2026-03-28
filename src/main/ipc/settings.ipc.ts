import { ipcMain } from 'electron'
import { settingsService } from '../services/settings.service'
import { authService } from '../services/auth.service'

function requireAuth() {
  const session = authService.getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

function requireAdmin() {
  const session = requireAuth()
  if (session.role !== 'admin') throw new Error('Unauthorized: admin required')
  return session
}

export function registerSettingsIpc() {
  // Read-only settings are public (needed for language/theme before login)
  ipcMain.handle('settings:getAll', async () => {
    try {
      return { success: true, data: settingsService.getAll() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:get', async (_event, key: string) => {
    try {
      return { success: true, data: settingsService.get(key) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    try {
      requireAdmin()
      settingsService.set(key, value)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:setMultiple', async (_event, pairs: Record<string, string>) => {
    try {
      requireAdmin()
      settingsService.setMultiple(pairs)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:getWorkers', async () => {
    try {
      requireAuth()
      return { success: true, data: settingsService.getWorkers() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:getAllUsers', async () => {
    try {
      requireAdmin()
      return { success: true, data: settingsService.getAllUsers() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:createWorker', async (_event, data: any) => {
    try {
      requireAdmin()
      return { success: true, data: settingsService.createWorker(data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:updateWorker', async (_event, id: number, data: any) => {
    try {
      requireAdmin()
      return { success: true, data: settingsService.updateWorker(id, data) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:resetWorkerPassword', async (_event, id: number, newPassword: string) => {
    try {
      requireAdmin()
      if (!newPassword || newPassword.length < 4) throw new Error('Password must be at least 4 characters')
      settingsService.resetWorkerPassword(id, newPassword)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:backup', async () => {
    try {
      requireAdmin()
      const path = await settingsService.backupDatabase()
      if (path) return { success: true, data: path }
      return { success: false, error: 'Cancelled' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:restore', async () => {
    try {
      requireAdmin()
      const path = await settingsService.restoreDatabase()
      if (path) return { success: true, data: path }
      return { success: false, error: 'Cancelled' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:selectBackupPath', async () => {
    try {
      const { dialog, BrowserWindow } = await import('electron')
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showOpenDialog(win!, {
        title: 'Select Backup Folder',
        properties: ['openDirectory']
      })
      if (result.canceled || !result.filePaths[0]) return { success: false, error: 'Cancelled' }
      return { success: true, data: result.filePaths[0] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
