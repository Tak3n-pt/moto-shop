import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { CustomerStatementProps } from './types'

export default function CustomerStatement({
  customer,
  jobs,
  totalSpent,
  totalPaid,
  outstanding,
}: CustomerStatementProps) {
  const { t } = useTranslation()

  const title = t('documents.customerStatement.title', 'CUSTOMER STATEMENT')

  const paymentStatusColor = (status: string) =>
    status === 'paid' ? '#16a34a' : status === 'partial' ? '#d97706' : '#dc2626'

  const paymentStatusLabel = (status: string) =>
    status === 'paid'
      ? t('jobs.paid', 'Paid')
      : status === 'partial'
        ? t('jobs.partial', 'Partial')
        : t('jobs.unpaid', 'Unpaid')

  return (
    <DocumentLayout title={title}>
      {/* Customer info block */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: 14,
          marginBottom: 20,
          fontSize: 13,
          color: '#000',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>
          {t('documents.customerStatement.customerInfo', 'Customer Information')}
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#666' }}>{t('customers.name', 'Name')}</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{customer.name}</div>
          </div>
          {customer.phone && (
            <div>
              <div style={{ fontSize: 11, color: '#666' }}>{t('documents.phone', 'Tel')}</div>
              <div style={{ fontWeight: 600 }}>{customer.phone}</div>
            </div>
          )}
          {customer.motorcycle && (
            <div>
              <div style={{ fontSize: 11, color: '#666' }}>{t('customers.motorcycle', 'Motorcycle')}</div>
              <div style={{ fontWeight: 600 }}>{customer.motorcycle}</div>
            </div>
          )}
        </div>
      </div>

      {/* Jobs table */}
      <table className="doc-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'center', width: '8%' }}>
              {t('documents.customerStatement.jobNo', 'Job #')}
            </th>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'right', width: '13%' }}>
              {t('documents.date', 'Date')}
            </th>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'left', width: '30%' }}>
              {t('documents.customerStatement.description', 'Description')}
            </th>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'right', width: '16%' }}>
              {t('documents.customerStatement.total', 'Total')}
            </th>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'right', width: '16%' }}>
              {t('documents.customerStatement.paid', 'Paid')}
            </th>
            <th style={{ padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', textAlign: 'right', width: '17%' }}>
              {t('documents.customerStatement.balance', 'Balance')}
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => {
            const balance = job.totalAmount - job.amountPaid
            return (
              <tr key={job.id}>
                <td style={{ padding: 8, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  #{job.id}
                </td>
                <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {formatDate(job.createdAt)}
                </td>
                <td style={{ padding: 8, border: '1px solid #999', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {job.description || '—'}
                </td>
                <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {formatDZD(job.totalAmount)}
                </td>
                <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {formatDZD(job.amountPaid)}
                </td>
                <td
                  style={{
                    padding: 8,
                    border: '1px solid #999',
                    textAlign: 'right',
                    fontWeight: balance > 0 ? 700 : 400,
                    color: balance > 0 ? '#dc2626' : '#16a34a',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  {formatDZD(balance)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Summary section */}
      <div
        className="no-break"
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}
      >
        <div style={{ minWidth: 280, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #eee', color: '#000' }}>
            <span>{t('documents.customerStatement.totalSpent', 'Total Spent')}</span>
            <span style={{ fontWeight: 600 }}>{formatDZD(totalSpent)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #eee', color: '#000' }}>
            <span>{t('documents.customerStatement.totalPaid', 'Total Paid')}</span>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatDZD(totalPaid)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              background: outstanding > 0 ? '#dc2626' : '#16a34a',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: '0 0 4px 4px',
            }}
          >
            <span>{t('documents.customerStatement.outstanding', 'Outstanding Balance')}</span>
            <span>{formatDZD(outstanding)}</span>
          </div>
        </div>
      </div>
    </DocumentLayout>
  )
}
