import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import { formatDZD } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

interface LineItem {
  partId: number | null
  partName: string
  quantity: string
  unitBuyPrice: string
  unitSellPrice: string
  searchResults: any[]
}

export default function PurchasePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toasts, addToast } = useToast()
  const [supplierName, setSupplierName] = useState('')
  const [invoiceRef, setInvoiceRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<LineItem[]>([{ partId: null, partName: '', quantity: '1', unitBuyPrice: '', unitSellPrice: '', searchResults: [] }])

  const searchParts = async (index: number, query: string) => {
    const updated = [...items]
    updated[index].partName = query
    updated[index].partId = null
    if (query.length >= 2) {
      const res = await window.api.parts.search(query)
      updated[index].searchResults = res.success ? (res.data || []) : []
    } else {
      updated[index].searchResults = []
    }
    setItems(updated)
  }

  const selectPart = (index: number, part: any) => {
    const updated = [...items]
    updated[index].partId = part.id
    updated[index].partName = part.name
    updated[index].unitBuyPrice = String(part.buyPrice)
    updated[index].unitSellPrice = String(part.sellPrice)
    updated[index].searchResults = []
    setItems(updated)
  }

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    setItems(updated)
  }

  const addRow = () => setItems([...items, { partId: null, partName: '', quantity: '1', unitBuyPrice: '', unitSellPrice: '', searchResults: [] }])
  const removeRow = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i))

  const total = items.reduce((sum, item) => sum + (Number(item.unitBuyPrice) || 0) * (Number(item.quantity) || 0), 0)

  const handleSave = async () => {
    if (!supplierName.trim()) { addToast(t('parts.supplierRequired'), 'error'); return }
    const validItems = items.filter(i => i.partId && Number(i.quantity) > 0)
    if (validItems.length === 0) { addToast(t('parts.addAtLeastOneItem'), 'error'); return }

    setSaving(true)
    const res = await window.api.purchase.create({
      supplierName, invoiceRef: invoiceRef || undefined,
      items: validItems.map(i => ({ partId: i.partId!, quantity: Number(i.quantity), unitBuyPrice: Number(i.unitBuyPrice), unitSellPrice: Number(i.unitSellPrice) || undefined }))
    })
    setSaving(false)

    if (res.success) {
      addToast(t('common.success'), 'success')
      setTimeout(() => navigate('/parts'), 500)
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/parts')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft size={20} /><span>{t('common.back')}</span>
      </button>
      <h1 className="text-3xl font-bold text-text-primary mb-8">{t('parts.bulkPurchase')}</h1>

      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Input label={t('parts.supplier')} value={supplierName} onChange={e => setSupplierName(e.target.value)} required />
          <Input label={t('parts.invoiceRef')} value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} />
          <Input label={t('parts.purchaseDate')} type="date" value={new Date().toISOString().split('T')[0]} disabled />
        </div>
      </div>

      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{t('parts.addItem')}</h3>
          <Button variant="secondary" size="sm" onClick={addRow}><Plus size={16} />{t('parts.addItem')}</Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4 relative">
                <Input label={idx === 0 ? t('parts.name') : undefined} value={item.partName} onChange={e => searchParts(idx, e.target.value)} placeholder={t('parts.search')} />
                {item.searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {item.searchResults.map((p: any) => (
                      <button key={p.id} onClick={() => selectPart(idx, p)} className="w-full px-4 py-2 text-left text-sm hover:bg-bg-hover text-text-primary flex justify-between transition-colors">
                        <span>{p.name}</span>
                        <span className="text-text-tertiary">{t('parts.stock')}: {p.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Input label={idx === 0 ? t('parts.quantity') : undefined} type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min="1" />
              </div>
              <div className="col-span-2">
                <Input label={idx === 0 ? t('parts.buyPrice') : undefined} type="number" value={item.unitBuyPrice} onChange={e => updateItem(idx, 'unitBuyPrice', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Input label={idx === 0 ? t('parts.sellPrice') : undefined} type="number" value={item.unitSellPrice} onChange={e => updateItem(idx, 'unitSellPrice', e.target.value)} />
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span className="font-mono text-sm text-text-primary">{formatDZD((Number(item.unitBuyPrice) || 0) * (Number(item.quantity) || 0))}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeRow(idx)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-primary">
          <span className="text-lg font-semibold text-text-primary">{t('invoice.total')}:</span>
          <span className="font-mono text-2xl font-extrabold text-text-primary">{formatDZD(total)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
      </div>
      <Toast toasts={toasts} />
    </div>
  )
}
