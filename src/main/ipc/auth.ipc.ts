import { ipcMain } from 'electron'
import { authService } from '../services/auth.service'

export function registerAuthIpc() {
  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
      return { success: true, data: authService.login(username, password) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    try {
      authService.logout()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:session', async () => {
    try {
      return { success: true, data: authService.getSession() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:verify-password', async (_event, userId: number, password: string) => {
    try {
      return { success: true, data: authService.verifyPassword(userId, password) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:change-password', async (_event, userId: number, oldPassword: string, newPassword: string) => {
    try {
      authService.changePassword(userId, oldPassword, newPassword)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
