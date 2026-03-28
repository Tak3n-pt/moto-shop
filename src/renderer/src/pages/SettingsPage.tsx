import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useToast } from '@/hooks/useApi'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { toasts, addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [language, setLanguage] = useState('en')
  const [defaultWorkerMarkup, setDefaultWorkerMarkup] = useState('30')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [autoBackupInterval, setAutoBackupInterval] = useState('24')
  const [autoBackupPath, setAutoBackupPath] = useState('')
  const [autoBackupLast, setAutoBackupLast] = useState('')
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const res = await window.api.settings.getAll()
    if (res.success && res.data) {
      setShopName(res.data.shop_name || '')
      setShopPhone(res.data.shop_phone || '')
      setShopAddress(res.data.shop_address || '')
      setLanguage(res.data.language || 'en')
      setDefaultWorkerMarkup(res.data.default_worker_markup || '30')
      setAutoBackupEnabled(res.data.auto_backup_enabled === 'true')
      setAutoBackupInterval(res.data.auto_backup_interval || '24')
      setAutoBackupPath(res.data.auto_backup_path || '')
      setAutoBackupLast(res.data.auto_backup_last || '')
      const savedTheme = res.data.theme || 'dark'
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
    setLoading(false)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    const res = await window.api.settings.setMultiple({
      shop_name: shopName,
      shop_phone: shopPhone,
      shop_address: shopAddress,
      language,
      default_worker_markup: defaultWorkerMarkup
    })
    setSaving(false)
    if (res.success) {
      i18n.changeLanguage(language)
      addToast(t('settings.saved'), 'success')
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      addToast(t('common.required'), 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      addToast(t('auth.passwordsDoNotMatch'), 'error')
      return
    }
    const res = await window.api.changePassword(user!.userId, oldPassword, newPassword)
    if (res.success) {
      addToast(t('auth.passwordChanged'), 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleSaveAutoBackup = async () => {
    const res = await window.api.settings.setMultiple({
      auto_backup_enabled: autoBackupEnabled ? 'true' : 'false',
      auto_backup_interval: autoBackupInterval,
      auto_backup_path: autoBackupPath
    })
    if (res.success) {
      addToast(t('settings.saved'), 'success')
      await window.api.settings.restartAutoBackup()
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleSelectBackupPath = async () => {
    const res = await window.api.settings.selectBackupPath()
    if (res.success && res.data) setAutoBackupPath(res.data)
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    await window.api.settings.set('theme', newTheme)
  }

  const handleBackup = async () => {
    const res = await window.api.settings.backup()
    if (res.success) addToast(t('settings.backupSuccess'), 'success')
    else if (res.error !== 'Cancelled') addToast(res.error || t('common.error'), 'error')
  }

  const handleRestore = async () => {
    const res = await window.api.settings.restore()
    if (res.success) {
      addToast(t('settings.restoreSuccess'), 'success')
      setTimeout(() => window.location.reload(), 1500)
    } else if (res.error !== 'Cancelled') {
      addToast(res.error || t('common.error'), 'error')
    }
    setShowRestoreConfirm(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">{t('settings.title')}</h1>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <h2 className="text-xl font-semibold text-text-primary mb-6">{t('settings.shopInfo')}</h2>
          <div className="space-y-4">
            <Input label={t('settings.shopName')} value={shopName} onChange={e => setShopName(e.target.value)} />
            <Input label={t('settings.shopPhone')} value={shopPhone} onChange={e => setShopPhone(e.target.value)} />
            <div>
              <label className="label">{t('settings.shopAddress')}</label>
              <textarea value={shopAddress} onChange={e => setShopAddress(e.target.value)} className="input min-h-[80px]" />
            </div>
            <div>
              <label className="label">{t('settings.language')}</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <Input label={t('settings.defaultWorkerMarkup')} type="number" value={defaultWorkerMarkup} onChange={e => setDefaultWorkerMarkup(e.target.value)} min="0" max="100" />
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-text-primary mb-6">{t('auth.changePassword')}</h2>
          <div className="space-y-4">
            <Input label={t('auth.oldPassword')} type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
            <Input label={t('auth.newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <Input label={t('auth.confirmPassword')} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <Button onClick={handleChangePassword}>{t('auth.changePassword')}</Button>
          </div>
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6">{t('settings.backupRestore')}</h2>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={handleBackup}>{t('settings.backup')}</Button>
          <Button variant="danger" onClick={() => setShowRestoreConfirm(true)}>{t('settings.restore')}</Button>
        </div>
      </Card>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6">{t('settings.autoBackup')}</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)} className="w-4 h-4 rounded border-border-primary" />
            <span className="text-sm text-text-primary">{t('settings.autoBackupEnable')}</span>
          </label>
          <div>
            <label className="label">{t('settings.autoBackupInterval')}</label>
            <select value={autoBackupInterval} onChange={e => setAutoBackupInterval(e.target.value)} className="input" disabled={!autoBackupEnabled}>
              <option value="1">{t('settings.every1h')}</option>
              <option value="6">{t('settings.every6h')}</option>
              <option value="12">{t('settings.every12h')}</option>
              <option value="24">{t('settings.every24h')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('settings.autoBackupPath')}</label>
            <div className="flex gap-2">
              <input value={autoBackupPath} readOnly className="input flex-1" placeholder={t('settings.selectFolder')} />
              <Button variant="secondary" onClick={handleSelectBackupPath} disabled={!autoBackupEnabled}>{t('settings.selectFolder')}</Button>
            </div>
          </div>
          {autoBackupLast && (
            <p className="text-sm text-text-tertiary">{t('settings.autoBackupLast')}: {new Date(autoBackupLast).toLocaleString()}</p>
          )}
          <Button onClick={handleSaveAutoBackup} disabled={!autoBackupEnabled}>
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6">{t('settings.theme')}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleThemeChange('dark')}
            className={`px-6 py-3 rounded-lg border-2 transition-colors ${theme === 'dark' ? 'border-okba-500 bg-okba-500/10' : 'border-border-primary hover:border-border-secondary'}`}
          >
            <span className="text-sm font-medium text-text-primary">{t('settings.themeDark')}</span>
          </button>
          <button
            onClick={() => handleThemeChange('light')}
            className={`px-6 py-3 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-okba-500 bg-okba-500/10' : 'border-border-primary hover:border-border-secondary'}`}
          >
            <span className="text-sm font-medium text-text-primary">{t('settings.themeLight')}</span>
          </button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestore}
        title={t('common.confirm')}
        message={t('settings.restoreWarning')}
        variant="danger"
      />
      <Toast toasts={toasts} />
    </div>
  )
}
