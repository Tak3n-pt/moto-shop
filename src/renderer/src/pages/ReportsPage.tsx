import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import { formatDZD, exportCSV, cn, formatDateTime } from '@/lib/utils'
import DocumentPreview from '@/components/documents/DocumentPreview'
import DocumentLayout from '@/components/documents/DocumentLayout'
import RepairProfitReport from '@/components/documents/RepairProfitReport'
import WorkerEarningsStatement from '@/components/documents/WorkerEarningsStatement'
import InventoryValuation from '@/components/documents/InventoryValuation'
import SalesSummary from '@/components/documents/SalesSummary'

const TABS = ['profit', 'workers', 'inventory', 'parts', 'posSales'] as const
type QuickRange = 'today' | 'week' | 'month' | 'year' | 'custom'

const toLocalDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toRangeBoundary = (date: string, end = false) => {
  const [year, month, day] = date.split('-').map(Number)
  const boundaryDate = new Date(
    year,
    month - 1,
    day,
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
    end ? 999 : 0
  )
  return boundaryDate.toISOString()
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('profit')
  const [from, setFrom] = useState(
    toLocalDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  )
  const [to, setTo] = useState(toLocalDateInput(new Date()))
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeQuickRange, setActiveQuickRange] = useState<QuickRange>('month')
  const [activeReport, setActiveReport] = useState<string | null>(null)
  const [workerReportData, setWorkerReportData] = useState<any>(null)
  const [salesSummaryData, setSalesSummaryData] = useState<any[]>([])

  const quickRanges: { id: Exclude<QuickRange, 'custom'>; label: string }[] = [
    { id: 'today', label: t('reports.quickToday') },
    { id: 'week', label: t('reports.quickWeek') },
    { id: 'month', label: t('reports.quickMonth') },
    { id: 'year', label: t('reports.quickYear') }
  ]

  const applyQuickRange = (range: Exclude<QuickRange, 'custom'>) => {
    const now = new Date()
    let start = new Date(now)
    let end = new Date(now)

    switch (range) {
      case 'today':
        break
      case 'week':
        start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        start = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000)
        break
    }

    const newFrom = toLocalDateInput(start)
    const newTo = toLocalDateInput(end)
    setFrom(newFrom)
    setTo(newTo)
    setActiveQuickRange(range)
  }

  const handleFromChange = (value: string) => {
    setFrom(value)
    setActiveQuickRange('custom')
  }

  const handleToChange = (value: string) => {
    setTo(value)
    setActiveQuickRange('custom')
  }

  const formatPickerDate = (value: string) => {
    if (!value) return '-'
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  const handlePrintWorkerStatement = async (worker: any) => {
    if (!worker?.worker?.id) return
    const fromIso = toRangeBoundary(from)
    const toIso = toRangeBoundary(to, true)
    const res = await window.api.jobs.getWorkerJobs(worker.worker.id, fromIso, toIso)
    if (res.success) {
      setWorkerReportData({ worker: worker.worker, jobs: res.data || [], totalEarnings: worker.totalEarnings || 0, totalJobs: worker.totalJobs || 0 })
      setActiveReport('workerStatement')
    }
  }

  // Auto-fetch whenever tab or dates change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setData(null)
      try {
        let res: any
        const fromIso = toRangeBoundary(from)
        const toIso = toRangeBoundary(to, true)
        switch (tab) {
          case 'profit':
            res = await window.api.reports.profit(fromIso, toIso)
            break
          case 'workers':
            res = await window.api.reports.workerEarnings(fromIso, toIso)
            break
          case 'inventory':
            res = await window.api.reports.inventory()
            break
          case 'parts':
            res = await window.api.reports.mostUsedParts(fromIso, toIso)
            break
          case 'posSales':
            res = await window.api.pos.getByDateRange({ from: fromIso, to: toIso })
            break
        }
        if (res?.success) setData(res.data)
      } catch (err) { console.error(err) } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tab, from, to])

  const handleExport = () => {
    if (!data) return
    switch (tab) {
      case 'profit': {
        if (!data.jobs) return
        const headers = ['ID', 'Repair Fee', 'Parts Total', 'Total Amount', 'Worker Profit', 'Store Profit']
        const rows = data.jobs.map((j: any) => [String(j.id), String(j.repairFee), String(j.partsTotal), String(j.totalAmount), String(j.workerProfit), String((j.storeRepairProfit || 0) + (j.storePartsProfit || 0))])
        exportCSV(`profit-report-${from}-${to}.csv`, headers, rows)
        break
      }
      case 'workers': {
        const arr = Array.isArray(data) ? data : []
        const headers = ['Worker', 'Total Jobs', 'Repair Fees', 'Earnings']
        const rows = arr.map((w: any) => [w.worker?.displayName || '', String(w.totalJobs || 0), String(w.totalRepairFees || 0), String(w.totalEarnings || 0)])
        exportCSV(`workers-report-${from}-${to}.csv`, headers, rows)
        break
      }
      case 'inventory': {
        if (!data.parts) return
        const headers = ['Part Name', 'Category', 'Stock', 'Min Stock', 'Buy Price', 'Sell Price']
        const rows = data.parts.map((p: any) => [p.name, p.category || '', String(p.quantity), String(p.minStock), String(p.buyPrice), String(p.sellPrice)])
        exportCSV(`inventory-report.csv`, headers, rows)
        break
      }
      case 'parts': {
        if (!Array.isArray(data)) return
        const headers = ['Part Name', 'Quantity Used', 'Revenue', 'Profit']
        const rows = data.map((p: any) => [p.partName, String(p.totalQuantity), String(p.totalRevenue || 0), String(p.profit || 0)])
        exportCSV(`parts-usage-${from}-${to}.csv`, headers, rows)
        break
      }
      case 'posSales': {
        if (!Array.isArray(data) || data.length === 0) return
        const headers = ['Sale ID', 'Date', 'Cashier', 'Customer', 'Items', 'Total', 'Cash Received', 'Change', 'Amount Due']
        const rows = data.map((sale: any) => [
          `#${sale.id}`,
          sale.createdAt,
          sale.cashierName || '',
          sale.customerName || '',
          (sale.items || []).slice(0, 3).map((item: any) => `${item.partName} x${item.quantity}`).join(', '),
          String(sale.total || 0),
          String(sale.cashReceived || 0),
          String(sale.changeDue || 0),
          String(sale.amountDue || 0)
        ])
        exportCSV(`pos-sales-${from}-${to}.csv`, headers, rows)
        break
      }
    }
  }

  const tabLabels: Record<string, string> = {
    profit: t('reports.profitSummary'),
    workers: t('reports.workerEarnings'),
    inventory: t('reports.inventory'),
    parts: t('reports.mostUsedParts'),
    posSales: t('reports.posSales')
  }

  const jobSummary: any = tab === 'profit' && data?.summary ? data.summary : {}
  const posSummaryData: any = tab === 'profit' && data?.posSummary ? data.posSummary : { saleCount: 0, totalRevenue: 0, totalItems: 0, totalDue: 0 }
  const totalExpenses = tab === 'profit' && data?.totalExpenses ? data.totalExpenses : 0
  const combinedRevenue = (jobSummary.totalRevenue || 0) + (posSummaryData.totalRevenue || 0)
  const storeProfit = (jobSummary.totalStoreRepairProfit || 0) + (jobSummary.totalStorePartsProfit || 0)
  const posProfit = (posSummaryData.totalProfit || 0)
  const netProfit = storeProfit + posProfit - totalExpenses

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">{t('reports.title')}</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(tb => (
          <button key={tb} onClick={() => { setTab(tb) }} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === tb ? 'bg-shop-steel-600 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover')}>
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      {tab !== 'inventory' && (
        <div className="flex items-end gap-4 mb-6">
          <Input label={t('reports.from')} type="date" value={from} onChange={e => handleFromChange(e.target.value)} className="max-w-[200px]" />
          <Input label={t('reports.to')} type="date" value={to} onChange={e => handleToChange(e.target.value)} className="max-w-[200px]" />
          {data && <Button variant="secondary" onClick={handleExport}><Download size={18} />{t('reports.exportCSV')}</Button>}
          {data && (tab === 'profit' || tab === 'inventory') && (
            <Button variant="secondary" onClick={() => setActiveReport(tab)}><FileText size={18} />{t('reports.printReport')}</Button>
          )}
          {data && tab === 'posSales' && (
            <Button variant="secondary" onClick={async () => {
              const fromIso = toRangeBoundary(from)
              const toIso = toRangeBoundary(to, true)
              const res = await window.api.reports.dailyRevenue(fromIso, toIso)
              if (res.success) { setSalesSummaryData(res.data || []); setActiveReport('posSales') }
            }}><FileText size={18} />{t('reports.printReport')}</Button>
          )}
        </div>
      )}
      {tab !== 'inventory' && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {quickRanges.map(range => (
            <Button
              key={range.id}
              variant={activeQuickRange === range.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => applyQuickRange(range.id)}
            >
              {range.label}
            </Button>
          ))}
          <p className="text-xs text-text-tertiary">
            {t('reports.rangeLabel', { from: formatPickerDate(from), to: formatPickerDate(to) })}
          </p>
        </div>
      )}
      {tab === 'inventory' && (
        <div className="flex items-end gap-4 mb-6">
          {data && <Button variant="secondary" onClick={handleExport}><Download size={18} />{t('reports.exportCSV')}</Button>}
          {data && <Button variant="secondary" onClick={() => setActiveReport('inventory')}><FileText size={18} />{t('reports.printReport')}</Button>}
        </div>
      )}

      {loading && <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>}

      {!loading && data && tab === 'profit' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.totalJobs')}</p>
              <p className="font-mono text-2xl font-extrabold text-text-primary">{jobSummary.totalJobs || 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.combinedRevenue')}</p>
              <p className="font-mono text-2xl font-extrabold text-profit-positive">{formatDZD(combinedRevenue)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('jobs.workerProfit')}</p>
              <p className="font-mono text-2xl font-extrabold text-money-worker">{formatDZD(jobSummary.totalWorkerProfit || 0)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.posRevenue')}</p>
              <p className="font-mono text-2xl font-extrabold text-status-info">{formatDZD(posSummaryData.totalRevenue || 0)}</p>
              <p className="text-xs text-text-tertiary mt-1">{t('reports.posSalesCount')}: {posSummaryData.saleCount || 0}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <Card>
              <p className="text-sm text-text-tertiary">{t('jobs.storeProfit')}</p>
              <p className="font-mono text-2xl font-extrabold text-money-store">{formatDZD(storeProfit)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.totalExpenses')}</p>
              <p className="font-mono text-2xl font-extrabold text-status-error">{formatDZD(totalExpenses)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.posOutstanding')}</p>
              <p className="font-mono text-2xl font-extrabold text-status-warning">{formatDZD(posSummaryData.totalDue || 0)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-tertiary">{t('reports.netProfit')}</p>
              <p className="font-mono text-2xl font-extrabold text-profit-positive">{formatDZD(netProfit)}</p>
            </Card>
          </div>
          {data.jobs?.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.repairFee')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.partsTotal')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.totalAmount')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.workerProfit')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.storeProfit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {data.jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-bg-hover">
                      <td className="px-6 py-4 font-mono text-sm text-text-primary">#{job.id}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{formatDZD(job.repairFee)}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(job.partsTotal)}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-text-primary">{formatDZD(job.totalAmount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-money-worker">{formatDZD(job.workerProfit)}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-money-store">{formatDZD((job.storeRepairProfit || 0) + (job.storePartsProfit || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && data && tab === 'workers' && (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.worker')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('reports.totalJobs')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.repairFee')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('dashboard.workerEarnings')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {(Array.isArray(data) ? data : []).map((w: any) => (
                <tr key={w.worker?.id} className="hover:bg-bg-hover">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{w.worker?.displayName}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{w.totalJobs || 0}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(w.totalRepairFees || 0)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-money-worker">{formatDZD(w.totalEarnings || 0)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handlePrintWorkerStatement(w)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors" title={t('reports.printReport')}><FileText size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && data && tab === 'inventory' && (
        <div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card><p className="text-sm text-text-tertiary">{t('reports.totalParts')}</p><p className="font-mono text-2xl font-extrabold text-text-primary">{data.totalParts}</p></Card>
            <Card><p className="text-sm text-text-tertiary">{t('reports.stockValue')} ({t('parts.buyPrice')})</p><p className="font-mono text-2xl font-extrabold text-text-primary">{formatDZD(data.totalValue)}</p></Card>
            <Card><p className="text-sm text-text-tertiary">{t('reports.stockValue')} ({t('parts.sellPrice')})</p><p className="font-mono text-2xl font-extrabold text-profit-positive">{formatDZD(data.totalSellValue)}</p></Card>
            <Card><p className="text-sm text-text-tertiary">{t('parts.outOfStock')}</p><p className="font-mono text-2xl font-extrabold text-status-error">{data.outOfStock?.length || 0}</p></Card>
          </div>
          {data.lowStock?.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
              <div className="px-6 py-4 border-b border-border-primary"><h3 className="text-sm font-semibold text-status-warning">{t('parts.lowStock')}</h3></div>
              <table className="w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.stock')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.minStock')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {data.lowStock.map((p: any) => (
                    <tr key={p.id} className="hover:bg-bg-hover">
                      <td className="px-6 py-4 text-sm text-text-primary">{p.name}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-status-warning">{p.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-text-tertiary">{p.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && data && tab === 'parts' && (
        <div>
          {Array.isArray(data) && data.length > 0 ? (
            <>
              <Card className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d3e42" />
                    <XAxis dataKey="partName" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #3d3e42', borderRadius: '8px', color: '#f9fafb' }} />
                    <Bar dataKey="totalQuantity" fill="#0066c9" radius={[4, 4, 0, 0]} name={t('reports.quantityUsed')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.quantity')}</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('reports.revenue')}</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('reports.totalProfit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {data.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-bg-hover">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{p.partName}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{p.totalQuantity}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(p.totalRevenue || 0)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm font-bold text-profit-positive">{formatDZD(p.profit || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-text-tertiary text-center py-16">{t('reports.noData')}</p>
          )}
        </div>
      )}

      {!loading && data && tab === 'posSales' && (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          {Array.isArray(data) && data.length > 0 ? (
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.soldAt')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.cashier')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.customerName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.totalRevenue')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.cashReceived')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.changeDue')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.totalDue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {data.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-bg-hover">
                    <td className="px-6 py-4 text-sm font-mono text-text-primary">#{sale.id}</td>
                    <td className="px-6 py-4 text-sm text-text-tertiary">{formatDateTime(sale.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{sale.cashierName}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{sale.customerName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {(sale.items || []).slice(0, 2).map((item: any) => `${item.partName} x${item.quantity}`).join(', ')}
                      {(sale.items?.length || 0) > 2 ? '…' : ''}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold text-text-primary">{formatDZD(sale.total)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{formatDZD(sale.cashReceived)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(sale.changeDue)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-status-warning">{formatDZD(sale.amountDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-text-tertiary text-center py-16">{t('reports.noData')}</p>
          )}
        </div>
      )}

      {!loading && !data && <p className="text-text-tertiary text-center py-16">{t('reports.noData')}</p>}

      {activeReport === 'profit' && data && (
        <DocumentPreview title={t('reports.profitSummary')} onClose={() => setActiveReport(null)}>
          <RepairProfitReport
            dateRange={{ from: toRangeBoundary(from), to: toRangeBoundary(to, true) }}
            summary={data.summary || { totalJobs: 0, totalRevenue: 0, totalWorkerProfit: 0, totalStoreRepairProfit: 0, totalStorePartsProfit: 0, totalPartsCost: 0 }}
            posSummary={data.posSummary || { saleCount: 0, totalRevenue: 0, totalProfit: 0 }}
            totalExpenses={data.totalExpenses || 0}
            netProfit={netProfit}
            jobs={data.jobs || []}
          />
        </DocumentPreview>
      )}

      {activeReport === 'workerStatement' && workerReportData && (
        <DocumentPreview title={t('reports.workerEarnings')} onClose={() => setActiveReport(null)}>
          <WorkerEarningsStatement
            worker={workerReportData.worker}
            dateRange={{ from: toRangeBoundary(from), to: toRangeBoundary(to, true) }}
            jobs={workerReportData.jobs}
            totalEarnings={workerReportData.totalEarnings}
            totalJobs={workerReportData.totalJobs}
          />
        </DocumentPreview>
      )}

      {activeReport === 'inventory' && data && (
        <DocumentPreview title={t('reports.inventory')} onClose={() => setActiveReport(null)}>
          <InventoryValuation
            parts={data.parts || []}
            totals={{
              totalParts: data.totalParts || 0,
              totalValue: data.totalValue || 0,
              totalSellValue: data.totalSellValue || 0,
              lowStockCount: data.lowStock?.length || 0,
              outOfStockCount: data.outOfStock?.length || 0
            }}
            generatedAt={new Date().toISOString()}
          />
        </DocumentPreview>
      )}

      {activeReport === 'posSales' && salesSummaryData.length > 0 && (
        <DocumentPreview title={t('reports.posSales')} onClose={() => setActiveReport(null)}>
          <SalesSummary
            dateRange={{ from: toRangeBoundary(from), to: toRangeBoundary(to, true) }}
            dailyData={salesSummaryData.map((d: any) => ({ date: d.date, jobRevenue: d.jobRevenue || 0, posRevenue: d.posRevenue || 0, totalRevenue: d.totalRevenue || 0, jobCount: d.jobCount || 0, posCount: d.posCount || 0 }))}
            totals={{
              totalJobRevenue: salesSummaryData.reduce((s: number, d: any) => s + (d.jobRevenue || 0), 0),
              totalPosRevenue: salesSummaryData.reduce((s: number, d: any) => s + (d.posRevenue || 0), 0),
              totalRevenue: salesSummaryData.reduce((s: number, d: any) => s + (d.totalRevenue || 0), 0)
            }}
            posSales={Array.isArray(data) ? data.map((s: any) => ({ id: s.id, createdAt: s.createdAt, cashierName: s.cashierName || '-', customerName: s.customerName, total: s.total, items: (s.items || []).map((i: any) => ({ partName: i.partName, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })) })) : []}
          />
        </DocumentPreview>
      )}
    </div>
  )
}
