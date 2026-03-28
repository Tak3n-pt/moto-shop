import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Package, ChevronDown, ChevronUp } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDZD, formatDate } from '@/lib/utils'

export default function PurchaseHistoryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedData, setExpandedData] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPurchases()
  }, [page])

  const loadPurchases = async () => {
    setLoading(true)
    const res = await window.api.purchase.getAll(page, 20)
    if (res.success) {
      setPurchases(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    }
    setLoading(false)
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedData(null)
      return
    }
    setExpandedId(id)
    setLoadingDetail(true)
    const res = await window.api.purchase.getById(id)
    if (res.success) setExpandedData(res.data)
    setLoadingDetail(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/parts')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft size={20} /><span>{t('common.back')}</span>
          </button>
          <h1 className="text-3xl font-bold text-text-primary">{t('parts.purchaseHistory')}</h1>
        </div>
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon={<Package size={32} />} title={t('parts.noPurchases')} description={t('common.noData')} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.supplier')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.invoiceRef')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.totalAmount')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.purchaseDate')}</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.viewDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {purchases.map(p => (
                <Fragment key={p.id}>
                  <tr className="hover:bg-bg-hover cursor-pointer transition-colors" onClick={() => toggleExpand(p.id)}>
                    <td className="px-6 py-4 font-mono text-sm text-text-primary">#{p.id}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{p.supplierName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.invoiceRef || '-'}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(p.totalAmount || 0)}</td>
                    <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(p.purchasedAt || p.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      {expandedId === p.id ? <ChevronUp size={18} className="inline text-text-tertiary" /> : <ChevronDown size={18} className="inline text-text-tertiary" />}
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={6} className="bg-bg-tertiary px-6 py-4">
                        {loadingDetail ? (
                          <div className="flex justify-center py-4"><Spinner /></div>
                        ) : expandedData?.items?.length > 0 ? (
                          <div className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-bg-tertiary">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.quantity')}</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.buyPrice')}</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.sellPrice')}</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('invoice.total')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-primary">
                                {expandedData.items.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-text-primary">{item.partName || '-'}</td>
                                    <td className="px-4 py-2 text-center font-mono text-sm text-text-primary">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right font-mono text-sm text-text-secondary">{formatDZD(item.unitBuyPrice)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-sm text-text-primary">{formatDZD(item.unitSellPrice)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-sm font-bold text-text-primary">{formatDZD(item.unitBuyPrice * item.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-text-tertiary text-center py-4">{t('common.noData')}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
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
