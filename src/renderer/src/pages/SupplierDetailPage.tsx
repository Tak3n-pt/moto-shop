import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Plus, Minus, Wallet, ShoppingCart } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import StatCard from '@/components/ui/StatCard'
import Toast from '@/components/ui/Toast'
import { formatDZD, formatDate, formatDateTime, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

export default function SupplierDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, addToast } = useToast()
  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [showLedgerModal, setShowLedgerModal] = useState<'debt' | 'payment' | null>(null)
  const [ledgerAmount, setLedgerAmount] = useState('')
  const [ledgerDesc, setLedgerDesc] = useState('')
  const [ledgerSaving, setLedgerSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const res = await window.api.suppliers.getById(Number(id))
    if (res.success) setSupplier(res.data)
    setLoading(false)
  }

  const openEdit = () => {
    if (!supplier) return
    setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '', notes: supplier.notes || '' })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const res = await window.api.suppliers.update(Number(id), form)
    if (res.success) {
      addToast(t('common.success'), 'success')
      loadData()
      setShowEditModal(false)
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleLedgerSubmit = async () => {
    const amount = Number(ledgerAmount)
    if (!amount || amount <= 0) return
    setLedgerSaving(true)
    const res = showLedgerModal === 'debt'
      ? await window.api.suppliers.addDebt(Number(id), amount, ledgerDesc || undefined)
      : await window.api.suppliers.addPayment(Number(id), amount, ledgerDesc || undefined)
    setLedgerSaving(false)
    if (res.success) {
      addToast(t('common.success'), 'success')
      setShowLedgerModal(null)
      setLedgerAmount('')
      setLedgerDesc('')
      loadData()
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!supplier) return <div className="text-text-tertiary text-center py-16">{t('common.noData')}</div>

  const purchases: any[] = supplier.purchases || []

  return (
    <div>
      <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft size={20} /><span>{t('common.back')}</span>
      </button>

      <Card className="mb-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center text-xl font-bold text-text-primary">
            {getInitials(supplier.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-text-primary">{supplier.name}</h1>
              <Button variant="secondary" onClick={openEdit}><Pencil size={16} />{t('common.edit')}</Button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {supplier.phone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone size={16} className="text-text-tertiary" />{supplier.phone}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail size={16} className="text-text-tertiary" />{supplier.email}
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin size={16} className="text-text-tertiary" />{supplier.address}
                </div>
              )}
            </div>
            {supplier.notes && <p className="mt-4 text-sm text-text-tertiary">{supplier.notes}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Wallet size={22} />}
          iconColor={supplier.balance > 0 ? 'bg-status-error/10 text-status-error' : 'bg-status-success/10 text-status-success'}
          label={t('suppliers.currentDebt') || 'Current Debt'}
          value={formatDZD(supplier.balance ?? 0)}
        />
        <StatCard
          icon={<ShoppingCart size={22} />}
          iconColor="bg-shop-steel-500/10 text-shop-steel-500"
          label={t('suppliers.totalPurchased')}
          value={formatDZD(supplier.totalPurchased ?? 0)}
        />
        <StatCard
          icon={<ShoppingCart size={22} />}
          iconColor="bg-accent-primary/10 text-accent-primary"
          label={t('suppliers.purchaseCount')}
          value={String(purchases.length)}
        />
      </div>

      <div className="flex gap-2 mb-8">
        <Button variant="danger" size="sm" onClick={() => { setShowLedgerModal('debt'); setLedgerAmount(''); setLedgerDesc('') }}>
          <Plus size={16} />{t('suppliers.addDebt') || 'Add Debt'}
        </Button>
        <Button size="sm" onClick={() => { setShowLedgerModal('payment'); setLedgerAmount(''); setLedgerDesc('') }}>
          <Minus size={16} />{t('suppliers.recordPayment') || 'Record Payment'}
        </Button>
      </div>

      {/* Ledger History */}
      {supplier.ledger?.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-text-primary mb-4">{t('suppliers.debtHistory') || 'Debt History'}</h2>
          <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.date') || 'Date'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.type') || 'Type'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.description') || 'Description'}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.amount') || 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {supplier.ledger.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 text-sm text-text-tertiary">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={entry.type === 'debt' ? 'error' : 'success'}>
                        {entry.type === 'debt' ? (t('suppliers.debt') || 'Debt') : (t('suppliers.payment') || 'Payment')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{entry.description || '-'}</td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${entry.type === 'debt' ? 'text-status-error' : 'text-status-success'}`}>
                      {entry.type === 'debt' ? '+' : '-'}{formatDZD(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg-tertiary">
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-text-primary">{t('suppliers.currentBalance') || 'Current Balance'}</td>
                  <td className={`px-6 py-3 text-right font-mono font-bold ${supplier.balance > 0 ? 'text-status-error' : 'text-status-success'}`}>{formatDZD(supplier.balance ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <h2 className="text-xl font-semibold text-text-primary mb-4">{t('suppliers.purchaseHistory')}</h2>
      <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.date')}</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('suppliers.totalAmount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-bg-hover transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-text-primary">#{p.id}</td>
                <td className="px-6 py-4 text-sm text-text-tertiary">{formatDate(p.purchasedAt)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-text-primary">{formatDZD(p.totalAmount ?? 0)}</td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-text-tertiary">{t('suppliers.noPurchases')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={t('suppliers.editSupplier')} size="md" footer={
        <><Button variant="secondary" onClick={() => setShowEditModal(false)}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>
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

      {/* Ledger Modal */}
      <Modal isOpen={!!showLedgerModal} onClose={() => setShowLedgerModal(null)} title={showLedgerModal === 'debt' ? (t('suppliers.addDebt') || 'Add Debt') : (t('suppliers.recordPayment') || 'Record Payment')} size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setShowLedgerModal(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleLedgerSubmit} disabled={ledgerSaving}>{ledgerSaving ? t('common.loading') : t('common.confirm')}</Button>
        </>
      }>
        <div className="space-y-4">
          <Input
            label={t('suppliers.amount') || 'Amount (DZD)'}
            type="number"
            value={ledgerAmount}
            onChange={e => setLedgerAmount(e.target.value)}
            min="0"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleLedgerSubmit() }}
          />
          <Input
            label={t('suppliers.description') || 'Description (optional)'}
            value={ledgerDesc}
            onChange={e => setLedgerDesc(e.target.value)}
            placeholder={showLedgerModal === 'debt' ? (t('suppliers.debtPlaceholder') || 'e.g. Parts delivery March') : (t('suppliers.paymentPlaceholder') || 'e.g. Cash payment')}
          />
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </div>
  )
}
