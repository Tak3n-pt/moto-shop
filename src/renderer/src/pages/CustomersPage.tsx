import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

export default function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toasts, addToast } = useToast()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', motorcycleBrand: '', motorcycleModel: '', plateNumber: '', notes: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { loadCustomers() }, [search, page])

  const loadCustomers = async () => {
    const res = await window.api.customers.getAll(search || undefined, page, 20)
    if (res.success) {
      setCustomers(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditingCustomer(null)
    setForm({ name: '', phone: '', motorcycleBrand: '', motorcycleModel: '', plateNumber: '', notes: '' })
    setShowModal(true)
  }

  const openEdit = (c: any) => {
    setEditingCustomer(c)
    setForm({ name: c.name, phone: c.phone || '', motorcycleBrand: c.motorcycleBrand || '', motorcycleModel: c.motorcycleModel || '', plateNumber: c.plateNumber || '', notes: c.notes || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editingCustomer) {
      const res = await window.api.customers.update(editingCustomer.id, form)
      if (res.success) { addToast(t('common.success'), 'success'); loadCustomers() }
      else addToast(res.error || t('common.error'), 'error')
    } else {
      const res = await window.api.customers.create(form)
      if (res.success) { addToast(t('common.success'), 'success'); loadCustomers() }
      else addToast(res.error || t('common.error'), 'error')
    }
    setShowModal(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await window.api.customers.delete(deleteId)
    if (res.success) { addToast(t('common.success'), 'success'); loadCustomers() }
    else addToast(res.error || t('common.error'), 'error')
    setDeleteId(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('customers.title')}</h1>
        <Button onClick={openAdd}><Plus size={20} />{t('customers.addCustomer')}</Button>
      </div>

      <div className="mb-6 max-w-md">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t('customers.search')} />
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title={t('customers.noCustomers')} description={t('common.noData')} action={{ label: t('customers.addCustomer'), onClick: openAdd }} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('customers.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('customers.phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('customers.motorcycle')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('customers.plateNumber')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">{getInitials(c.name)}</div>
                      <span className="text-sm font-medium text-text-primary">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{[c.motorcycleBrand, c.motorcycleModel].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-text-secondary">{c.plateNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/customers/${c.id}`)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-shop-steel-500 transition-colors"><Eye size={16} /></button>
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-text-tertiary">{t('common.page')} {page} {t('common.of')} {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.previous')}</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors">{t('common.next')}</button>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCustomer ? t('customers.editCustomer') : t('customers.addCustomer')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>
      }>
        <div className="space-y-4">
          <Input label={t('customers.name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label={t('customers.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('customers.brand')} value={form.motorcycleBrand} onChange={e => setForm({...form, motorcycleBrand: e.target.value})} />
            <Input label={t('customers.model')} value={form.motorcycleModel} onChange={e => setForm({...form, motorcycleModel: e.target.value})} />
          </div>
          <Input label={t('customers.plateNumber')} value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value})} />
          <div>
            <label className="label">{t('customers.notes')}</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input min-h-[80px]" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('customers.deleteConfirm')} />
      <Toast toasts={toasts} />
    </div>
  )
}
