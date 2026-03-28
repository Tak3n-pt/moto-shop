import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { LayoutDashboard, Users, Package, Wrench, BarChart3, UserCog, Settings, LogOut, Receipt, Truck, Wallet, ShoppingCart } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { GearIcon, ChainLinkIcon, MotorcycleSilhouette } from '@/components/icons/MotoIcons'
import logoImg from '@/assets/logo.png'

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { activeView, hideWorkerProfile } = useWorkerTab()

  const isWorkerMode = typeof activeView === 'number'
  const isAdmin = user?.role === 'admin' && !isWorkerMode

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },
    { to: '/pos', icon: ShoppingCart, label: t('nav.pos'), show: true },
    { to: '/customers', icon: Users, label: t('nav.customers'), show: true },
    { to: '/parts', icon: Package, label: t('nav.parts'), show: isAdmin },
    { to: '/jobs', icon: Wrench, label: t('nav.jobs'), show: true },
    { to: '/suppliers', icon: Truck, label: t('nav.suppliers'), show: isAdmin },
    { to: '/debts', icon: Wallet, label: t('nav.debts'), show: isAdmin },
    { to: '/expenses', icon: Receipt, label: t('nav.expenses'), show: isAdmin },
    { to: '/reports', icon: BarChart3, label: t('nav.reports'), show: isAdmin },
    { to: '/workers', icon: UserCog, label: t('nav.workers'), show: isAdmin },
    { to: '/settings', icon: Settings, label: t('nav.settings'), show: isAdmin }
  ]

  const handleLanguageChange = async (value: string) => {
    const lang = value as 'en' | 'ar' | 'fr'
    i18n.changeLanguage(lang)
    try {
      await window.api.settings.set('language', lang)
    } catch (err) {
      console.error('Failed to update language', err)
    }
  }

  const handleNavClick = () => {
    if (isWorkerMode) hideWorkerProfile()
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-bg-secondary border-r border-border-primary flex flex-col z-40 overflow-hidden">
      {/* Background gear decoration */}
      <GearIcon className="absolute -bottom-10 -right-10 w-40 h-40 text-okba-500 opacity-[0.02] animate-slow-rotate pointer-events-none" />

      <div className="h-28 flex items-center justify-center px-4 border-b border-border-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-okba-500/[0.04] to-transparent pointer-events-none" />
        <img
          src={logoImg}
          alt={t('app.logoAlt')}
          className="relative max-w-[230px] max-h-[100px] w-auto h-auto object-contain drop-shadow-sm"
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.show).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={handleNavClick}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive && !isWorkerMode ? 'bg-shop-steel-600 text-white' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            )}
          >
            <item.icon size={20} className="transition-transform duration-150 group-hover:scale-110" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4">
        <div className="mt-4 mb-6">
          <label className="block text-xs font-semibold text-text-tertiary mb-1">{t('auth.language')}</label>
          <select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-shop-steel-500"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="flex items-center justify-center gap-0 mb-4 opacity-20">
          {Array.from({ length: 5 }).map((_, i) => (
            <ChainLinkIcon key={i} className="w-6 h-3 text-okba-500 -mx-0.5" />
          ))}
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">
            {user ? getInitials(user.displayName) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
            <p className="text-xs text-text-tertiary capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-tertiary hover:text-status-error" title={t('nav.logout')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Bottom motorcycle silhouette */}
      <div className="px-5 pb-3 flex justify-center pointer-events-none">
        <MotorcycleSilhouette className="w-20 h-14 text-okba-500 opacity-30" />
      </div>
    </aside>
  )
}
