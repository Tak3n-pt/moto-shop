import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WorkerTabState {
  activeView: 'page' | number
  workerProfileVisible: boolean
  workers: any[]
  unlockedWorkers: Set<number>
  showLoginModal: number | null
  isSecurityLocked: boolean
  openWorkerTab: (workerId: number) => void
  closeWorkerView: () => void
  hideWorkerProfile: () => void
  unlockWorker: (workerId: number) => void
  setShowLoginModal: (id: number | null) => void
  loadWorkers: () => Promise<void>
  setActiveView: (view: 'page' | number) => void
}

const WorkerTabContext = createContext<WorkerTabState | null>(null)

const STORAGE_KEY = 'topbar-active-view'

export function WorkerTabProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeView, setActiveViewState] = useState<'page' | number>('page')
  const [workerProfileVisible, setWorkerProfileVisible] = useState(false)
  const [workers, setWorkers] = useState<any[]>([])
  const [unlockedWorkers, setUnlockedWorkers] = useState<Set<number>>(new Set())
  const [showLoginModal, setShowLoginModal] = useState<number | null>(null)
  const [isSecurityLocked, setIsSecurityLocked] = useState(false)
  const hasRestored = useRef(false)
  const hasWorkerInit = useRef(false)
  const activeViewRef = useRef<'page' | number>('page')

  const loadWorkers = useCallback(async () => {
    const res = await window.api.settings.getWorkers()
    if (res.success) {
      setWorkers(res.data || [])
    }
  }, [])

  // Load workers on mount
  useEffect(() => { loadWorkers() }, [loadWorkers])

  // Keep ref in sync for the auto-lock timer closure
  useEffect(() => { activeViewRef.current = activeView }, [activeView])

  // Restore last view from localStorage — admin only, once after initial workers load
  useEffect(() => {
    if (workers.length === 0 || hasRestored.current || user?.role === 'worker') return
    hasRestored.current = true
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved !== 'page') {
      const savedId = Number(saved)
      const w = workers.find((x: any) => x.id === savedId && x.isActive)
      if (w) {
        setActiveViewState(savedId)
        setWorkerProfileVisible(true)
        setShowLoginModal(savedId)
      }
    }
  }, [workers, user])

  // Reset refs on logout so next login cycle works correctly
  useEffect(() => {
    if (!user) {
      hasWorkerInit.current = false
      hasRestored.current = false
      setUnlockedWorkers(new Set())
      setActiveViewState('page')
      setWorkerProfileVisible(false)
      setIsSecurityLocked(false)
      setShowLoginModal(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  // For worker-role users: auto-unlock to their own userId (they already authenticated at login)
  useEffect(() => {
    if (hasWorkerInit.current) return
    if (user?.role === 'worker' && workers.length > 0) {
      const workerExists = workers.find(w => w.id === user.userId)
      if (workerExists) {
        hasWorkerInit.current = true
        setUnlockedWorkers(prev => new Set(prev).add(user.userId))
        setActiveViewState(user.userId)
        setWorkerProfileVisible(true)
        setShowLoginModal(null)
      }
    }
  }, [user, workers])

  const setActiveView = useCallback((view: 'page' | number) => {
    setActiveViewState(view)
    localStorage.setItem(STORAGE_KEY, String(view))
  }, [])

  const openWorkerTab = useCallback((workerId: number) => {
    if (unlockedWorkers.has(workerId)) {
      setActiveView(workerId)
      setWorkerProfileVisible(true)
    } else {
      setShowLoginModal(workerId)
    }
  }, [unlockedWorkers, setActiveView])

  // Fully exit worker mode — back to admin/page mode
  const closeWorkerView = useCallback(() => {
    setActiveView('page')
    setWorkerProfileVisible(false)
    setIsSecurityLocked(false)
  }, [setActiveView])

  // Hide profile but stay in worker mode (for sidebar navigation)
  const hideWorkerProfile = useCallback(() => {
    setWorkerProfileVisible(false)
  }, [])

  const unlockWorker = useCallback((workerId: number) => {
    setUnlockedWorkers(prev => new Set(prev).add(workerId))
    setActiveView(workerId)
    setWorkerProfileVisible(true)
    setShowLoginModal(null)
    setIsSecurityLocked(false)
  }, [setActiveView])

  // Auto-lock worker tabs after 5 minutes of inactivity
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetLockTimer = useCallback(() => {
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current)
    lockTimeoutRef.current = setTimeout(() => {
      setUnlockedWorkers(new Set())
      const currentView = activeViewRef.current
      if (typeof currentView === 'number') {
        // Stay in worker view but locked — require re-auth
        setIsSecurityLocked(true)
        setShowLoginModal(currentView)
      }
      setWorkerProfileVisible(false)
    }, 5 * 60 * 1000) // 5 minutes
  }, [])

  useEffect(() => {
    if (unlockedWorkers.size === 0) return

    const handler = () => resetLockTimer()
    window.addEventListener('mousemove', handler)
    window.addEventListener('keydown', handler)
    window.addEventListener('click', handler)
    resetLockTimer()

    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('click', handler)
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current)
    }
  }, [unlockedWorkers.size, resetLockTimer])

  return (
    <WorkerTabContext.Provider value={{
      activeView, workerProfileVisible, workers, unlockedWorkers, showLoginModal, isSecurityLocked,
      openWorkerTab, closeWorkerView, hideWorkerProfile, unlockWorker,
      setShowLoginModal, loadWorkers, setActiveView
    }}>
      {children}
    </WorkerTabContext.Provider>
  )
}

export function useWorkerTab() {
  const ctx = useContext(WorkerTabContext)
  if (!ctx) throw new Error('useWorkerTab must be used within WorkerTabProvider')
  return ctx
}
