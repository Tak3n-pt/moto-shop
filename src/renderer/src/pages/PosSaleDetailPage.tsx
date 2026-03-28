import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Printer, ArrowLeft, ShoppingCart, DollarSign, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { formatDZD, formatDateTime } from '@/lib/utils'
import DocumentPreview from '@/components/documents/DocumentPreview'
import Facture from '@/components/documents/Facture'

export default function PosSaleDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [sale, setSale] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => {
    if (id) loadSale(Number(id))
  }, [id])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('print') === 'true' && sale) {
      window.requestAnimationFrame(() => {
        window.api.print()
        params.delete('print')
        navigate({ pathname: location.pathname }, { replace: true })
      })
    }
  }, [location.search, sale])

  const loadSale = async (saleId: number) => {
    setLoading(true)
    const res = await window.api.pos.getById(saleId)
    if (res.success) setSale(res.data || null)
    setLoading(false)
  }

  const handlePrint = () => window.api.print()

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0 || !sale) return
    setPaying(true)
    const res = await window.api.pos.updatePayment(sale.id, amount)
    setPaying(false)
    if (res.success) {
      setShowPayment(false)
      setPaymentAmount('')
      loadSale(sale.id)
    }
  }

  const handleMarkPaid = async () => {
    if (!sale) return
    const remaining = sale.amountDue || 0
    if (remaining <= 0) return
    setPaying(true)
    const res = await window.api.pos.updatePayment(sale.id, remaining)
    setPaying(false)
    if (res.success) loadSale(sale.id)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  if (!sale) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} />{t('common.back')}</Button>
        <div className="text-center text-text-tertiary py-20">
          {t('common.noData')}
        </div>
      </div>
    )
  }

  const subtotal = sale.subtotal || 0
  const discount = sale.discount || 0
  const total = sale.total || 0
  const cash = sale.cashReceived || 0
  const change = sale.changeDue || 0
  const due = sale.amountDue || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} />{t('common.back')}</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/pos')}><ShoppingCart size={16} />{t('nav.pos')}</Button>
          <Button variant="secondary" onClick={() => setShowInvoice(true)}><FileText size={16} />{t('documents.facture.title')}</Button>
          <Button onClick={handlePrint}><Printer size={16} />{t('pos.printReceipt')}</Button>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{t('pos.receiptTitle')} #{sale.id}</h1>
            <p className="text-sm text-text-tertiary">{formatDateTime(sale.createdAt)}</p>
          </div>
          <div className="text-right text-sm text-text-tertiary">
            <p>{t('pos.cashier')}: <span className="text-text-primary font-medium">{sale.cashierName}</span></p>
            <p>{t('pos.customerName')}: <span className="text-text-primary font-medium">{sale.customerName || t('common.noData')}</span></p>
            {sale.customerPhone && <p>{t('pos.customerPhone')}: <span className="text-text-primary font-medium">{sale.customerPhone}</span></p>}
          </div>
        </div>

        <div className="overflow-x-auto border border-border-primary rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.quantity')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.price')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('pos.lineTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {sale.items?.map((item: any) => (
                <tr key={`${item.saleId}-${item.partId}`}>
                  <td className="px-4 py-3 text-text-primary">{item.partName}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatDZD(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatDZD(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm text-text-tertiary">
            <p>{t('pos.notes')}: <span className="text-text-primary">{sale.notes || '-'}</span></p>
          </div>
          <div className="space-y-1 bg-bg-tertiary rounded-xl p-4">
            <div className="flex justify-between"><span>{t('invoice.subtotal')}</span><span className="font-mono">{formatDZD(subtotal)}</span></div>
            <div className="flex justify-between"><span>{t('pos.discount')}</span><span className="font-mono">-{formatDZD(discount)}</span></div>
            <div className="flex justify-between font-semibold text-text-primary text-base"><span>{t('pos.totalRevenue')}</span><span className="font-mono">{formatDZD(total)}</span></div>
            <div className="flex justify-between"><span>{t('pos.cashReceived')}</span><span className="font-mono">{formatDZD(cash)}</span></div>
            <div className="flex justify-between"><span>{t('pos.changeDue')}</span><span className="font-mono">{formatDZD(change)}</span></div>
            {due > 0 && <div className="flex justify-between text-status-warning font-semibold"><span>{t('pos.totalDue')}</span><span className="font-mono">{formatDZD(due)}</span></div>}
            {due > 0 && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleMarkPaid} disabled={paying}>{t('jobs.markPaid') || 'Mark Paid'}</Button>
                <Button size="sm" variant="secondary" onClick={() => { setShowPayment(true); setPaymentAmount('') }}><DollarSign size={14} />{t('jobs.recordPayment') || 'Record Payment'}</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoice && sale && (
        <DocumentPreview title={t('documents.facture.title')} onClose={() => setShowInvoice(false)}>
          <Facture
            invoiceNumber={`POS-${sale.id}`}
            date={sale.createdAt}
            customer={{ name: sale.customerName || t('common.noData'), phone: sale.customerPhone }}
            items={(sale.items || []).map((i: any) => ({ description: i.partName, qty: i.quantity, unitPrice: i.unitPrice, total: i.lineTotal }))}
            subtotal={sale.subtotal || 0}
            discount={sale.discount || 0}
            total={sale.total || 0}
            amountPaid={sale.cashReceived || 0}
            remaining={sale.amountDue || 0}
            paymentStatus={sale.amountDue > 0 ? 'partial' : 'paid'}
          />
        </DocumentPreview>
      )}

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title={t('jobs.recordPayment') || 'Record Payment'} size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setShowPayment(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleRecordPayment} disabled={paying}>{paying ? t('common.loading') : t('common.confirm')}</Button>
        </>
      }>
        <div className="space-y-3">
          <p className="text-sm text-text-tertiary">{t('pos.totalDue')}: <span className="font-semibold text-status-warning">{formatDZD(due)}</span></p>
          <Input label={t('pos.cashReceived')} type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="0" max={String(due)} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleRecordPayment() }} />
        </div>
      </Modal>
    </div>
  )
}
