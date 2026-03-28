import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Eye, Pencil, Trash2, Truck } from 'lucide-react'
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

export default function SuppliersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toasts, addToast } = useToast()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { loadSuppliers() }, [search])

  const loadSuppliers = async () => {
    setLoading(true)
    const res = await window.api.suppliers.getAll(search || undefined)
    if (res.success) setSuppliers(res.data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditingSupplier(null)
    setForm({ name: '', phone: '', email: '', address: '', notes: '' })
    setShowModal(true)
  }

  const openEdit = (s: any) => {
    setEditingSupplier(s)
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editingSupplier) {
      const res = await window.api.suppliers.update(editingSupplier.id, form)
      if (res.success) { addToast(t('common.success'), 'success'); loadSuppliers(); setShowModal(false) }
      else addToast(res.error || t('common.error'), 'error')
    } else {
      const res = await window.api.suppliers.create(form)
      if (res.success) { addToast(t('common.success'), 'success'); loadSuppliers(); setShowModal(false) }
      else addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await window.api.suppliers.delete(deleteId)
    if (res.success) { addToast(t('common.success'), 'success'); loadSuppliers() }
    else addToast(res.error || t('common.error'), 'error')
    setDeleteId(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('suppliers.title')}</h1>
        <Button onClick={openAdd}><Plus size={20} />{t('suppliers.addSupplier')}</Button>
      </div>

      <div className="mb-6 max-w-md">
        <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder={t('suppliers.search')} />
      </div>

      {suppliers.length === 0 ? (
        <EmptyState icon={<Truck size={32} />} title={t('suppliers.noSuppliers')} description={t('common.noData')} action={{ label: t('suppliers.addSupplier'), onClick: openAdd }} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.email')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.purchaseCount')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {suppliers.map(s => (
                <tr key={s.id} onClick={() => navigate(`/suppliers/${s.id}`)} className="hover:bg-bg-hover cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">{getInitials(s.name)}</div>
                      <span className="text-sm font-medium text-text-primary">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{s.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{s.email || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-text-primary">{s.purchaseCount ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate(`/suppliers/${s.id}`)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-shop-steel-500 transition-colors"><Eye size={16} /></button>
                      <button onClick={() => openEdit(s)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSupplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>
      }>
        <div className="space-y-4">
          <Input label={t('suppliers.name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label={t('suppliers.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Input label={t('suppliers.email')} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Input label={t('suppliers.address')} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div>
            <label className="label">{t('suppliers.notes')}</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input min-h-[80px]" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('suppliers.deleteConfirm')} />
      <Toast toasts={toasts} />
    </div>
  )
}
