import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, ShoppingCart, ClipboardList, Pencil, Trash2, Package, AlertTriangle, X, ScanBarcode, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import BarcodeModal from '@/components/ui/BarcodeModal'
import { formatDZD, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'
import DocumentPreview from '@/components/documents/DocumentPreview'
import PartsCatalog from '@/components/documents/PartsCatalog'

export default function PartsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toasts, addToast } = useToast()
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [showLowStockOnly, setShowLowStockOnly] = useState(searchParams.get('lowStock') === 'true')
  const [showModal, setShowModal] = useState(false)
  const [editingPart, setEditingPart] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', category: '', buyPrice: '', sellPrice: '', quantity: '', minStock: '5', barcode: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [showBarcode, setShowBarcode] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogParts, setCatalogParts] = useState<any[]>([])

  useEffect(() => {
    window.api.parts.getCategories().then(res => {
      if (res.success) setCategories(res.data || [])
    })
    window.api.parts.getLowStockCount().then(res => {
      if (res.success) setLowStockCount(res.data || 0)
    })
  }, [])

  useEffect(() => { loadParts() }, [search, category, page, showLowStockOnly])

  const loadParts = async () => {
    setLoading(true)
    if (showLowStockOnly) {
      const res = await window.api.parts.getLowStock()
      if (res.success) {
        setParts(res.data || [])
        setTotalPages(1)
      }
    } else {
      const res = await window.api.parts.getAll(search || undefined, category || undefined, page, 20)
      if (res.success) {
        setParts(res.data?.data || [])
        setTotalPages(res.data?.totalPages || 1)
      }
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditingPart(null)
    setForm({ name: '', category: '', buyPrice: '', sellPrice: '', quantity: '', minStock: '5', barcode: '' })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditingPart(p)
    setForm({ name: p.name, category: p.category || '', buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), quantity: String(p.quantity), minStock: String(p.minStock), barcode: p.barcode || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = { name: form.name, category: form.category || undefined, buyPrice: Number(form.buyPrice) || 0, sellPrice: Number(form.sellPrice) || 0, quantity: Number(form.quantity) || 0, minStock: Number(form.minStock) || 5, barcode: form.barcode || undefined }
    const refreshLowStock = () => window.api.parts.getLowStockCount().then(r => { if (r.success) setLowStockCount(r.data || 0) })
    if (editingPart) {
      const res = await window.api.parts.update(editingPart.id, data)
      if (res.success) { addToast(t('common.success'), 'success'); loadParts(); refreshLowStock(); setShowModal(false) }
      else addToast(res.error || t('common.error'), 'error')
    } else {
      const res = await window.api.parts.create(data)
      if (res.success) { addToast(t('common.success'), 'success'); loadParts(); refreshLowStock(); setShowModal(false) }
      else addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await window.api.parts.delete(deleteId)
    if (res.success) {
      addToast(t('common.success'), 'success')
      loadParts()
      window.api.parts.getLowStockCount().then(r => { if (r.success) setLowStockCount(r.data || 0) })
    } else addToast(res.error || t('common.error'), 'error')
    setDeleteId(null)
  }

  const handlePrintCatalog = async () => {
    const res = await window.api.reports.inventory()
    if (res.success && res.data) {
      setCatalogParts(res.data.parts || [])
      setShowCatalog(true)
    }
  }

  const getStockStatus = (p: any) => {
    if (p.quantity === 0) return { variant: 'error' as const, label: t('parts.outOfStock') }
    if (p.quantity <= p.minStock) return { variant: 'warning' as const, label: t('parts.lowStock') }
    return { variant: 'success' as const, label: t('parts.inStock') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-text-primary">{t('parts.title')}</h1>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-status-warning/10 text-status-warning border border-status-warning/30">
              <AlertTriangle size={14} /> {lowStockCount} {t('parts.lowStock')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handlePrintCatalog}><FileText size={20} />{t('documents.partsCatalog.title')}</Button>
          <Button variant="secondary" onClick={() => setShowBarcode(true)}><ScanBarcode size={20} />{t('barcode.lookup')}</Button>
          <Button variant="secondary" onClick={() => navigate('/parts/purchases')}><ClipboardList size={20} />{t('parts.purchaseHistory')}</Button>
          <Button variant="secondary" onClick={() => navigate('/parts/purchase')}><ShoppingCart size={20} />{t('parts.bulkPurchase')}</Button>
          <Button onClick={openAdd}><Plus size={20} />{t('parts.addPart')}</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="max-w-md flex-1">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t('parts.search')} />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} className="input max-w-[200px]">
          <option value="">{t('parts.allCategories')}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {showLowStockOnly && (
          <button onClick={() => setShowLowStockOnly(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 transition-colors">
            {t('parts.lowStock')} <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : parts.length === 0 ? (
        <EmptyState icon={<Package size={32} />} title={t('parts.noParts')} description={t('common.noData')} action={{ label: t('parts.addPart'), onClick: openAdd }} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.stock')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.status')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.buyPrice')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.sellPrice')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {parts.map(p => {
                const stock = getStockStatus(p)
                const stockPct = Math.min(100, p.minStock > 0 ? (p.quantity / (p.minStock * 3)) * 100 : 100)
                return (
                  <tr key={p.id} className={cn('hover:bg-bg-hover transition-colors', p.quantity <= p.minStock && 'bg-status-warning/5')}>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.category || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', stock.variant === 'success' ? 'bg-status-success' : stock.variant === 'warning' ? 'bg-status-warning' : 'bg-status-error')} style={{ width: `${stockPct}%` }} />
                        </div>
                        <span className="font-mono text-sm text-text-primary">{p.quantity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={stock.variant}>{stock.label}</Badge></td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(p.buyPrice)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold text-text-primary">{formatDZD(p.sellPrice)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !showLowStockOnly && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-text-tertiary">{t('common.page')} {page} {t('common.of')} {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.previous')}</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.next')}</button>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPart ? t('parts.editPart') : t('parts.addPart')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>
      }>
        <div className="space-y-4">
          <Input label={t('parts.name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label={t('parts.category')} value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('parts.buyPrice') + ' (DZD)'} type="number" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} />
            <Input label={t('parts.sellPrice') + ' (DZD)'} type="number" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('parts.quantity')} type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <Input label={t('parts.minStock')} type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
          </div>
          <Input label={t('parts.barcode')} value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('parts.deleteConfirm')} />
      <BarcodeModal isOpen={showBarcode} onClose={() => setShowBarcode(false)} />
      <Toast toasts={toasts} />

      {showCatalog && (
        <DocumentPreview title={t('documents.partsCatalog.title')} onClose={() => setShowCatalog(false)}>
          <PartsCatalog
            parts={catalogParts.map((p: any) => ({ name: p.name, category: p.category, sellPrice: p.sellPrice, quantity: p.quantity }))}
            generatedAt={new Date().toISOString()}
          />
        </DocumentPreview>
      )}
    </div>
  )
}
