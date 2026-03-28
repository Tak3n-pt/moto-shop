import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import * as schema from './schema'

let db: ReturnType<typeof drizzle>
let sqlite: Database.Database

export function getDb() {
  if (!db) {
    const dbPath = app.isPackaged
      ? join(app.getPath('userData'), 'moto-shop.db')
      : join(app.getAppPath(), 'moto-shop.db')

    sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    db = drizzle(sqlite, { schema })
  }
  return db
}

export function getSqlite() {
  if (!sqlite) getDb()
  return sqlite
}

export function getDbPath() {
  return app.isPackaged
    ? join(app.getPath('userData'), 'moto-shop.db')
    : join(app.getAppPath(), 'moto-shop.db')
}

export function closeDb() {
  if (sqlite) {
    sqlite.close()
    sqlite = null as any
    db = null as any
  }
}
