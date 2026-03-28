import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Phone, Bike, Hash, Wrench, DollarSign, Calendar, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { formatDZD, formatDate, getInitials, getStatusLabel } from '@/lib/utils'
import DocumentPreview from '@/components/documents/DocumentPreview'
import CustomerStatement from '@/components/documents/CustomerStatement'

export default function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showStatement, setShowStatement] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [custRes, jobsRes, statsRes] = await Promise.all([
      window.api.customers.getById(Number(id)),
      window.api.customers.getHistory(Number(id)),
      window.api.customers.getStats(Number(id))
    ])
    if (custRes.success) setCustomer(custRes.data)
    if (jobsRes.success) setJobs(jobsRes.data || [])
    if (statsRes.success) setStats(statsRes.data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!customer) return <div className="text-text-tertiary text-center py-16">{t('common.noData')}</div>

  const statusVariant = (s: string): 'success' | 'info' | 'pending' | 'error' => {
    switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'pending': return 'pending'; case 'cancelled': return 'error'; default: return 'info' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft size={20} /><span>{t('common.back')}</span>
        </button>
        <Button variant="secondary" onClick={() => setShowStatement(true)}><FileText size={16} />{t('documents.customerStatement.title')}</Button>
      </div>

      <Card className="mb-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center text-xl font-bold text-text-primary">
            {getInitials(customer.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary mb-4">{customer.name}</h1>
            <div className="grid grid-cols-3 gap-6">
              {customer.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone size={16} className="text-text-tertiary" />{customer.phone}</div>}
              {(customer.motorcycleBrand || customer.motorcycleModel) && <div className="flex items-center gap-2 text-text-secondary"><Bike size={16} className="text-text-tertiary" />{[customer.motorcycleBrand, customer.motorcycleModel].filter(Boolean).join(' ')}</div>}
              {customer.plateNumber && <div className="flex items-center gap-2 text-text-secondary"><Hash size={16} className="text-text-tertiary" />{customer.plateNumber}</div>}
            </div>
            {customer.notes && <p className="mt-4 text-sm text-text-tertiary">{customer.notes}</p>}
          </div>
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Wrench size={24} />} iconColor="bg-status-info/10 text-status-info" label={t('customers.totalJobs')} value={String(stats.totalJobs || 0)} />
          <StatCard icon={<DollarSign size={24} />} iconColor="bg-profit-positive/10 text-profit-positive" label={t('customers.totalSpent')} value={formatDZD(stats.totalSpent || 0)} />
          <StatCard icon={<Calendar size={24} />} iconColor="bg-status-warning/10 text-status-warning" label={t('customers.lastVisit')} value={stats.lastVisit ? formatDate(stats.lastVisit) : '-'} />
        </div>
      )}

      <h2 className="text-xl font-semibold text-text-primary mb-4">{t('customers.repairHistory')}</h2>
      <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
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
                <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[200px]">{job.description || '-'}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(job.repairFee)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(job.totalAmount)}</td>
                <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(job.createdAt)}</td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-text-tertiary">{t('jobs.noJobs')}</td></tr>}
          </tbody>
        </table>
      </div>

      {showStatement && customer && (
        <DocumentPreview title={t('documents.customerStatement.title')} onClose={() => setShowStatement(false)}>
          <CustomerStatement
            customer={{ name: customer.name, phone: customer.phone, motorcycle: customer.motorcycleBrand ? `${customer.motorcycleBrand} ${customer.motorcycleModel || ''}`.trim() : undefined }}
            jobs={jobs.map((j: any) => ({ id: j.id, createdAt: j.createdAt, description: j.description, totalAmount: j.totalAmount, amountPaid: j.amountPaid, paymentStatus: j.paymentStatus }))}
            totalSpent={jobs.reduce((s: number, j: any) => s + (j.totalAmount || 0), 0)}
            totalPaid={jobs.reduce((s: number, j: any) => s + (j.amountPaid || 0), 0)}
            outstanding={jobs.reduce((s: number, j: any) => s + Math.max(0, (j.totalAmount || 0) - (j.amountPaid || 0)), 0)}
          />
        </DocumentPreview>
      )}
    </div>
  )
}
