import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Printer, Receipt, Play, CheckCircle, XCircle, Clock, Pencil, Trash2, DollarSign, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { formatDZD, formatDate, formatDateTime, getInitials, getStatusLabel } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'
import DocumentPreview from '@/components/documents/DocumentPreview'
import Facture from '@/components/documents/Facture'
import BonDeLivraison from '@/components/documents/BonDeLivraison'
import BonDeSortie from '@/components/documents/BonDeSortie'

export default function JobDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  const isWorkerMode = typeof activeView === 'number'
  const isAdminView = user?.role === 'admin' && !isWorkerMode
  const { toasts, addToast } = useToast()
  const [activeDoc, setActiveDoc] = useState<'facture' | 'proforma' | 'livraison' | 'sortie' | null>(null)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => { loadJob() }, [id])

  const effectiveWorkerId = isWorkerMode ? activeView : (user?.role === 'worker' ? user?.userId : null)

  const loadJob = async () => {
    const res = await window.api.jobs.getById(Number(id))
    if (res.success && res.data) {
      // Workers can only view their own jobs
      if (effectiveWorkerId && res.data.workerId !== effectiveWorkerId) {
        navigate('/jobs', { replace: true })
        return
      }
      setJob(res.data)
    }
    setLoading(false)
  }

  const updateStatus = async (status: string) => {
    const res = await window.api.jobs.updateStatus(Number(id), status)
    if (res.success) { addToast(t('jobs.statusUpdated'), 'success'); loadJob() }
    else addToast(res.error || t('common.error'), 'error')
    setConfirmAction(null)
  }

  const handlePayment = async (amount: number) => {
    const res = await window.api.jobs.updatePayment(Number(id), amount)
    if (res.success) { addToast(t('jobs.paymentRecorded'), 'success'); loadJob() }
    else addToast(res.error || t('common.error'), 'error')
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const handlePrintReceipt = async () => {
    const settingsRes = await window.api.settings.getAll()
    const shopName = settingsRes.success ? (settingsRes.data?.shop_name || 'OKBA') : 'OKBA'
    const shopPhone = settingsRes.success ? (settingsRes.data?.shop_phone || '') : ''
    const shopAddress = settingsRes.success ? (settingsRes.data?.shop_address || '') : ''

    const printWindow = window.open('', '_blank', 'width=350,height=600')
    if (!printWindow) return

    const sep = '=============================<br>'
    const dash = '-----------------------------<br>'
    const pad = (label: string, val: string, width = 29) => {
      const space = width - label.length - val.length
      return label + (space > 0 ? '&nbsp;'.repeat(space) : ' ') + val
    }

    let lines = sep
    lines += `<div style="text-align:center"><strong>${esc(shopName)}</strong></div>`
    if (shopPhone) lines += `<div style="text-align:center">${esc(shopPhone)}</div>`
    if (shopAddress) lines += `<div style="text-align:center">${esc(shopAddress)}</div>`
    lines += sep
    lines += `${t('invoice.title')} #${job.id}<br>`
    lines += `${t('jobs.createdAt')}: ${formatDate(job.createdAt)}<br>`
    lines += `${t('jobs.customer')}: ${esc(job.customer?.name || '-')}<br>`
    const moto = [job.motorcycleBrand || job.customer?.motorcycleBrand, job.motorcycleModel || job.customer?.motorcycleModel].filter(Boolean).join(' ')
    if (moto) lines += `${t('jobs.motorcycle')}: ${esc(moto)}<br>`
    const plate = job.plateNumber || job.customer?.plateNumber
    if (plate) lines += `${t('jobs.plateNumber')}: ${esc(plate)}<br>`
    lines += dash
    lines += pad(t('invoice.repairService'), (job.repairFee || 0).toLocaleString()) + '<br>'
    for (const p of (job.parts || [])) {
      lines += pad(`${esc(p.partName)} x${p.quantity}`, (p.sellPrice * p.quantity).toLocaleString()) + '<br>'
    }
    lines += dash
    if (job.discount > 0) {
      const discountAmt = job.discountType === 'percent' ? (job.repairFee + job.partsTotal) * (job.discount / 100) : job.discount
      lines += pad(t('jobs.discount') + ':', '-' + discountAmt.toLocaleString()) + '<br>'
    }
    lines += `<strong>${pad(t('invoice.total') + ':', (job.totalAmount || 0).toLocaleString() + ' DZD')}</strong><br>`
    lines += pad(t('jobs.amountPaid') + ':', (job.amountPaid || 0).toLocaleString() + ' DZD') + '<br>'
    const remaining = Math.max(0, (job.totalAmount || 0) - (job.amountPaid || 0))
    if (remaining > 0) lines += pad(t('jobs.remaining') + ':', remaining.toLocaleString() + ' DZD') + '<br>'
    lines += dash
    lines += `<div style="text-align:center">${t('invoice.thankYou')}</div>`
    lines += sep

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt #${job.id}</title><style>body{font-family:'Courier New',monospace;font-size:12px;width:302px;margin:0 auto;padding:10px;color:#000}@media print{body{margin:0;padding:5px}}</style></head><body>${lines}<script>window.onload=function(){window.print()}<\/script></body></html>`)
    printWindow.document.close()
  }

  const handlePrint = async () => {
    // Fetch shop info for invoice header
    const settingsRes = await window.api.settings.getAll()
    const shopName = settingsRes.success ? (settingsRes.data?.shop_name || 'OKBA') : 'OKBA'
    const shopPhone = settingsRes.success ? (settingsRes.data?.shop_phone || '') : ''
    const shopAddress = settingsRes.success ? (settingsRes.data?.shop_address || '') : ''

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const partsRows = (job.parts || []).map((p: any) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${esc(p.partName)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${p.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${p.sellPrice.toLocaleString()} DZD</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${(p.sellPrice * p.quantity).toLocaleString()} DZD</td></tr>`
    ).join('')

    const discountRow = job.discount > 0 ? `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${t('invoice.discount')}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">-</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">-</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;color:#ef4444">-${(job.discountType === 'percent' ? (job.repairFee + job.partsTotal) * (job.discount / 100) : job.discount).toLocaleString()} DZD</td></tr>` : ''

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice #${job.id}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}h1{margin:0;font-size:28px}table{width:100%;border-collapse:collapse;margin:20px 0}.header{display:flex;justify-content:space-between;margin-bottom:30px}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:20px}@media print{body{margin:20px}}</style></head><body>
      <div class="header"><div><h1>${t('invoice.title')}</h1><p style="color:#666">#${job.id}</p></div><div style="text-align:right"><strong>${esc(shopName)}</strong>${shopPhone ? '<br>' + esc(shopPhone) : ''}${shopAddress ? '<br>' + esc(shopAddress) : ''}</div></div>
      <div style="margin-bottom:20px"><strong>${t('invoice.billTo')}:</strong><br>${esc(job.customer?.name || '-')}<br>${esc(job.customer?.phone || '')}<br>${esc([job.motorcycleBrand || job.customer?.motorcycleBrand, job.motorcycleModel || job.customer?.motorcycleModel].filter(Boolean).join(' '))} ${esc(job.plateNumber || job.customer?.plateNumber || '')}</div>
      <table><thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">${t('invoice.item')}</th><th style="padding:8px;text-align:center">${t('invoice.qty')}</th><th style="padding:8px;text-align:right">${t('invoice.unitPrice')}</th><th style="padding:8px;text-align:right">${t('invoice.total')}</th></tr></thead><tbody>
      <tr><td style="padding:8px;border-bottom:1px solid #ddd">${t('invoice.repairService')}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">1</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${job.repairFee.toLocaleString()} DZD</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${job.repairFee.toLocaleString()} DZD</td></tr>
      ${partsRows}${discountRow}</tbody></table>
      <div class="total">${t('invoice.total')}: ${job.totalAmount.toLocaleString()} DZD</div>
      <p style="text-align:center;margin-top:40px;color:#666">${t('invoice.thankYou')}</p>
      <script>window.onload=function(){window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const handleWhatsAppShare = async () => {
    const settingsRes = await window.api.settings.getAll()
    const shopName = settingsRes.success ? (settingsRes.data?.shop_name || 'OKBA') : 'OKBA'
    let text = `${t('invoice.title')} #${job.id}\n`
    text += `${shopName}\n\n`
    text += `${t('jobs.customer')}: ${job.customer?.name || '-'}\n`
    text += `${t('jobs.description')}: ${job.description || '-'}\n\n`
    if (job.parts?.length) {
      for (const p of job.parts) {
        text += `${p.partName} x${p.quantity}: ${(p.sellPrice * p.quantity).toLocaleString()} DZD\n`
      }
    }
    text += `${t('invoice.repairService')}: ${(job.repairFee || 0).toLocaleString()} DZD\n`
    if (job.discount > 0) {
      const discAmt = job.discountType === 'percent' ? (job.repairFee + job.partsTotal) * (job.discount / 100) : job.discount
      text += `${t('jobs.discount')}: -${discAmt.toLocaleString()} DZD\n`
    }
    text += `\n${t('invoice.total')}: ${(job.totalAmount || 0).toLocaleString()} DZD\n`
    text += `${t('jobs.amountPaid')}: ${(job.amountPaid || 0).toLocaleString()} DZD\n`
    const rem = Math.max(0, (job.totalAmount || 0) - (job.amountPaid || 0))
    if (rem > 0) text += `${t('jobs.remaining')}: ${rem.toLocaleString()} DZD\n`
    text += `\n${t('invoice.thankYou')}`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!job) return <div className="text-text-tertiary text-center py-16">{t('jobs.notFound')}</div>

  const statusVariant = (s: string): 'success' | 'info' | 'pending' | 'error' => {
    switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'pending': return 'pending'; case 'cancelled': return 'error'; default: return 'info' }
  }

  const workerPct = job.totalAmount > 0 ? (job.workerProfit / (job.workerProfit + job.storeRepairProfit + job.storePartsProfit || 1)) * 100 : 0

  return (
    <div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft size={20} /><span>{t('common.back')}</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {job.status === 'pending' && <Button variant="secondary" size="sm" onClick={() => navigate(`/jobs/${id}/edit`)}><Pencil size={16} />{t('jobs.editJob')}</Button>}
            {job.status === 'pending' && <Button variant="secondary" size="sm" onClick={() => setConfirmAction('in_progress')}><Play size={16} />{t('jobs.startJob')}</Button>}
            {job.status === 'in_progress' && <Button size="sm" onClick={() => setConfirmAction('completed')}><CheckCircle size={16} />{t('jobs.completeJob')}</Button>}
            {(job.status === 'pending' || job.status === 'in_progress') && <Button variant="danger" size="sm" onClick={() => setConfirmAction('cancelled')}><XCircle size={16} />{t('jobs.cancelJob')}</Button>}
            {job.status === 'pending' && isAdminView && <Button variant="danger" size="sm" onClick={() => setConfirmAction('delete')}><Trash2 size={16} />{t('jobs.deleteJob')}</Button>}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleWhatsAppShare}><MessageCircle size={16} />{t('jobs.shareWhatsApp')}</Button>
          <Button variant="secondary" size="sm" onClick={() => setActiveDoc('facture')}><Printer size={16} />{t('documents.facture.title')}</Button>
          {job.status === 'pending' && <Button variant="secondary" size="sm" onClick={() => setActiveDoc('proforma')}><Receipt size={16} />{t('documents.factureProforma.title')}</Button>}
          {job.status === 'completed' && <Button variant="secondary" size="sm" onClick={() => setActiveDoc('livraison')}><Receipt size={16} />{t('documents.bonDeLivraison.title')}</Button>}
          {isAdminView && job.parts?.length > 0 && <Button variant="secondary" size="sm" onClick={() => setActiveDoc('sortie')}><Receipt size={16} />{t('documents.bonDeSortie.title')}</Button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">#{job.id}</p>
                <h2 className="text-2xl font-bold text-text-primary">{job.description || t('jobs.title')}</h2>
              </div>
              <Badge variant={statusVariant(job.status)}>{getStatusLabel(job.status)}</Badge>
            </div>
          </Card>

          {/* Customer */}
          {job.customer && (
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">{t('jobs.customer')}</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-text-primary">{getInitials(job.customer.name)}</div>
                <div>
                  <p className="font-medium text-text-primary">{job.customer.name}</p>
                  <p className="text-sm text-text-tertiary">{job.customer.phone} · {[job.motorcycleBrand || job.customer.motorcycleBrand, job.motorcycleModel || job.customer.motorcycleModel].filter(Boolean).join(' ')} · {job.plateNumber || job.customer.plateNumber}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Parts Used */}
          {job.parts && job.parts.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
              <div className="px-6 py-4 border-b border-border-primary">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.partsUsed')}</h3>
              </div>
              <table className="w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.name')}</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.quantity')}</th>
                    {isAdminView && <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.buyPrice')}</th>}
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('parts.sellPrice')}</th>
                    {isAdminView && <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('jobs.profit')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {job.parts.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 text-sm text-text-primary">{p.partName}</td>
                      <td className="px-6 py-4 text-center font-mono text-sm text-text-primary">{p.quantity}</td>
                      {isAdminView && <td className="px-6 py-4 text-right font-mono text-sm text-text-secondary">{formatDZD(p.buyPrice)}</td>}
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-text-primary">{formatDZD(p.sellPrice)}</td>
                      {isAdminView && <td className="px-6 py-4 text-right font-mono text-sm font-bold text-profit-positive">{formatDZD((p.sellPrice - p.buyPrice) * p.quantity)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {job.notes && (
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-2">{t('jobs.notes')}</h3>
              <p className="text-text-secondary">{job.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-bg-secondary rounded-xl p-6 border-2 border-profit-positive/30">
            <p className="text-sm text-text-tertiary mb-1">{t('jobs.totalAmount')}</p>
            <p className="font-mono text-3xl font-extrabold text-profit-positive">{formatDZD(job.totalAmount)}</p>
          </div>

          {/* Profit Breakdown */}
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">{isAdminView ? t('jobs.profitBreakdown') : t('jobs.workerProfit')}</h3>
            {isAdminView && (
              <div className="flex h-4 rounded-full overflow-hidden bg-bg-tertiary mb-4">
                <div className="bg-money-worker" style={{ width: `${workerPct}%` }} />
                <div className="bg-money-store" style={{ width: `${100 - workerPct}%` }} />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-money-worker" /><span className="text-sm text-text-tertiary">{t('jobs.workerProfit')}</span></div>
                <span className="font-mono font-bold text-money-worker">{formatDZD(job.workerProfit)}</span>
              </div>
              {isAdminView && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-money-store" /><span className="text-sm text-text-tertiary">{t('jobs.storeProfit')} ({t('jobs.repairFee')})</span></div>
                    <span className="font-mono font-bold text-money-store">{formatDZD(job.storeRepairProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-money-store" /><span className="text-sm text-text-tertiary">{t('jobs.storeProfit')} ({t('jobs.partsTotal')})</span></div>
                    <span className="font-mono font-bold text-money-store">{formatDZD(job.storePartsProfit)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-border-primary pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-text-primary">{t('jobs.repairFee')}</span>
                <span className="font-mono font-bold text-text-primary">{formatDZD(job.repairFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">{t('jobs.workerMarkup')}</span>
                <span className="font-mono text-text-secondary">{job.workerMarkup}%</span>
              </div>
              {(job.discount > 0) && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">{t('jobs.discount')}</span>
                  <span className="font-mono text-status-error">-{formatDZD(job.discountType === 'percent' ? (job.repairFee + job.partsTotal) * (job.discount / 100) : job.discount)} {job.discountType === 'percent' ? `(${job.discount}%)` : ''}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Status */}
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">{t('jobs.paymentStatus')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">{t('jobs.paymentStatus')}</span>
                <Badge variant={job.paymentStatus === 'paid' ? 'success' : job.paymentStatus === 'partial' ? 'warning' : 'error'}>
                  {job.paymentStatus === 'paid' ? t('jobs.paid') : job.paymentStatus === 'partial' ? t('jobs.partial') : t('jobs.unpaid')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">{t('jobs.amountPaid')}</span>
                <span className="font-mono font-bold text-text-primary">{formatDZD(job.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">{t('jobs.remaining')}</span>
                <span className="font-mono font-bold text-status-error">{formatDZD(Math.max(0, job.totalAmount - (job.amountPaid || 0)))}</span>
              </div>
              {job.paymentStatus !== 'paid' && isAdminView && (
                <div className="pt-3 border-t border-border-primary flex gap-2">
                  <Button size="sm" onClick={() => handlePayment(job.totalAmount)}>{t('jobs.markPaid')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setPaymentAmount(''); setShowPaymentModal(true) }}>{t('jobs.recordPayment')}</Button>
                </div>
              )}
            </div>
          </Card>

          {/* Worker */}
          {job.worker && (
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">{t('jobs.worker')}</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-money-worker/20 flex items-center justify-center text-money-worker font-bold text-sm">{getInitials(job.worker.displayName)}</div>
                <div>
                  <p className="font-medium text-text-primary">{job.worker.displayName}</p>
                  <p className="text-xs text-text-tertiary">@{job.worker.username}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">{t('jobs.timeline')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><Clock size={16} className="text-text-disabled" /><div><p className="text-xs text-text-tertiary">{t('jobs.createdAt')}</p><p className="text-sm text-text-primary">{formatDateTime(job.createdAt)}</p></div></div>
              {job.startedAt && <div className="flex items-center gap-3"><Play size={16} className="text-status-info" /><div><p className="text-xs text-text-tertiary">{t('jobs.startedAt')}</p><p className="text-sm text-text-primary">{formatDateTime(job.startedAt)}</p></div></div>}
              {job.completedAt && <div className="flex items-center gap-3"><CheckCircle size={16} className="text-status-success" /><div><p className="text-xs text-text-tertiary">{t('jobs.completedAt')}</p><p className="text-sm text-text-primary">{formatDateTime(job.completedAt)}</p></div></div>}
            </div>
          </Card>

          {/* Warranty */}
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">{t('jobs.warranty')}</h3>
            {job.warrantyMonths > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">{t('jobs.warrantyMonths')}</span>
                  <span className="font-mono text-text-primary">{job.warrantyMonths}</span>
                </div>
                {job.warrantyExpiresAt && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-tertiary">{t('jobs.warrantyExpiresAt')}</span>
                      <span className="text-sm text-text-primary">{formatDate(job.warrantyExpiresAt)}</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant={new Date(job.warrantyExpiresAt) > new Date() ? 'success' : 'error'}>
                        <Shield size={12} className="mr-1" />
                        {new Date(job.warrantyExpiresAt) > new Date() ? t('jobs.warrantyActive') : t('jobs.warrantyExpired')}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">{t('jobs.noWarranty')}</p>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={t('jobs.recordPayment')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => {
              const amount = Number(paymentAmount)
              if (amount > 0) {
                handlePayment(amount + (job.amountPaid || 0))
                setShowPaymentModal(false)
              }
            }}>{t('common.confirm')}</Button>
          </>
        }
      >
        <Input
          label={t('jobs.amountPaid')}
          type="number"
          value={paymentAmount}
          onChange={e => setPaymentAmount(e.target.value)}
          min="0"
          autoFocus
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (confirmAction === 'delete') {
            const res = await window.api.jobs.delete(Number(id))
            if (res.success) {
              addToast(t('jobs.jobDeleted'), 'success')
              setTimeout(() => navigate('/jobs'), 500)
            } else {
              addToast(res.error || t('common.error'), 'error')
            }
            setConfirmAction(null)
          } else if (confirmAction) {
            updateStatus(confirmAction)
          }
        }}
        title={t('common.confirm')}
        message={confirmAction === 'delete' ? t('jobs.confirmDelete') : confirmAction === 'in_progress' ? t('jobs.confirmStart') : confirmAction === 'completed' ? t('jobs.confirmComplete') : t('jobs.confirmCancel')}
        variant={confirmAction === 'cancelled' || confirmAction === 'delete' ? 'danger' : 'primary'}
      />
      <Toast toasts={toasts} />

      {activeDoc && job && (
        <DocumentPreview title={t(`documents.${activeDoc === 'facture' ? 'facture' : activeDoc === 'proforma' ? 'factureProforma' : activeDoc === 'livraison' ? 'bonDeLivraison' : 'bonDeSortie'}`)} onClose={() => setActiveDoc(null)}>
            {(activeDoc === 'facture' || activeDoc === 'proforma') && (
              <Facture
                isProforma={activeDoc === 'proforma'}
                invoiceNumber={`FAC-${job.id}`}
                date={job.createdAt}
                customer={{ name: job.customer?.name || '-', phone: job.customer?.phone }}
                motorcycle={{ brand: job.motorcycleBrand, model: job.motorcycleModel, plate: job.plateNumber }}
                items={[
                  ...(job.repairFee > 0 ? [{ description: t('invoice.repairService'), qty: 1, unitPrice: job.repairFee, total: job.repairFee }] : []),
                  ...(job.parts || []).map((p: any) => ({ description: p.partName, qty: p.quantity, unitPrice: p.sellPrice, total: p.sellPrice * p.quantity }))
                ]}
                subtotal={job.repairFee + (job.partsTotal || 0)}
                discount={job.discount > 0 ? (job.discountType === 'percent' ? (job.repairFee + job.partsTotal) * (job.discount / 100) : job.discount) : 0}
                total={job.totalAmount}
                amountPaid={job.amountPaid}
                remaining={Math.max(0, job.totalAmount - job.amountPaid)}
                paymentStatus={job.paymentStatus}
                warranty={job.warrantyMonths > 0 ? { months: job.warrantyMonths, expiresAt: job.warrantyExpiresAt } : undefined}
              />
            )}
            {activeDoc === 'livraison' && (
              <BonDeLivraison
                number={`BL-${job.id}`}
                date={job.completedAt || job.createdAt}
                customer={{ name: job.customer?.name || '-', phone: job.customer?.phone }}
                jobReference={`#${job.id}`}
                items={(job.parts || []).map((p: any) => ({ description: p.partName, qty: p.quantity }))}
              />
            )}
            {activeDoc === 'sortie' && (
              <BonDeSortie
                number={`BS-${job.id}`}
                date={job.createdAt}
                jobReference={`#${job.id}`}
                worker={job.worker?.displayName || '-'}
                items={(job.parts || []).map((p: any) => ({ partName: p.partName, qty: p.quantity }))}
              />
            )}
        </DocumentPreview>
      )}
    </div>
  )
}
