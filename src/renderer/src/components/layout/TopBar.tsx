import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { UserCog, Lock, ShieldCheck, Bell, Search, AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import GlobalSearch from '@/components/layout/GlobalSearch'
import { cn, getInitials } from '@/lib/utils'
import { GearIcon, ChainLinkIcon } from '@/components/icons/MotoIcons'

export default function TopBar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeView, workers, unlockedWorkers, showLoginModal, isSecurityLocked,
    openWorkerTab, closeWorkerView, unlockWorker, setShowLoginModal, setActiveView
  } = useWorkerTab()

  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showAdminSwitch, setShowAdminSwitch] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminVerifying, setAdminVerifying] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'admin'
  const isWorkerRole = user?.role === 'worker'
  const isWorkerMode = typeof activeView === 'number'

  useEffect(() => {
    const fetchLowStock = async () => {
      const countRes = await window.api.parts.getLowStockCount()
      if (countRes.success) setLowStockCount(countRes.data || 0)
    }
    fetchLowStock()
    const interval = setInterval(fetchLowStock, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const handleBellClick = async () => {
    if (!showNotifications) {
      const res = await window.api.parts.getLowStock()
      if (res.success) setLowStockItems(res.data || [])
    }
    setShowNotifications(!showNotifications)
  }

  const handleAdminClick = () => {
    if (isWorkerMode) {
      // In worker mode — require admin password to switch back
      setShowAdminSwitch(true)
      setAdminPassword('')
      setAdminError('')
      return
    }
    setActiveView('page')
    navigate('/workers')
  }

  const handleAdminSwitchVerify = async () => {
    if (!adminPassword.trim() || !user) return
    setAdminVerifying(true)
    setAdminError('')
    const res = await window.api.verifyPassword(user.userId, adminPassword)
    setAdminVerifying(false)
    if (res.success && res.data) {
      setShowAdminSwitch(false)
      setAdminPassword('')
      closeWorkerView()
      navigate('/')
    } else {
      setAdminError(t('auth.invalidCredentials'))
    }
  }

  const handleAdminSwitchCancel = () => {
    setShowAdminSwitch(false)
    setAdminPassword('')
    setAdminError('')
  }

  const handleWorkerClick = (w: any) => {
    if (!w.isActive) return
    openWorkerTab(w.id)
  }

  const handleVerifyPassword = async () => {
    if (!showLoginModal || !loginPassword.trim()) return
    const workerId = showLoginModal
    setVerifying(true)
    setLoginError('')

    // Try worker's own password first
    let res = await window.api.verifyPassword(workerId, loginPassword)

    // If failed and logged-in user is admin, try admin's password too
    if (!(res.success && res.data) && user?.role === 'admin' && user.userId !== workerId) {
      res = await window.api.verifyPassword(user.userId, loginPassword)
    }

    setVerifying(false)
    if (res.success && res.data) {
      unlockWorker(workerId)
      setLoginPassword('')
    } else {
      setLoginError(t('auth.invalidCredentials'))
    }
  }

  const handleLoginCancel = () => {
    const workerId = showLoginModal
    setShowLoginModal(null)
    setLoginPassword('')
    setLoginError('')
    // When security-locked (auto-lock fired), stay in locked worker mode — both
    // worker tab and admin switch require re-authentication to proceed
    if (isSecurityLocked) return
    // Normal case: localStorage restore — admin just opened app, let them dismiss to admin mode
    if (activeView === workerId && !unlockedWorkers.has(workerId as number)) {
      closeWorkerView()
    }
  }

  const loginWorker = workers.find(w => w.id === showLoginModal)

  // Worker role: only show their own tab
  const visibleWorkers = isWorkerRole
    ? workers.filter(w => w.id === user?.userId)
    : workers

  const isAdminTabActive = activeView === 'page' && location.pathname === '/workers'

  return (
    <>
      <div className="sticky top-0 z-30 h-16 backdrop-blur-sm bg-bg-secondary/95 border-b border-border-primary flex items-center px-6 gap-3">
        {/* Background gear decoration */}
        <GearIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-20 h-20 text-okba-500 opacity-[0.02] animate-slow-rotate pointer-events-none" />
        {/* Admin Tab — for admin role, shows switch prompt in worker mode */}
        {isAdmin && (
          <>
            <button
              onClick={handleAdminClick}
              className={cn(
                'flex items-center gap-2.5 px-4 h-full transition-all relative',
                isWorkerMode
                  ? 'hover:bg-bg-hover opacity-60'
                  : isAdminTabActive ? '' : 'hover:bg-bg-hover'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                isWorkerMode
                  ? 'bg-bg-tertiary text-text-disabled'
                  : isAdminTabActive
                    ? 'bg-shop-steel-500/15 text-shop-steel-500'
                    : 'bg-bg-tertiary text-text-tertiary'
              )}>
                {isWorkerMode ? <ShieldCheck size={18} /> : <UserCog size={18} />}
              </div>
              <span className={cn(
                'text-sm font-semibold transition-colors',
                isWorkerMode
                  ? 'text-text-disabled'
                  : isAdminTabActive ? 'text-shop-steel-500' : 'text-text-secondary'
              )}>{isWorkerMode ? t('common.switchAdmin') || 'Admin' : 'Admin'}</span>
              {isAdminTabActive && !isWorkerMode && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-shop-steel-500" />
              )}
            </button>

            {/* Chain-link divider */}
            <div className="flex flex-col items-center justify-center mx-2 opacity-25">
              <ChainLinkIcon className="w-5 h-3 text-okba-500" />
            </div>
          </>
        )}

        {/* Worker Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 h-full scrollbar-hide">
          {visibleWorkers.map(w => {
            const isActive = activeView === w.id
            const isLocked = !unlockedWorkers.has(w.id)
            const isDisabled = !w.isActive

            return (
              <button
                key={w.id}
                onClick={() => handleWorkerClick(w)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-3 h-full transition-all relative',
                  isDisabled
                    ? 'opacity-30 cursor-not-allowed'
                    : isActive
                      ? ''
                      : 'hover:bg-bg-hover cursor-pointer'
                )}
              >
                <div className="relative">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isDisabled
                      ? 'bg-text-disabled/10 text-text-disabled'
                      : isActive
                        ? 'bg-money-worker text-white'
                        : 'bg-money-worker/15 text-money-worker'
                  )}>
                    {getInitials(w.displayName)}
                  </div>
                  {!isDisabled && isLocked && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg-secondary border border-border-primary flex items-center justify-center">
                      <Lock size={8} className="text-text-disabled" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium whitespace-nowrap transition-colors',
                  isDisabled
                    ? 'text-text-disabled line-through'
                    : isActive ? 'text-money-worker' : 'text-text-secondary'
                )}>{w.displayName}</span>
                {isActive && !isDisabled && (
                  <div className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-money-worker" />
                )}
              </button>
            )
          })}
        </div>

        {/* Search & Notifications */}
        <div className="flex items-center gap-2 ml-auto shrink-0 pl-3">
          <button onClick={() => setShowSearch(true)} className="p-2.5 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors" title={t('search.hint')}>
            <Search size={20} />
          </button>
          <div ref={bellRef} className="relative">
            <button onClick={handleBellClick} className="p-2.5 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors relative" title={t('notifications.title')}>
              <Bell size={20} />
              {lowStockCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[20px] h-5 bg-status-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1">
                  {lowStockCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-primary rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border-primary">
                  <h3 className="text-sm font-semibold text-text-primary">{t('notifications.title')}</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {lowStockItems.length === 0 ? (
                    <p className="text-center text-text-tertiary text-sm py-6">{t('notifications.noAlerts')}</p>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="px-4 py-3 border-b border-border-primary last:border-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-status-error/10 flex items-center justify-center">
                          <AlertTriangle size={16} className="text-status-error" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{item.name}</p>
                          <p className="text-xs text-text-tertiary">
                            {t('notifications.lowStockMessage', { name: item.name, quantity: item.quantity, minStock: item.minStock })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Worker Password Login Modal */}
      <Modal isOpen={!!showLoginModal} onClose={handleLoginCancel} title={t('workers.enterPassword')} size="sm" footer={
        <>
          <Button variant="secondary" onClick={handleLoginCancel}>{t('common.cancel')}</Button>
          <Button onClick={handleVerifyPassword} disabled={verifying}>{verifying ? t('common.loading') : t('common.confirm')}</Button>
        </>
      }>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-money-worker/20 flex items-center justify-center text-sm font-bold text-money-worker">
              {getInitials(loginWorker?.displayName || '')}
            </div>
            <span className="font-medium text-text-primary">{loginWorker?.displayName}</span>
          </div>
          <Input
            label={t('auth.password')}
            type="password"
            value={loginPassword}
            onChange={e => { setLoginPassword(e.target.value); setLoginError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleVerifyPassword() }}
            autoFocus
          />
          {loginError && <p className="text-sm text-status-error">{loginError}</p>}
        </div>
      </Modal>

      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Admin Switch Modal — requires admin password to exit worker mode */}
      <Modal isOpen={showAdminSwitch} onClose={handleAdminSwitchCancel} title={t('common.switchAdmin') || 'Switch to Admin'} size="sm" footer={
        <>
          <Button variant="secondary" onClick={handleAdminSwitchCancel}>{t('common.cancel')}</Button>
          <Button onClick={handleAdminSwitchVerify} disabled={adminVerifying}>{adminVerifying ? t('common.loading') : t('common.confirm')}</Button>
        </>
      }>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-shop-steel-500/20 flex items-center justify-center text-sm font-bold text-shop-steel-500">
              {getInitials(user?.displayName || '')}
            </div>
            <span className="font-medium text-text-primary">{user?.displayName}</span>
          </div>
          <Input
            label={t('auth.password')}
            type="password"
            value={adminPassword}
            onChange={e => { setAdminPassword(e.target.value); setAdminError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdminSwitchVerify() }}
            autoFocus
          />
          {adminError && <p className="text-sm text-status-error">{adminError}</p>}
        </div>
      </Modal>
    </>
  )
}
