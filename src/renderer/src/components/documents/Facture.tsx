import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { FactureProps } from './types'

export default function Facture({
  isProforma,
  invoiceNumber,
  date,
  customer,
  motorcycle,
  items,
  subtotal,
  discount,
  total,
  amountPaid,
  remaining,
  paymentStatus,
  warranty,
}: FactureProps) {
  const { t } = useTranslation()

  const title = isProforma
    ? t('documents.facture.proformaTitle', 'FACTURE PROFORMA')
    : t('documents.facture.title', 'FACTURE')

  const paymentStatusLabel =
    paymentStatus === 'paid'
      ? t('jobs.paid', 'Paid')
      : paymentStatus === 'partial'
        ? t('jobs.partial', 'Partial')
        : t('jobs.unpaid', 'Unpaid')

  const paymentStatusColor =
    paymentStatus === 'paid' ? '#16a34a' : paymentStatus === 'partial' ? '#d97706' : '#dc2626'

  return (
    <DocumentLayout title={title} documentNumber={invoiceNumber} date={formatDate(date)}>
      {/* Proforma watermark */}
      {isProforma && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-35deg)',
            fontSize: 72,
            fontWeight: 900,
            color: 'rgba(0,0,0,0.05)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            zIndex: 0,
          }}
        >
          PROFORMA
        </div>
      )}

      {/* Customer + Meta info block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        {/* Customer info */}
        <div
          style={{
            flex: 1,
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 12,
            fontSize: 13,
            color: '#000',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', fontSize: 11, color: '#555' }}>
            {t('documents.facture.billTo', 'Bill To')}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{customer.name}</div>
          {customer.phone && (
            <div style={{ marginTop: 2 }}>
              {t('documents.phone', 'Tel')}: {customer.phone}
            </div>
          )}
          {motorcycle && (motorcycle.brand || motorcycle.model || motorcycle.plate) && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>
              {motorcycle.brand && <span>{motorcycle.brand} </span>}
              {motorcycle.model && <span>{motorcycle.model}</span>}
              {motorcycle.plate && (
                <span style={{ marginLeft: 8, fontWeight: 600 }}>({motorcycle.plate})</span>
              )}
            </div>
          )}
        </div>

        {/* Invoice meta */}
        <div
          style={{
            minWidth: 180,
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 12,
            fontSize: 12,
            color: '#000',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', fontSize: 11, color: '#555' }}>
            {t('documents.facture.invoiceInfo', 'Invoice Info')}
          </div>
          <div>
            <strong>{t('documents.number', 'N°')}</strong>: {invoiceNumber}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>{t('documents.date', 'Date')}</strong>: {formatDate(date)}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="doc-table" style={{ position: 'relative', zIndex: 1 }}>
        <thead>
          <tr>
            <th style={{ width: '45%', textAlign: 'left', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000' }}>
              {t('documents.facture.description', 'Description')}
            </th>
            <th style={{ width: '12%', textAlign: 'center', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000' }}>
              {t('documents.facture.qty', 'Qty')}
            </th>
            <th style={{ width: '20%', textAlign: 'right', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000' }}>
              {t('documents.facture.unitPrice', 'Unit Price')}
            </th>
            <th style={{ width: '23%', textAlign: 'right', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000' }}>
              {t('documents.facture.total', 'Total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: 8, border: '1px solid #999', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {item.description}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {item.qty}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDZD(item.unitPrice)}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {formatDZD(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ minWidth: 260, fontSize: 13 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderBottom: '1px solid #eee',
              color: '#000',
            }}
          >
            <span>{t('documents.facture.subtotal', 'Subtotal')}</span>
            <span>{formatDZD(subtotal)}</span>
          </div>
          {discount !== undefined && discount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderBottom: '1px solid #eee',
                color: '#dc2626',
              }}
            >
              <span>{t('documents.facture.discount', 'Discount')}</span>
              <span>- {formatDZD(discount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              background: '#1f2937',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <span>{t('documents.facture.total', 'Total')}</span>
            <span>{formatDZD(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment section — hidden for proforma */}
      {!isProforma && (
        <div className="no-break" style={{ border: '1px solid #ccc', borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
            {t('documents.facture.paymentDetails', 'Payment Details')}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                {t('documents.facture.amountPaid', 'Amount Paid')}
              </div>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>{formatDZD(amountPaid)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                {t('documents.facture.remaining', 'Remaining')}
              </div>
              <div style={{ fontWeight: 600, color: remaining > 0 ? '#dc2626' : '#000' }}>
                {formatDZD(remaining)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                {t('documents.facture.status', 'Status')}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 12,
                  background: paymentStatusColor,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {paymentStatusLabel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warranty */}
      {warranty && (
        <div
          className="no-break"
          style={{
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
            color: '#333',
          }}
        >
          <strong>{t('documents.facture.warranty', 'Warranty')}:</strong>{' '}
          {warranty.months} {t('documents.facture.months', 'months')}
          {warranty.expiresAt && (
            <span>
              {' '}— {t('documents.facture.warrantyExpires', 'Expires')}: {formatDate(warranty.expiresAt)}
            </span>
          )}
        </div>
      )}

      {/* Thank you */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
          color: '#555',
          fontStyle: 'italic',
        }}
      >
        {t('documents.facture.thankYou', 'Thank you for your business!')}
      </div>
    </DocumentLayout>
  )
}
