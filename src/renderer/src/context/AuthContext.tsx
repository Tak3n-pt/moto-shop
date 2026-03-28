import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import i18n from '../i18n'

interface User {
  userId: number
  username: string
  displayName: string
  role: 'admin' | 'worker'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.settings.get('language').then((res) => {
      if (res.success && res.data) {
        i18n.changeLanguage(res.data)
      }
    })
    window.api.settings.get('theme').then((res) => {
      const theme = (res.success && res.data) ? res.data : 'dark'
      document.documentElement.classList.toggle('dark', theme === 'dark')
    })
    window.api.getSession().then((res) => {
      if (res.success && res.data) {
        setUser(res.data)
      }
      setLoading(false)
    })
  }, [])

  const login = async (username: string, password: string) => {
    const res = await window.api.login(username, password)
    if (!res.success) throw new Error(res.error || 'Login failed')
    setUser(res.data!)
  }

  const logout = async () => {
    await window.api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
