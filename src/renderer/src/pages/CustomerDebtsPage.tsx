import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Wallet, AlertTriangle, Truck } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDZD, getInitials, formatDateTime } from '@/lib/utils'

export default function CustomerDebtsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [jobDebts, setJobDebts] = useState<any[]>([])
  const [posDebts, setPosDebts] = useState<any[]>([])
  const [supplierDebts, setSupplierDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    const [custRes, suppRes] = await Promise.all([
      window.api.customers.getDebts(),
      window.api.suppliers.getDebts()
    ])
    if (custRes.success) {
      setJobDebts(custRes.data?.jobDebts || [])
      setPosDebts(custRes.data?.posDebts || [])
    }
    if (suppRes.success) {
      setSupplierDebts(suppRes.data || [])
    }
    setLoading(false)
  }

  const customerOwes = jobDebts.reduce((sum, d) => sum + (d.totalDebt ?? 0), 0) + posDebts.reduce((sum, d) => sum + (d.totalDebt ?? 0), 0)
  const youOwe = supplierDebts.reduce((sum, d) => sum + (d.balance ?? 0), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const hasNoDebts = jobDebts.length === 0 && posDebts.length === 0 && supplierDebts.length === 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('debts.title')}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={<Wallet size={22} />}
          iconColor="bg-status-error/10 text-status-error"
          label={t('debts.customersOweYou') || 'Customers Owe You'}
          value={formatDZD(customerOwes)}
        />
        <StatCard
          icon={<Truck size={22} />}
          iconColor="bg-status-warning/10 text-status-warning"
          label={t('debts.youOweSuppliers') || 'You Owe Suppliers'}
          value={formatDZD(youOwe)}
        />
      </div>

      {hasNoDebts && (
        <EmptyState icon={<Wallet size={32} />} title={t('debts.noDebts')} description={t('common.noData')} />
      )}

      {jobDebts.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{t('debts.customer')}</h2>
            <span className="text-sm text-text-tertiary">{t('debts.totalDebt')}</span>
          </div>
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.phone')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.unpaidJobs')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.totalDebt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {jobDebts.map(d => (
                <tr key={`job-${d.customerId}`} onClick={() => d.customerId && navigate(`/customers/${d.customerId}`)} className="hover:bg-bg-hover cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">{getInitials(d.customer?.name ?? '')}</div>
                      <span className="text-sm font-medium text-text-primary">{d.customer?.name ?? '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{d.customer?.phone || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{d.unpaidJobs ?? 0}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-status-error">{formatDZD(d.totalDebt ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {posDebts.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <div className="px-6 py-4 border-b border-border-primary flex items-center gap-3">
            <AlertTriangle size={18} className="text-status-warning" />
            <h2 className="text-lg font-semibold text-text-primary">{t('debts.posOutstanding')}</h2>
          </div>
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.sale')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.date')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.due')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {posDebts.map(debt => (
                <tr key={`pos-${debt.saleId}`} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-text-primary">#{debt.saleId}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{debt.customerName || t('common.noData')}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{debt.customerPhone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{formatDateTime(debt.createdAt)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-status-warning">{formatDZD(debt.totalDebt ?? 0)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-shop-steel-500 hover:text-shop-steel-400" onClick={() => navigate(`/pos/sales/${debt.saleId}`)}>{t('common.view')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Debts */}
      {supplierDebts.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-border-primary flex items-center gap-3">
            <Truck size={18} className="text-status-warning" />
            <h2 className="text-lg font-semibold text-text-primary">{t('debts.supplierDebts') || 'Supplier Debts'}</h2>
            <span className="text-sm text-text-tertiary ml-auto">{t('debts.youOweSuppliers') || 'What you owe to suppliers'}</span>
          </div>
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.phone') || 'Phone'}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('debts.totalDebt')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {supplierDebts.map((d: any) => (
                <tr key={d.supplierId} className="hover:bg-bg-hover cursor-pointer transition-colors" onClick={() => navigate(`/suppliers/${d.supplierId}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">{getInitials(d.supplierName)}</div>
                      <span className="text-sm font-medium text-text-primary">{d.supplierName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{d.supplierPhone || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-status-warning">{formatDZD(d.balance)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-shop-steel-500 hover:text-shop-steel-400">{t('common.view')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
