import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { Plus, Wrench } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDZD, formatDate, getStatusLabel, cn } from '@/lib/utils'

const TABS = ['all', 'pending', 'in_progress', 'completed', 'cancelled']

export default function JobsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && TABS.includes(statusParam)) setTab(statusParam)
  }, [])

  const isWorkerMode = typeof activeView === 'number'
  const effectiveWorkerId = isWorkerMode ? activeView : (user?.role === 'worker' ? user?.userId : null)

  // Track the workerId in a ref so loadData always has the latest value
  const workerIdRef = React.useRef(effectiveWorkerId)
  workerIdRef.current = effectiveWorkerId

  useEffect(() => {
    // Skip the initial fetch if worker context hasn't resolved yet
    // (activeView still 'page' but workers list not loaded)
    if (user?.role === 'worker' && activeView === 'page') return
    loadData()
  }, [tab, page, search, activeView, effectiveWorkerId])

  const loadData = async () => {
    setLoading(true)
    const filters: any = {}
    if (tab !== 'all') filters.status = tab
    const wId = workerIdRef.current
    if (wId) filters.workerId = wId
    if (search) filters.search = search

    const jobsRes = await window.api.jobs.getAll({ ...filters, page, limit: 20 })

    if (jobsRes.success) {
      setJobs(jobsRes.data?.data || [])
      setTotalPages(jobsRes.data?.totalPages || 1)
    }
    setLoading(false)
  }

  const statusVariant = (s: string): 'success' | 'info' | 'pending' | 'error' => {
    switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'pending': return 'pending'; case 'cancelled': return 'error'; default: return 'info' }
  }

  const tabLabels: Record<string, string> = {
    all: t('jobs.all'), pending: t('jobs.pending'), in_progress: t('jobs.inProgress'), completed: t('jobs.completed'), cancelled: t('jobs.cancelled')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('jobs.title')}</h1>
        <Button onClick={() => navigate('/jobs/new')}><Plus size={20} />{t('jobs.newJob')}</Button>
      </div>

      <div className="mb-6 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t('jobs.searchPlaceholder')} />
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(tb => (
          <button key={tb} onClick={() => { setTab(tb); setPage(1) }} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === tb ? 'bg-shop-steel-600 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover')}>
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={<Wrench size={32} />} title={t('jobs.noJobs')} description={t('common.noData')} action={{ label: t('jobs.newJob'), onClick: () => navigate('/jobs/new') }} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.paymentStatus')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.worker')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.description')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.repairFee')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.totalAmount')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.createdAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {jobs.map(job => (
                <tr key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="hover:bg-bg-hover cursor-pointer transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-text-primary">#{job.id}</td>
                  <td className="px-6 py-4"><Badge variant={statusVariant(job.status)}>{getStatusLabel(job.status)}</Badge></td>
                  <td className="px-6 py-4">
                    <Badge variant={job.paymentStatus === 'paid' ? 'success' : job.paymentStatus === 'partial' ? 'warning' : 'error'}>
                      {job.paymentStatus === 'paid' ? t('jobs.paid') : job.paymentStatus === 'partial' ? t('jobs.partial') : t('jobs.unpaid')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{job.customerName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{job.workerName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[180px]">{job.description || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(job.repairFee)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(job.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-text-tertiary">{t('common.page')} {page} {t('common.of')} {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.previous')}</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.next')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
