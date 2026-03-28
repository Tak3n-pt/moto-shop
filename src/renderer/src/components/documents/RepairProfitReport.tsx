import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { RepairProfitReportProps } from './types'

export default function RepairProfitReport({
  dateRange,
  summary,
  posSummary,
  totalExpenses,
  netProfit,
  jobs,
}: RepairProfitReportProps) {
  const { t } = useTranslation()

  const title = t('documents.profitReport.title', 'REPAIR PROFIT REPORT')
  const periodLabel = `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`

  const totalRevenue = summary.totalRevenue + posSummary.totalRevenue
  const totalCosts = summary.totalWorkerProfit + summary.totalPartsCost + totalExpenses
  const repairStoreKeeps = summary.totalStoreRepairProfit
  const partsJobProfit = summary.totalStorePartsProfit
  const posProfit = posSummary.totalProfit

  return (
    <DocumentLayout title={title}>
      {/* Period */}
      <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#555' }}>
        {t('documents.period', 'Period')}: <strong>{periodLabel}</strong>
      </div>

      {/* HOW YOUR MONEY FLOWS — explanation box */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '12px 16px', marginBottom: 24, background: '#f9fafb' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6, letterSpacing: '0.05em' }}>
          {t('documents.profitReport.howMoneyFlows', 'HOW YOUR MONEY FLOWS')}
        </div>
        <div style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>
          {t('documents.profitReport.flowExplanation', 'Customers pay for repairs and parts. From that money, you pay workers (30% of repair fees) and cover the cost of parts. What is left — minus any shop expenses — is your net profit.')}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#555', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#16a34a' }}>
            {t('documents.profitReport.flowRevenue', 'Revenue earned')} ({formatDZD(totalRevenue)})
          </span>
          <span>{'→'}</span>
          <span style={{ color: '#dc2626' }}>
            {t('documents.profitReport.flowCosts', 'Minus costs')} ({formatDZD(totalCosts)})
          </span>
          <span>{'→'}</span>
          <span style={{ fontWeight: 700, color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
            {t('documents.profitReport.flowNet', 'Net profit')} ({formatDZD(netProfit)})
          </span>
        </div>
      </div>

      {/* SECTION 1 — YOUR BOTTOM LINE */}
      <div style={{
        border: `2px solid ${netProfit >= 0 ? '#16a34a' : '#dc2626'}`,
        borderRadius: 6,
        padding: '16px 20px',
        marginBottom: 24,
        background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', marginBottom: 6 }}>
          {t('documents.profitReport.bottomLine', 'YOUR BOTTOM LINE')}
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: netProfit >= 0 ? '#16a34a' : '#dc2626', lineHeight: 1.1, marginBottom: 6 }}>
          {formatDZD(netProfit)}
        </div>
        <div style={{ fontSize: 11, color: '#666' }}>
          {t('documents.profitReport.bottomLineDesc', 'This is what you actually earned after all costs and expenses')}
        </div>
      </div>

      {/* SECTION 2 — WHERE THE MONEY CAME FROM */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 4 }}>
          {t('documents.profitReport.moneyFrom', 'WHERE THE MONEY CAME FROM')}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 12 }}>
          {t('documents.profitReport.moneyFromDesc', 'All the money that came into your shop during this period')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Repair jobs */}
          <div style={{ border: '1px solid #d1fae5', borderRadius: 4, padding: '10px 14px', background: '#f0fdf4' }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>
              {t('documents.profitReport.repairJobs', 'Repair Jobs')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
              {formatDZD(summary.totalRevenue)}
            </div>
            <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>
              {summary.totalJobs} {t('documents.profitReport.jobsCompleted', 'jobs completed')}
            </div>
          </div>
          {/* POS sales */}
          <div style={{ border: '1px solid #d1fae5', borderRadius: 4, padding: '10px 14px', background: '#f0fdf4' }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>
              {t('documents.profitReport.partsSalesPOS', 'Parts Sales (POS)')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
              {formatDZD(posSummary.totalRevenue)}
            </div>
            <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>
              {posSummary.saleCount} {t('documents.profitReport.salesMade', 'sales made')}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #ccc', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>
            {t('documents.profitReport.combinedRevenue', 'Combined Revenue')}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
            {formatDZD(totalRevenue)}
          </span>
        </div>
      </div>

      {/* SECTION 3 — WHERE THE MONEY WENT */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 4 }}>
          {t('documents.profitReport.moneyWent', 'WHERE THE MONEY WENT')}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 12 }}>
          {t('documents.profitReport.moneyWentDesc', 'All the costs your shop had during this period')}
        </div>

        {/* Worker payments */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.workerPayments', 'Worker Payments')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.workerPaymentsNote', '30% of repair fees paid to workers')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
            -{formatDZD(summary.totalWorkerProfit)}
          </div>
        </div>

        {/* Parts cost */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.partsCostJobs', 'Parts Cost (Jobs)')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.partsCostNote', 'What you paid to buy parts used in repairs')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
            -{formatDZD(summary.totalPartsCost)}
          </div>
        </div>

        {/* Expenses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.expenses', 'Expenses')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.expensesNote', 'Rent, utilities, supplies, and other shop costs')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
            -{formatDZD(totalExpenses)}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ccc', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>
            {t('documents.profitReport.totalCosts', 'Total Costs')}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
            -{formatDZD(totalCosts)}
          </span>
        </div>
      </div>

      {/* SECTION 4 — YOUR PROFIT BREAKDOWN */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 4 }}>
          {t('documents.profitReport.profitBreakdown', 'YOUR PROFIT BREAKDOWN')}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 12 }}>
          {t('documents.profitReport.profitBreakdownDesc', 'How profit is built up from each part of your business')}
        </div>

        {/* From repairs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.fromRepairs', 'From Repairs')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.fromRepairsCalc', 'Revenue minus worker pay — what the shop keeps for repair labor')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: repairStoreKeeps >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatDZD(repairStoreKeeps)}
          </div>
        </div>

        {/* From parts in jobs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.fromPartsJobs', 'From Parts (Jobs)')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.fromPartsJobsCalc', 'Sold to customers minus what you paid — markup profit on repair parts')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: partsJobProfit >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatDZD(partsJobProfit)}
          </div>
        </div>

        {/* From POS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#000' }}>
              {t('documents.profitReport.fromPOS', 'From POS Sales')}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              {t('documents.profitReport.fromPOSCalc', 'Sold at counter minus cost price — profit from direct parts sales')}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: posProfit >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatDZD(posProfit)}
          </div>
        </div>

        {/* Minus expenses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 12, color: '#000' }}>
            {t('documents.profitReport.minusExpenses', 'Minus Expenses')}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
            -{formatDZD(totalExpenses)}
          </div>
        </div>

        {/* Net profit final */}
        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          borderRadius: 4,
          background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${netProfit >= 0 ? '#86efac' : '#fca5a5'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>
            = {t('documents.profitReport.netProfit', 'NET PROFIT')}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatDZD(netProfit)}
          </span>
        </div>
      </div>

      {/* SECTION 5 — JOB DETAILS */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6, letterSpacing: '0.05em' }}>
        {t('documents.profitReport.jobDetails', 'JOB DETAILS')} ({summary.totalJobs})
      </div>
      <div style={{ fontSize: 11, color: '#777', marginBottom: 10 }}>
        {t('documents.profitReport.jobDetailsDesc', 'Breakdown of every repair job and how much each one earned')}
      </div>

      {jobs.map((job: any, i: number) => (
        <div key={i} className="no-break" style={{ border: '1px solid #ccc', borderRadius: 4, marginBottom: 10, padding: 10, background: '#fff' }}>
          {/* Job header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#000' }}>
            <div>
              <strong>#{job.id}</strong>
              {' — '}
              <span>{job.customerName || '-'}</span>
              {job.motorcycleBrand && (
                <span style={{ color: '#666' }}>
                  {' '}({job.motorcycleBrand} {job.motorcycleModel || ''}{job.plateNumber ? ` • ${job.plateNumber}` : ''})
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right', color: '#555' }}>
              <span>{formatDate(job.completedAt || job.createdAt)}</span>
              {' • '}
              <span>{job.workerName || '-'}</span>
            </div>
          </div>

          {job.description && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{job.description}</div>
          )}

          {/* Parts + services table */}
          <table className="doc-table" style={{ fontSize: 11, marginBottom: 6 }}>
            <thead>
              <tr>
                <th style={{ padding: 5, border: '1px solid #ccc', background: '#f5f5f5', color: '#000', textAlign: 'left' }}>
                  {t('documents.facture.item', 'Item')}
                </th>
                <th style={{ padding: 5, border: '1px solid #ccc', background: '#f5f5f5', color: '#000', textAlign: 'center', width: '10%' }}>
                  {t('documents.facture.qty', 'Qty')}
                </th>
                <th style={{ padding: 5, border: '1px solid #ccc', background: '#f5f5f5', color: '#000', textAlign: 'right', width: '18%' }}>
                  {t('documents.facture.unitPrice', 'Unit Price')}
                </th>
                <th style={{ padding: 5, border: '1px solid #ccc', background: '#f5f5f5', color: '#000', textAlign: 'right', width: '18%' }}>
                  {t('documents.facture.total', 'Total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {job.repairFee > 0 && (
                <tr>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000' }}>{t('invoice.repairService', 'Repair Service')}</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'right' }}>{formatDZD(job.repairFee)}</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'right' }}>{formatDZD(job.repairFee)}</td>
                </tr>
              )}
              {(job.parts || []).map((p: any, pi: number) => (
                <tr key={pi}>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000' }}>{p.partName}</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'center' }}>{p.quantity}</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'right' }}>{formatDZD(p.sellPrice)}</td>
                  <td style={{ padding: 5, border: '1px solid #ccc', color: '#000', textAlign: 'right' }}>{formatDZD(p.sellPrice * p.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Per-job money summary — easy to read */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#000',
            paddingTop: 6,
            borderTop: '1px solid #eee',
            flexWrap: 'wrap',
            gap: 4,
          }}>
            <span>
              {t('documents.profitReport.customerPaid', 'Customer paid')}:{' '}
              <strong style={{ color: '#16a34a' }}>{formatDZD(job.totalAmount ?? 0)}</strong>
            </span>
            <span>
              {t('documents.profitReport.workerGets', 'Worker gets')}:{' '}
              <strong style={{ color: '#dc2626' }}>{formatDZD(job.workerProfit ?? 0)}</strong>
            </span>
            <span>
              {t('documents.profitReport.shopKeeps', 'Shop keeps')}:{' '}
              <strong style={{ color: '#000' }}>{formatDZD((job.storeRepairProfit ?? 0) + (job.storePartsProfit ?? 0))}</strong>
            </span>
            {job.discount > 0 && (
              <span>
                {t('documents.facture.discount', 'Discount')}: <strong>-{formatDZD(job.discount)}</strong>
              </span>
            )}
          </div>
        </div>
      ))}
    </DocumentLayout>
  )
}
