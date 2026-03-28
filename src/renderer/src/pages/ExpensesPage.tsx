import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { formatDZD, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

const CATEGORIES = ['rent', 'utilities', 'supplies', 'salary', 'maintenance', 'other']

export default function ExpensesPage() {
  const { t } = useTranslation()
  const { toasts, addToast } = useToast()
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ category: 'other', amount: '', description: '', expenseDate: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadExpenses() }, [page])

  const loadExpenses = async () => {
    const res = await window.api.expenses.getAll(page, 20)
    if (res.success) {
      setExpenses(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditingExpense(null)
    setForm({ category: 'other', amount: '', description: '', expenseDate: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  const openEdit = (e: any) => {
    setEditingExpense(e)
    setForm({ category: e.category, amount: String(e.amount), description: e.description || '', expenseDate: e.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { addToast(t('common.required'), 'error'); return }
    const data = { category: form.category, amount: Number(form.amount), description: form.description || undefined, expenseDate: form.expenseDate }
    if (editingExpense) {
      const res = await window.api.expenses.update(editingExpense.id, data)
      if (res.success) { addToast(t('common.success'), 'success'); loadExpenses() }
      else addToast(res.error || t('common.error'), 'error')
    } else {
      const res = await window.api.expenses.create(data)
      if (res.success) { addToast(t('common.success'), 'success'); loadExpenses() }
      else addToast(res.error || t('common.error'), 'error')
    }
    setShowModal(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await window.api.expenses.delete(deleteId)
    if (res.success) { addToast(t('common.success'), 'success'); loadExpenses() }
    else addToast(res.error || t('common.error'), 'error')
    setDeleteId(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('expenses.title')}</h1>
        <Button onClick={openAdd}><Plus size={20} />{t('expenses.addExpense')}</Button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={<Receipt size={32} />} title={t('expenses.noExpenses')} description={t('common.noData')} action={{ label: t('expenses.addExpense'), onClick: openAdd }} />
      ) : (
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('expenses.category')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('expenses.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('expenses.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('expenses.date')}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{t(`expenses.categories.${e.category}` as any) || e.category}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-status-error">{formatDZD(e.amount)}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[200px]">{e.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(e.expenseDate)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteId(e.id)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingExpense ? t('expenses.editExpense') : t('expenses.addExpense')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="label">{t('expenses.category')}</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`expenses.categories.${c}` as any)}</option>)}
            </select>
          </div>
          <Input label={t('expenses.amount') + ' (DZD)'} type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <div>
            <label className="label">{t('expenses.description')}</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[80px]" />
          </div>
          <Input label={t('expenses.date')} type="date" value={form.expenseDate} onChange={e => setForm({...form, expenseDate: e.target.value})} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('expenses.deleteConfirm')} />
      <Toast toasts={toasts} />
    </div>
  )
}
