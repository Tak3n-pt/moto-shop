import { getDb, getSqlite, getDbPath, closeDb } from '../db/connection'
import { settings, users, jobs } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { copyFileSync, existsSync } from 'fs'
import { dialog, BrowserWindow } from 'electron'

export const settingsService = {
  getAll() {
    const db = getDb()
    const rows = db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value || ''
    }
    return result
  },

  get(key: string) {
    const db = getDb()
    const row = db.select().from(settings).where(eq(settings.key, key)).get()
    return row?.value || null
  },

  set(key: string, value: string) {
    const db = getDb()
    const existing = db.select().from(settings).where(eq(settings.key, key)).get()
    if (existing) {
      db.update(settings).set({ value }).where(eq(settings.key, key)).run()
    } else {
      db.insert(settings).values({ key, value }).run()
    }
  },

  setMultiple(pairs: Record<string, string>) {
    const db = getDb()
    for (const [key, value] of Object.entries(pairs)) {
      const existing = db.select().from(settings).where(eq(settings.key, key)).get()
      if (existing) {
        db.update(settings).set({ value }).where(eq(settings.key, key)).run()
      } else {
        db.insert(settings).values({ key, value }).run()
      }
    }
  },

  // Worker management
  getWorkers() {
    const db = getDb()
    return db.select({ id: users.id, username: users.username, displayName: users.displayName, role: users.role, phone: users.phone, isActive: users.isActive, createdAt: users.createdAt }).from(users).where(eq(users.role, 'worker')).all()
  },

  getAllUsers() {
    const db = getDb()
    return db.select({ id: users.id, username: users.username, displayName: users.displayName, role: users.role, phone: users.phone, isActive: users.isActive, createdAt: users.createdAt }).from(users).all()
  },

  createWorker(data: { username: string; password: string; displayName: string; phone?: string }) {
    const db = getDb()
    const hash = bcrypt.hashSync(data.password, 10)
    return db.insert(users).values({ username: data.username, passwordHash: hash, displayName: data.displayName, role: 'worker', phone: data.phone }).returning().get()
  },

  updateWorker(id: number, data: Partial<{ displayName: string; phone: string; isActive: boolean }>) {
    const db = getDb()
    // If deactivating, check for active jobs assigned to this worker
    if (data.isActive === false) {
      const activeJobCount = db.select({ count: sql<number>`count(*)` }).from(jobs)
        .where(and(eq(jobs.workerId, id), sql`${jobs.status} IN ('pending', 'in_progress')`))
        .get()
      if (activeJobCount && activeJobCount.count > 0) {
        throw new Error('Cannot deactivate worker with active jobs')
      }
    }
    // Whitelist fields to prevent role/password escalation
    const safe: Record<string, any> = { updatedAt: new Date().toISOString() }
    if (data.displayName !== undefined) safe.displayName = data.displayName
    if (data.phone !== undefined) safe.phone = data.phone
    if (data.isActive !== undefined) safe.isActive = data.isActive
    return db.update(users).set(safe).where(eq(users.id, id)).returning().get()
  },

  resetWorkerPassword(id: number, newPassword: string) {
    const db = getDb()
    const hash = bcrypt.hashSync(newPassword, 10)
    db.update(users).set({ passwordHash: hash, updatedAt: new Date().toISOString() }).where(eq(users.id, id)).run()
  },

  async backupDatabase() {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'Backup Database',
      defaultPath: `moto-shop-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    })
    if (result.canceled || !result.filePath) return null
    // Flush WAL data into main DB file before copying
    const sqlite = getSqlite()
    sqlite.pragma('wal_checkpoint(TRUNCATE)')
    const dbPath = getDbPath()
    copyFileSync(dbPath, result.filePath)
    return result.filePath
  },

  async restoreDatabase() {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'Restore Database',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const sourcePath = result.filePaths[0]
    if (!existsSync(sourcePath)) throw new Error('File not found')
    const dbPath = getDbPath()
    closeDb()
    copyFileSync(sourcePath, dbPath)
    // Re-initialize by calling getDb
    getDb()
    return sourcePath
  }
}
