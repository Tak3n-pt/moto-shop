import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAllIpc } from './ipc'
import { runMigrations } from './db/migrate'
import { closeDb, getDbPath, getSqlite } from './db/connection'
import { settingsService } from './services/settings.service'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f1012',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url === '' || details.url === 'about:blank') {
      return { action: 'allow' }
    }
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.moto-shop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database and IPC
  runMigrations()
  registerAllIpc()

  // Print handler — uses Electron's native print
  ipcMain.handle('app:print', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window' }
    return new Promise((resolve) => {
      win.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
        resolve({ success, error: failureReason || undefined })
      })
    })
  })

  createWindow()
  startAutoBackup()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

let autoBackupTimer: ReturnType<typeof setInterval> | null = null

function startAutoBackup(): void {
  if (autoBackupTimer) clearInterval(autoBackupTimer)

  const enabled = settingsService.get('auto_backup_enabled')
  if (enabled !== 'true') return

  const intervalHours = Number(settingsService.get('auto_backup_interval') || '24')
  const backupPath = settingsService.get('auto_backup_path')
  if (!backupPath) return

  const intervalMs = intervalHours * 60 * 60 * 1000

  autoBackupTimer = setInterval(() => {
    try {
      if (!existsSync(backupPath)) mkdirSync(backupPath, { recursive: true })
      const sqlite = getSqlite()
      sqlite.pragma('wal_checkpoint(TRUNCATE)')
      const dbPath = getDbPath()
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const dest = join(backupPath, `moto-shop-auto-${timestamp}.db`)
      copyFileSync(dbPath, dest)
      settingsService.set('auto_backup_last', new Date().toISOString())
    } catch (_) { /* silent fail for auto-backup */ }
  }, intervalMs)
}

// Allow renderer to restart the auto-backup timer after settings change
ipcMain.handle('settings:restartAutoBackup', async () => {
  try {
    startAutoBackup()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDb()
})
