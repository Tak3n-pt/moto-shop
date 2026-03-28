import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { InventoryValuationProps } from './types'

export default function InventoryValuation({ parts, totals, generatedAt }: InventoryValuationProps) {
  const { t } = useTranslation()

  const title = t('documents.inventoryValuation.title', 'INVENTORY VALUATION')
  const potentialProfit = totals.totalSellValue - totals.totalValue

  return (
    <DocumentLayout title={title}>
      {/* Generated date */}
      <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#555' }}>
        {t('documents.generatedAt', 'Generated')}: <strong>{formatDate(generatedAt)}</strong>
      </div>

      {/* STOCK OVERVIEW */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 4 }}>
          {t('documents.inventoryValuation.stockOverview', 'STOCK OVERVIEW')}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 16 }}>
          {t('documents.inventoryValuation.stockOverviewDesc', 'A snapshot of everything currently in your inventory and what it is worth')}
        </div>

        {/* Top row — 3 value boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          {/* Total parts */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 14px', textAlign: 'center', background: '#f9fafb' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.inventoryValuation.totalParts', 'Total Parts in Inventory')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#000' }}>
              {totals.totalParts}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {t('documents.inventoryValuation.differentItems', 'different items')}
            </div>
          </div>

          {/* What you paid */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 14px', textAlign: 'center', background: '#f9fafb' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.inventoryValuation.whatYouPaid', 'What You Paid for Stock')}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
              {formatDZD(totals.totalValue)}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {t('documents.inventoryValuation.totalBuyPrice', 'total buy price × quantity')}
            </div>
          </div>

          {/* What stock is worth */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 14px', textAlign: 'center', background: '#f9fafb' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.inventoryValuation.stockWorthIfSold', 'What Stock is Worth if Sold')}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
              {formatDZD(totals.totalSellValue)}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {t('documents.inventoryValuation.totalSellPrice', 'total sell price × quantity')}
            </div>
          </div>
        </div>

        {/* Potential profit — highlighted */}
        <div style={{
          border: `2px solid ${potentialProfit >= 0 ? '#16a34a' : '#dc2626'}`,
          borderRadius: 4,
          padding: '10px 16px',
          background: potentialProfit >= 0 ? '#f0fdf4' : '#fef2f2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>
              {t('documents.inventoryValuation.potentialProfit', 'Potential Profit in Stock')}
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
              {t('documents.inventoryValuation.potentialProfitNote', 'How much you would make if you sold all current stock at sell price')}
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: potentialProfit >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatDZD(potentialProfit)}
          </div>
        </div>

        {/* Needs attention — stock alerts */}
        {(totals.lowStockCount > 0 || totals.outOfStockCount > 0) && (
          <div style={{ border: '1px solid #fbbf24', borderRadius: 4, padding: '10px 14px', background: '#fffbeb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              {t('documents.inventoryValuation.needsAttention', 'NEEDS ATTENTION')}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
              {totals.lowStockCount > 0 && (
                <div>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>{totals.lowStockCount}</span>
                  {' '}
                  <span style={{ color: '#555' }}>{t('documents.inventoryValuation.lowStockItems', 'items running low')}</span>
                </div>
              )}
              {totals.outOfStockCount > 0 && (
                <div>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>{totals.outOfStockCount}</span>
                  {' '}
                  <span style={{ color: '#555' }}>{t('documents.inventoryValuation.outOfStockItems', 'items out of stock')}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {totals.lowStockCount === 0 && totals.outOfStockCount === 0 && (
          <div style={{ border: '1px solid #d1fae5', borderRadius: 4, padding: '8px 14px', background: '#f0fdf4', fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            {t('documents.inventoryValuation.allGood', 'All items are in stock — no action needed')}
          </div>
        )}
      </div>

      {/* Full inventory table */}
      <table className="doc-table" style={{ fontSize: 11 }}>
        <thead>
          <tr>
            {[
              { label: t('documents.inventoryValuation.part', 'Part'), align: 'left', width: '28%' },
              { label: t('documents.inventoryValuation.category', 'Category'), align: 'left', width: '16%' },
              { label: t('documents.inventoryValuation.stock', 'Stock'), align: 'center', width: '10%' },
              { label: t('documents.inventoryValuation.buyPrice', 'Buy Price'), align: 'right', width: '15%' },
              { label: t('documents.inventoryValuation.sellPrice', 'Sell Price'), align: 'right', width: '15%' },
              { label: t('documents.inventoryValuation.stockValue', 'Stock Value'), align: 'right', width: '16%' },
            ].map((h, i) => (
              <th
                key={i}
                style={{
                  padding: 7,
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
          {parts.map((part, i) => {
            const isOutOfStock = part.quantity === 0
            const isLowStock = !isOutOfStock && part.quantity <= part.minStock
            const stockValue = part.buyPrice * part.quantity
            const rowBg = isOutOfStock
              ? '#fff5f5'
              : isLowStock
                ? '#fffbeb'
                : i % 2 === 0
                  ? '#fff'
                  : '#fafafa'

            return (
              <tr key={i}>
                <td style={{ padding: 7, border: '1px solid #999', color: '#000', background: rowBg }}>
                  {part.name}
                </td>
                <td style={{ padding: 7, border: '1px solid #999', color: '#555', background: rowBg }}>
                  {part.category || '—'}
                </td>
                <td
                  style={{
                    padding: 7,
                    border: '1px solid #999',
                    textAlign: 'center',
                    fontWeight: isOutOfStock || isLowStock ? 700 : 400,
                    color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#000',
                    background: rowBg,
                  }}
                >
                  {part.quantity}
                </td>
                <td style={{ padding: 7, border: '1px solid #999', textAlign: 'right', color: '#000', background: rowBg }}>
                  {formatDZD(part.buyPrice)}
                </td>
                <td style={{ padding: 7, border: '1px solid #999', textAlign: 'right', color: '#000', background: rowBg }}>
                  {formatDZD(part.sellPrice)}
                </td>
                <td style={{ padding: 7, border: '1px solid #999', textAlign: 'right', color: '#000', background: rowBg, fontWeight: 600 }}>
                  {formatDZD(stockValue)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={5}
              style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 700, background: '#e8e8e8', color: '#000', fontSize: 12 }}
            >
              {t('documents.inventoryValuation.totalCostValue', 'Total Cost Value')}
            </td>
            <td
              style={{ padding: 8, border: '1px solid #999', textAlign: 'right', fontWeight: 700, background: '#1f2937', color: '#fff', fontSize: 12 }}
            >
              {formatDZD(totals.totalValue)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 11, color: '#555' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#fff5f5', border: '1px solid #ccc' }}></span>
          {t('documents.inventoryValuation.outOfStockLegend', 'Out of stock')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#fffbeb', border: '1px solid #ccc' }}></span>
          {t('documents.inventoryValuation.lowStockLegend', 'Low stock')}
        </span>
      </div>
    </DocumentLayout>
  )
}
