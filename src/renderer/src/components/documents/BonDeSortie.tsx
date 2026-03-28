import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDate } from '../../lib/utils'
import type { BonDeSortieProps } from './types'

export default function BonDeSortie({
  number,
  date,
  jobReference,
  worker,
  items,
}: BonDeSortieProps) {
  const { t } = useTranslation()

  return (
    <DocumentLayout
      title={t('documents.bonSortie.title', 'BON DE SORTIE')}
      documentNumber={number}
      date={formatDate(date)}
    >
      {/* Internal stamp */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            border: '2px solid #dc2626',
            color: '#dc2626',
            padding: '4px 16px',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
            borderRadius: 2,
          }}
        >
          {t('documents.bonSortie.internalDocument', 'INTERNAL DOCUMENT')}
        </span>
      </div>

      {/* Info block */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          fontSize: 13,
          color: '#000',
        }}
      >
        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 4, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            {t('documents.bonSortie.details', 'Details')}
          </div>
          <div>
            <strong>{t('documents.bonSortie.jobRef', 'Job Reference')}</strong>: {jobReference}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>{t('documents.bonSortie.worker', 'Worker')}</strong>: {worker}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>{t('documents.date', 'Date')}</strong>: {formatDate(date)}
          </div>
        </div>
      </div>

      {/* Parts table */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '80%' }}>
              {t('documents.bonSortie.partName', 'Part Name')}
            </th>
            <th style={{ textAlign: 'center', padding: 8, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '20%' }}>
              {t('documents.bonSortie.qty', 'Quantity')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: 8, border: '1px solid #999', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {item.partName}
              </td>
              <td style={{ padding: 8, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {item.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Authorization line */}
      <div
        className="no-break"
        style={{
          marginTop: 56,
          fontSize: 13,
          color: '#000',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          {t('documents.bonSortie.authorizedBy', 'Authorized by')}: _________________________
        </div>
        <div style={{ borderTop: '1px solid #999', width: 220, paddingTop: 4, fontSize: 11, color: '#666' }}>
          {t('documents.bonSortie.signature', 'Signature & Stamp')}
        </div>
      </div>
    </DocumentLayout>
  )
}
