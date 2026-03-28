import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { SalesSummaryProps } from './types'

export default function SalesSummary({ dateRange, dailyData, totals, posSales }: SalesSummaryProps) {
  const { t } = useTranslation()

  const title = t('documents.salesSummary.title', 'SALES SUMMARY')
  const periodLabel = `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`

  const totalJobs = dailyData.reduce((sum, d) => sum + d.jobCount, 0)
  const totalPosSales = dailyData.reduce((sum, d) => sum + d.posCount, 0)

  return (
    <DocumentLayout title={title}>
      {/* Period */}
      <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#555' }}>
        {t('documents.period', 'Period')}: <strong>{periodLabel}</strong>
      </div>

      {/* REVENUE OVERVIEW */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 4 }}>
          {t('documents.salesSummary.revenueOverview', 'REVENUE OVERVIEW')}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 16 }}>
          {t('documents.salesSummary.revenueOverviewDesc', 'How much money your shop brought in during this period')}
        </div>

        {/* Two income sources side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* From repair jobs */}
          <div style={{ border: '1px solid #d1fae5', borderRadius: 4, padding: '10px 14px', background: '#f0fdf4' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.salesSummary.fromRepairJobs', 'From Repair Jobs')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>
              {formatDZD(totals.totalJobRevenue)}
            </div>
            <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>
              {t('documents.salesSummary.fromJobsNote', 'from')} {totalJobs} {t('documents.salesSummary.jobsCompleted', 'jobs')}
            </div>
          </div>

          {/* From POS sales */}
          <div style={{ border: '1px solid #d1fae5', borderRadius: 4, padding: '10px 14px', background: '#f0fdf4' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.salesSummary.fromPartsSalesPOS', 'From Parts Sales (POS)')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>
              {formatDZD(totals.totalPosRevenue)}
            </div>
            <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>
              {t('documents.salesSummary.fromPOSNote', 'from')} {totalPosSales} {t('documents.salesSummary.salesMade', 'sales')}
            </div>
          </div>
        </div>

        {/* Total revenue — main highlighted number */}
        <div style={{
          border: '2px solid #1f2937',
          borderRadius: 4,
          padding: '12px 16px',
          background: '#1f2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {t('documents.salesSummary.totalRevenue', 'TOTAL REVENUE')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
            {formatDZD(totals.totalRevenue)}
          </div>
        </div>
      </div>

      {/* Daily data table */}
      <table className="doc-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            {[
              { label: t('documents.date', 'Date'), align: 'left', width: '16%' },
              { label: t('documents.salesSummary.jobs', 'Jobs'), align: 'center', width: '8%' },
              { label: t('documents.salesSummary.jobRevenue', 'Job Revenue'), align: 'right', width: '19%' },
              { label: t('documents.salesSummary.posSales', 'POS Sales'), align: 'center', width: '10%' },
              { label: t('documents.salesSummary.posRevenue', 'POS Revenue'), align: 'right', width: '19%' },
              { label: t('documents.salesSummary.dailyTotal', 'Total'), align: 'right', width: '19%' },
            ].map((h, i) => (
              <th
                key={i}
                style={{
                  padding: 8,
                  border: '1px solid #999',
                  background: '#f0f0f0',
                  color: '#000',
                  textAlign: h.align as any,
                  width: h.width,
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dailyData.map((day, i) => (
            <tr key={i}>
              <td style={{ padding: 8, border: '1px solid #999', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDate(day.date)}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {day.jobCount}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDZD(day.jobRevenue)}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {day.posCount}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDZD(day.posRevenue)}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 600, color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDZD(day.totalRevenue)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={2}
              style={{ padding: 8, border: '1px solid #999', fontWeight: 700, background: '#e8e8e8', color: '#000', textAlign: 'center', fontSize: 12 }}
            >
              {t('documents.salesSummary.grandTotal', 'Grand Total')}
            </td>
            <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 700, background: '#e8e8e8', color: '#000', fontSize: 12 }}>
              {formatDZD(totals.totalJobRevenue)}
            </td>
            <td style={{ padding: 8, border: '1px solid #999', background: '#e8e8e8' }}></td>
            <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 700, background: '#e8e8e8', color: '#000', fontSize: 12 }}>
              {formatDZD(totals.totalPosRevenue)}
            </td>
            <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 700, background: '#1f2937', color: '#fff', fontSize: 13 }}>
              {formatDZD(totals.totalRevenue)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* POS Sale Details */}
      {posSales && posSales.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginTop: 24, marginBottom: 6 }}>
            {t('documents.salesSummary.posSalesDetail', 'POS Sales Detail')} ({posSales.length})
          </div>
          {posSales.map((sale) => (
            <div key={sale.id} className="no-break" style={{ border: '1px solid #ccc', borderRadius: 4, marginBottom: 8, padding: 8, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: '#000' }}>
                <div>
                  <strong>#{sale.id}</strong>
                  {sale.customerName && <span> — {sale.customerName}</span>}
                </div>
                <div style={{ color: '#555' }}>
                  {formatDate(sale.createdAt)} • {sale.cashierName}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 4 }}>
                {sale.items.map((item, j) => (
                  <span key={j}>
                    {item.partName} x{item.quantity} ({formatDZD(item.lineTotal)})
                    {j < sale.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#000', textAlign: 'right' }}>
                {t('documents.facture.total', 'Total')}: {formatDZD(sale.total)}
              </div>
            </div>
          ))}
        </>
      )}
    </DocumentLayout>
  )
}
