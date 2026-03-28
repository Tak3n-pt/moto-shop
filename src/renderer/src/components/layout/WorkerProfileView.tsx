import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { X, Wrench, DollarSign, TrendingUp, Key, Shield, ShieldOff } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'
import { formatDZD, formatDate, getInitials, getStatusLabel, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

interface WorkerProfileViewProps {
  workerId: number
}

export default function WorkerProfileView({ workerId }: WorkerProfileViewProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workers, hideWorkerProfile, loadWorkers, closeWorkerView } = useWorkerTab()
  const { toasts, addToast } = useToast()

  const [profileLoading, setProfileLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const worker = workers.find(w => w.id === workerId)
  const isAdmin = user?.role === 'admin'

  // Close view if worker was deleted or deactivated
  useEffect(() => {
    if (!worker) {
      hideWorkerProfile()
    }
  }, [worker, hideWorkerProfile])

  useEffect(() => {
    if (worker) loadProfile()
  }, [workerId])

  const loadProfile = async () => {
    setProfileLoading(true)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    const [statsRes, jobsRes] = await Promise.all([
      window.api.jobs.getWorkerStats(workerId, thirtyDaysAgo, today + 'T23:59:59'),
      window.api.jobs.getAll({ workerId, limit: 10 })
    ])
    setStats(statsRes.success ? statsRes.data : null)
    setRecentJobs(jobsRes.success ? (jobsRes.data?.data || []) : [])
    setProfileLoading(false)
  }

  const toggleActive = async () => {
    if (!worker) return
    const res = await window.api.settings.updateWorker(worker.id, { isActive: !worker.isActive })
    if (res.success) {
      addToast(t('common.success'), 'success')
      loadWorkers()
      if (worker.isActive) { closeWorkerView() }
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword.trim()) return
    const res = await window.api.settings.resetWorkerPassword(workerId, newPassword)
    if (res.success) {
      addToast(t('common.success'), 'success')
      setShowPasswordModal(false)
      setNewPassword('')
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const statusVariant = (s: string): 'success' | 'info' | 'pending' | 'error' => {
    switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'pending': return 'pending'; case 'cancelled': return 'error'; default: return 'info' }
  }

  const paymentVariant = (s: string): 'success' | 'pending' | 'error' => {
    switch (s) { case 'paid': return 'success'; case 'partial': return 'pending'; default: return 'error' }
  }

  if (profileLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  if (!worker) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-money-worker/20 flex items-center justify-center text-lg font-bold text-money-worker">
            {getInitials(worker.displayName)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{worker.displayName}</h2>
            <p className="text-sm font-mono text-text-tertiary">@{worker.username}</p>
          </div>
        </div>
        <button
          onClick={hideWorkerProfile}
          className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
              <Wrench size={20} className="text-status-info" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary">{t('reports.totalJobs')}</p>
          <p className="font-mono text-2xl font-extrabold text-text-primary">{stats?.totalJobs || 0}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-money-worker/10 flex items-center justify-center">
              <DollarSign size={20} className="text-money-worker" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary">{t('dashboard.workerEarnings')}</p>
          <p className="font-mono text-2xl font-extrabold text-money-worker">{formatDZD(stats?.totalEarnings || 0)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-profit-positive/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-profit-positive" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary">{t('jobs.repairFee')}</p>
          <p className="font-mono text-2xl font-extrabold text-text-primary">{formatDZD(stats?.totalRepairFees || 0)}</p>
        </Card>
      </div>

      {/* Info + Actions */}
      <div className={cn('grid gap-6 mb-6', isAdmin ? 'grid-cols-3' : 'grid-cols-1')}>
        <Card className={isAdmin ? 'col-span-2' : ''}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">{t('workers.workerInfo')}</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-money-worker/20 flex items-center justify-center text-lg font-bold text-money-worker">
              {getInitials(worker.displayName)}
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{worker.displayName}</p>
              <p className="text-sm font-mono text-text-tertiary">@{worker.username}</p>
              {worker.phone && <p className="text-sm text-text-secondary mt-1">{worker.phone}</p>}
              <p className="text-xs text-text-disabled mt-1">{t('jobs.createdAt')}: {formatDate(worker.createdAt)}</p>
            </div>
          </div>
        </Card>
        {isAdmin && (
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">{t('common.actions')}</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowPasswordModal(true)}>
                <Key size={16} />{t('workers.resetPassword')}
              </Button>
              <Button variant={worker.isActive ? 'danger' : 'primary'} size="sm" className="w-full" onClick={toggleActive}>
                {worker.isActive ? <><ShieldOff size={16} />{t('workers.deactivate')}</> : <><Shield size={16} />{t('workers.activate')}</>}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
        <div className="px-6 py-4 border-b border-border-primary">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">{t('dashboard.recentJobs')}</h3>
        </div>
        {recentJobs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.description')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.repairFee')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.workerProfit')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.paymentStatus')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.createdAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {recentJobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-text-primary">#{job.id}</td>
                  <td className="px-6 py-4"><Badge variant={statusVariant(job.status)}>{getStatusLabel(job.status)}</Badge></td>
                  <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[200px]">{job.description || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{formatDZD(job.repairFee)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-money-worker">{formatDZD(job.workerProfit)}</td>
                  <td className="px-6 py-4"><Badge variant={paymentVariant(job.paymentStatus)}>{t(`jobs.${job.paymentStatus}`)}</Badge></td>
                  <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-text-tertiary">{t('jobs.noJobs')}</div>
        )}
      </div>

      {/* Reset Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title={t('workers.resetPassword')} size="sm" footer={
        <><Button variant="secondary" onClick={() => setShowPasswordModal(false)}>{t('common.cancel')}</Button><Button onClick={handleResetPassword}>{t('common.save')}</Button></>
      }>
        <Input label={t('auth.newPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
      </Modal>

      <Toast toasts={toasts} />
    </div>
  )
}
