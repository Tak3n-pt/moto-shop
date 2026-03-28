import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { PartsCatalogProps, CatalogPart } from './types'

export default function PartsCatalog({ parts, generatedAt }: PartsCatalogProps) {
  const { t } = useTranslation()

  const title = t('documents.partsCatalog.title', 'PARTS CATALOG')

  // Group by category, uncategorized last
  const grouped = parts.reduce<Record<string, CatalogPart[]>>((acc, part) => {
    const cat = part.category || t('documents.partsCatalog.uncategorized', 'Uncategorized')
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(part)
    return acc
  }, {})

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const uncategorized = t('documents.partsCatalog.uncategorized', 'Uncategorized')
    if (a === uncategorized) return 1
    if (b === uncategorized) return -1
    return a.localeCompare(b)
  })

  return (
    <DocumentLayout title={title}>
      {/* Generated date */}
      <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#555' }}>
        {t('documents.generatedAt', 'Generated')}: <strong>{formatDate(generatedAt)}</strong>
        {' '}·{' '}
        {t('documents.partsCatalog.totalParts', 'Total Parts')}: <strong>{parts.length}</strong>
      </div>

      {sortedCategories.map((category) => (
        <div key={category} className="no-break" style={{ marginBottom: 20 }}>
          {/* Category header */}
          <div
            className="doc-section-header"
            style={{
              background: '#1f2937',
              color: '#fff',
              padding: '6px 10px',
              fontWeight: 700,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 0,
            }}
          >
            {category} ({grouped[category].length})
          </div>

          {/* Parts table */}
          <table className="doc-table" style={{ fontSize: 12, marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 7, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '55%' }}>
                  {t('documents.partsCatalog.partName', 'Part Name')}
                </th>
                <th style={{ textAlign: 'right', padding: 7, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '25%' }}>
                  {t('documents.partsCatalog.price', 'Price')}
                </th>
                <th style={{ textAlign: 'center', padding: 7, border: '1px solid #999', background: '#f0f0f0', color: '#000', width: '20%' }}>
                  {t('documents.partsCatalog.inStock', 'In Stock')}
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped[category].map((part, i) => (
                <tr key={i}>
                  <td style={{ padding: 7, border: '1px solid #999', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {part.name}
                  </td>
                  <td style={{ padding: 7, border: '1px solid #999', textAlign: 'right', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {formatDZD(part.sellPrice)}
                  </td>
                  <td style={{ padding: 7, border: '1px solid #999', textAlign: 'center', color: '#000', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {part.quantity > 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        ✓ {part.quantity}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        {t('documents.partsCatalog.outOfStock', 'Out of stock')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </DocumentLayout>
  )
}
