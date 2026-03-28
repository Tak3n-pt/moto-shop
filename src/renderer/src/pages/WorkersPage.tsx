import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { Plus, UserCog, Shield, ShieldOff, Key } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Toast from '@/components/ui/Toast'
import { formatDate, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'
import { useWorkerTab } from '@/context/WorkerTabContext'

export default function WorkersPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toasts, addToast } = useToast()
  const { workers, loadWorkers } = useWorkerTab()
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', displayName: '', phone: '' })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    // Workers are loaded by the context, just wait for them
    if (workers.length > 0 || !loading) {
      setLoading(false)
    }
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [workers])

  const handleAdd = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.displayName.trim()) {
      addToast(t('common.required'), 'error'); return
    }
    const res = await window.api.settings.createWorker(form)
    if (res.success) {
      addToast(t('common.success'), 'success')
      loadWorkers()
      setShowAddModal(false)
      setForm({ username: '', password: '', displayName: '', phone: '' })
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const toggleActive = async (worker: any) => {
    const res = await window.api.settings.updateWorker(worker.id, { isActive: !worker.isActive })
    if (res.success) {
      addToast(t('common.success'), 'success')
      loadWorkers()
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!showPasswordModal || !newPassword.trim()) return
    const res = await window.api.settings.resetWorkerPassword(showPasswordModal, newPassword)
    if (res.success) { addToast(t('common.success'), 'success'); setShowPasswordModal(null); setNewPassword('') }
    else addToast(res.error || t('common.error'), 'error')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('workers.title')}</h1>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={<UserCog size={32} />} title={t('workers.noWorkers')} description={t('common.noData')} action={isAdmin ? { label: t('workers.addWorker'), onClick: () => setShowAddModal(true) } : undefined} />
      ) : (
        <div>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowAddModal(true)}><Plus size={20} />{t('workers.addWorker')}</Button>
            </div>
          )}
          <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('workers.displayName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('auth.username')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('customers.phone')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.createdAt')}</th>
                  {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-money-worker/20 flex items-center justify-center text-xs font-bold text-money-worker">{getInitials(w.displayName)}</div>
                        <span className="text-sm font-medium text-text-primary">{w.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-text-secondary">{w.username}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{w.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={w.isActive ? 'success' : 'error'}>{w.isActive ? t('workers.active') : t('workers.inactive')}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(w.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setShowPasswordModal(w.id)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors" title={t('workers.resetPassword')}>
                            <Key size={16} />
                          </button>
                          <button onClick={() => toggleActive(w)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors" title={w.isActive ? t('workers.deactivate') : t('workers.activate')}>
                            {w.isActive ? <ShieldOff size={16} /> : <Shield size={16} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('workers.addWorker')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</Button><Button onClick={handleAdd}>{t('common.save')}</Button></>
      }>
        <div className="space-y-4">
          <Input label={t('workers.displayName')} value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} required />
          <Input label={t('auth.username')} value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          <Input label={t('auth.password')} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <Input label={t('customers.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!showPasswordModal} onClose={() => setShowPasswordModal(null)} title={t('workers.resetPassword')} size="sm" footer={
        <><Button variant="secondary" onClick={() => setShowPasswordModal(null)}>{t('common.cancel')}</Button><Button onClick={handleResetPassword}>{t('common.save')}</Button></>
      }>
        <Input label={t('auth.newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
      </Modal>

      <Toast toasts={toasts} />
    </div>
  )
}
