import { getDb } from '../db/connection'
import { users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

interface Session {
  userId: number
  username: string
  displayName: string
  role: 'admin' | 'worker'
}

let currentSession: Session | null = null

export const authService = {
  login(username: string, password: string): Session {
    const db = getDb()
    const user = db.select().from(users).where(and(eq(users.username, username), eq(users.isActive, true))).get()
    if (!user) throw new Error('Invalid credentials')
    if (!bcrypt.compareSync(password, user.passwordHash)) throw new Error('Invalid credentials')
    currentSession = { userId: user.id, username: user.username, displayName: user.displayName, role: user.role as 'admin' | 'worker' }
    return currentSession
  },

  logout() {
    currentSession = null
  },

  getSession(): Session | null {
    return currentSession
  },

  verifyPassword(userId: number, password: string): boolean {
    if (!password || userId <= 0) return false
    const db = getDb()
    const user = db.select().from(users).where(and(eq(users.id, userId), eq(users.isActive, true))).get()
    // Always run bcrypt to prevent timing attacks
    const hash = user?.passwordHash || '$2a$10$000000000000000000000uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    const valid = bcrypt.compareSync(password, hash)
    return user ? valid : false
  },

  changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Verify caller is changing their own password
    if (!currentSession || currentSession.userId !== userId) {
      throw new Error('Unauthorized')
    }
    if (!newPassword || newPassword.length < 4) throw new Error('Password must be at least 4 characters')
    const db = getDb()
    const user = db.select().from(users).where(and(eq(users.id, userId), eq(users.isActive, true))).get()
    if (!user) throw new Error('User not found')
    if (!bcrypt.compareSync(oldPassword, user.passwordHash)) throw new Error('Invalid old password')
    const hash = bcrypt.hashSync(newPassword, 10)
    db.update(users).set({ passwordHash: hash, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run()
  }
}
