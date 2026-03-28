import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDate } from '../../lib/utils'
import type { BonDeLivraisonProps } from './types'

export default function BonDeLivraison({
  number,
  date,
  customer,
  jobReference,
  items,
}: BonDeLivraisonProps) {
  const { t } = useTranslation()

  return (
    <DocumentLayout
      title={t('documents.bonLivraison.title', 'BON DE LIVRAISON')}
      documentNumber={number}
      date={formatDate(date)}
    >
      {/* Customer + Job info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 4, padding: 12, fontSize: 13, color: '#000' }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            {t('documents.bonLivraison.deliveredTo', 'Delivered To')}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{customer.name}</div>
          {customer.phone && (
            <div style={{ marginTop: 2, fontSize: 12 }}>
              {t('documents.phone', 'Tel')}: {customer.phone}
            </div>
          )}
        </div>
        <div style={{ minWidth: 180, border: '1px solid #ccc', borderRadius: 4, padding: 12, fontSize: 12, color: '#000' }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            {t('documents.bonLivraison.reference', 'Reference')}
          </div>
          <div>
            <strong>{t('documents.bonLivraison.jobRef', 'Job Ref')}</strong>: {jobReference}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>{t('documents.date', 'Date')}</strong>: {formatDate(date)}
          </div>
        </div>
      </div>

      {/* Items table — NO prices */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '80%' }}>
              {t('documents.bonLivraison.description', 'Description')}
            </th>
            <th style={{ textAlign: 'center', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '20%' }}>
              {t('documents.bonLivraison.qty', 'Quantity')}
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
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature block */}
      <div
        className="no-break"
        style={{
          marginTop: 48,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 32,
          fontSize: 13,
          color: '#000',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 40 }}>
            {t('documents.bonLivraison.receivedBy', 'Received by')}: _________________________
          </div>
          <div style={{ borderTop: '1px solid #999', width: 200, paddingTop: 4, fontSize: 11, color: '#666' }}>
            {t('documents.bonLivraison.signature', 'Signature')}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ marginBottom: 40 }}>
            {t('documents.date', 'Date')}: _________________________
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>{formatDate(date)}</div>
        </div>
      </div>
    </DocumentLayout>
  )
}
