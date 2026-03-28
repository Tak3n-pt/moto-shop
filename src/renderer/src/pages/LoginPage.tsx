import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { GearIcon, PistonIcon, SparkPlugIcon, ChainLinkIcon, MotorcycleSilhouette, WrenchIcon, HelmetIcon, ShockAbsorberIcon, WheelIcon } from '@/components/icons/MotoIcons'
import logoImg from '@/assets/logo.png'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-okba-500/[0.03] rounded-full blur-3xl" />

      {/* Floating moto SVG background layer */}
      <div className="absolute inset-0 pointer-events-none">
        <GearIcon className="absolute top-[10%] left-[8%] w-32 h-32 text-okba-500 opacity-[0.04] animate-slow-rotate" />
        <GearIcon className="absolute bottom-[10%] right-[8%] w-24 h-24 text-okba-500 opacity-[0.03] animate-slow-rotate-reverse" />
        <PistonIcon className="absolute top-[15%] right-[12%] w-16 h-16 text-okba-500 opacity-[0.04] animate-float" />
        <SparkPlugIcon className="absolute bottom-[18%] left-[12%] w-10 h-10 text-okba-500 opacity-[0.03] animate-float" style={{ animationDelay: '2s' }} />
        <ChainLinkIcon className="absolute top-[50%] left-[5%] w-20 h-20 text-okba-500 opacity-[0.03] animate-float" style={{ animationDelay: '1s' }} />
        <GearIcon className="absolute bottom-[8%] left-[45%] w-16 h-16 text-okba-500 opacity-[0.03] animate-slow-rotate" />
        <WheelIcon className="absolute bottom-[6%] left-[48%] w-36 h-36 text-okba-500 opacity-[0.02] animate-slow-rotate-reverse" />
        <HelmetIcon className="absolute top-[18%] right-[15%] w-20 h-20 text-okba-500 opacity-[0.04] animate-float" style={{ animationDelay: '2.5s' }} />
        <ShockAbsorberIcon className="absolute bottom-[22%] right-[8%] w-14 h-28 text-okba-500 opacity-[0.04] animate-slow-rotate" />
      </div>

      <div className="w-full max-w-md mx-4 relative">
        {/* Large motorcycle silhouette behind form */}
        <MotorcycleSilhouette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[270px] text-okba-500 opacity-[0.06] pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative bg-bg-secondary rounded-2xl shadow-2xl border border-border-primary p-8 animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute -inset-5 bg-okba-500/10 blur-3xl rounded-full" />
              <img src={logoImg} alt={t('app.logoAlt')} className="relative w-52 max-w-[280px] h-auto object-contain drop-shadow-lg" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-okba-500/30" />
              <WrenchIcon className="w-5 h-5 text-okba-500/50" />
              <div className="flex-1 h-px bg-okba-500/30" />
            </div>
            <p className="text-sm text-text-tertiary">{t('app.tagline')}</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.username')}
              autoFocus
              required
            />
            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              required
            />
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1.5">{t('auth.language')}</label>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-shop-steel-500 focus:border-transparent outline-none min-h-[48px]"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? t('common.loading') : t('auth.signIn')}
          </Button>
        </form>
      </div>
    </div>
  )
}



