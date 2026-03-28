import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { DollarSign, Wrench, Package, Users, TrendingUp, ShoppingCart, AlertTriangle, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatDZD, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils'

const toLocalDateInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0]
}

const toRangeBoundary = (date: string, end = false) => {
  const boundary = end ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${date}T${boundary}`).toISOString()
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([])
  const [workerStats, setWorkerStats] = useState<any>(null)
  const [workerRange, setWorkerRange] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [posSummary, setPosSummary] = useState<{ saleCount: number; totalRevenue: number; totalItems: number; totalDue: number }>({ saleCount: 0, totalRevenue: 0, totalItems: 0, totalDue: 0 })

  const isWorkerMode = typeof activeView === 'number'
  const effectiveWorkerId = isWorkerMode ? activeView : (user?.role === 'worker' ? user.userId : null)

  const getWorkerRangeStart = (range: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date()
    switch (range) {
      case 'today': return toLocalDateInput(now)
      case 'week': return toLocalDateInput(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))
      case 'month': return toLocalDateInput(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000))
      case 'year': return toLocalDateInput(new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000))
    }
  }

  useEffect(() => {
    if (user?.role === 'worker' && activeView === 'page') return
    loadData()
  }, [activeView, workerRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const todayLocal = toLocalDateInput(new Date())
      const dayStart = toRangeBoundary(todayLocal)
      const dayEnd = toRangeBoundary(todayLocal, true)
      const thirtyDaysAgoLocal = toLocalDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

      const promises: Promise<any>[] = [
        window.api.jobs.getStats(dayStart, dayEnd),
        window.api.jobs.getRecent(10),
        window.api.jobs.getActiveCount()
      ]
      if (!effectiveWorkerId) {
        promises.push(window.api.parts.getLowStockCount())
        promises.push(window.api.reports.dailyRevenue(toRangeBoundary(thirtyDaysAgoLocal), dayEnd))
        promises.push(window.api.pos.getSummary({ from: dayStart, to: dayEnd }))
      }

      const results = await Promise.all(promises)
      let idx = 0
      const statsRes = results[idx++]
      const recentRes = results[idx++]
      const activeRes = results[idx++]

      if (statsRes.success) setStats(statsRes.data)
      if (recentRes.success) {
        const allRecent = recentRes.data || []
        setRecentJobs(effectiveWorkerId ? allRecent.filter((j: any) => j.workerId === effectiveWorkerId) : allRecent)
      }
      if (activeRes.success) {
        if (effectiveWorkerId) {
          const allRecent = recentRes.success ? (recentRes.data || []) : []
          const workerActive = allRecent.filter((j: any) => j.workerId === effectiveWorkerId && j.status === 'in_progress').length
          setActiveCount(workerActive)
        } else {
          setActiveCount(activeRes.data || 0)
        }
      }
      if (!effectiveWorkerId) {
        const lowStockRes = results[idx++]
        const dailyRes = results[idx++]
        const posRes = results[idx++]
        if (lowStockRes.success) setLowStockCount(lowStockRes.data || 0)
        if (dailyRes.success) setDailyRevenue(dailyRes.data || [])
        if (posRes.success) setPosSummary(posRes.data || { saleCount: 0, totalRevenue: 0, totalItems: 0, totalDue: 0 })
      }

      if (effectiveWorkerId) {
        const rangeStart = toRangeBoundary(getWorkerRangeStart(workerRange))
        const ws = await window.api.jobs.getWorkerStats(effectiveWorkerId, rangeStart, dayEnd)
        if (ws.success) setWorkerStats(ws.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const isAdmin = user?.role === 'admin' && !isWorkerMode

  const statusVariant = (s: string) => {
    switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'pending': return 'pending'; case 'cancelled': return 'error'; default: return 'info' }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">{t('nav.dashboard')}</h1>

      {/* Stat Cards */}
      <div className={cn('grid gap-6 mb-8', isAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
        {isAdmin ? (
          <>
            <StatCard icon={<DollarSign size={24} className="text-white" />} iconColor="bg-profit-positive" label={t('dashboard.todayRevenue')} value={formatDZD((stats?.totalRevenue || 0) + (posSummary.totalRevenue || 0))} onClick={() => navigate('/reports')} />
            <StatCard icon={<Wrench size={24} className="text-white" />} iconColor="bg-status-info" label={t('dashboard.activeJobs')} value={String(activeCount)} onClick={() => navigate('/jobs?status=in_progress')} />
            <StatCard icon={<Package size={24} className="text-white" />} iconColor="bg-status-warning" label={t('dashboard.lowStockParts')} value={String(lowStockCount)} onClick={() => navigate('/parts?lowStock=true')} />
            <StatCard icon={<Users size={24} className="text-white" />} iconColor="bg-money-worker" label={t('dashboard.workerEarnings')} value={formatDZD(stats?.totalWorkerProfit || 0)} onClick={() => navigate('/reports')} />
            <StatCard icon={<ShoppingCart size={24} className="text-white" />} iconColor="bg-status-info/50 text-white" label={t('dashboard.posRevenue')} value={formatDZD(posSummary.totalRevenue || 0)} onClick={() => navigate('/pos')} />
            <StatCard icon={<AlertTriangle size={24} className="text-white" />} iconColor="bg-status-warning/60 text-white" label={t('dashboard.posOutstanding')} value={formatDZD(posSummary.totalDue || 0)} onClick={() => navigate('/debts')} />
          </>
        ) : (
          <>
            <StatCard icon={<Wrench size={24} className="text-white" />} iconColor="bg-status-info" label={t('dashboard.myJobs')} value={String(workerStats?.totalJobs || 0)} onClick={() => navigate('/jobs')} />
            <StatCard icon={<DollarSign size={24} className="text-white" />} iconColor="bg-money-worker" label={t('dashboard.myEarnings')} value={formatDZD(workerStats?.totalEarnings || 0)} />
            <StatCard icon={<TrendingUp size={24} className="text-white" />} iconColor="bg-profit-positive" label={t('dashboard.activeJobs')} value={String(activeCount)} onClick={() => navigate('/jobs?status=in_progress')} />
          </>
        )}
      </div>

      {/* Worker Time Filter */}
      {!isAdmin && (
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={16} className="text-text-tertiary" />
          <span className="text-sm text-text-tertiary mr-1">{t('reports.period') || 'Period'}:</span>
          {(['today', 'week', 'month', 'year'] as const).map(range => (
            <Button
              key={range}
              size="sm"
              variant={workerRange === range ? 'primary' : 'secondary'}
              onClick={() => setWorkerRange(range)}
            >
              {range === 'today' ? t('reports.quickToday') || 'Today' :
               range === 'week' ? t('reports.quickWeek') || 'Week' :
               range === 'month' ? t('reports.quickMonth') || 'Month' :
               t('reports.quickYear') || 'Year'}
            </Button>
          ))}
        </div>
      )}

      {/* Charts */}
      {isAdmin && dailyRevenue.length > 0 && (
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-bg-secondary rounded-xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('dashboard.revenueTrend')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3e42" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #3d3e42', borderRadius: '8px', color: '#f9fafb' }} />
                <Bar dataKey="jobRevenue" fill="#0066c9" radius={[4, 4, 0, 0]} name={t('dashboard.jobRevenue')} stackId="rev" />
                <Bar dataKey="posRevenue" fill="#22c55e" radius={[4, 4, 0, 0]} name={t('dashboard.posRevenue')} stackId="rev" />
                <Bar dataKey="storeProfit" fill="#10b981" radius={[4, 4, 0, 0]} name={t('jobs.storeProfit')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary">{t('dashboard.recentJobs')}</h3>
          <button onClick={() => navigate('/jobs')} className="text-sm text-shop-steel-500 hover:text-shop-steel-600 font-medium">{t('dashboard.viewAll')}</button>
        </div>
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.description')}</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.totalAmount')}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.createdAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {recentJobs.map(job => (
              <tr key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="hover:bg-bg-hover cursor-pointer transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-text-primary">#{job.id}</td>
                <td className="px-6 py-4"><Badge variant={statusVariant(job.status)}>{getStatusLabel(job.status)}</Badge></td>
                <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[200px]">{job.description || '-'}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(job.totalAmount)}</td>
                <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(job.createdAt)}</td>
              </tr>
            ))}
            {recentJobs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-text-tertiary">{t('jobs.noJobs')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
