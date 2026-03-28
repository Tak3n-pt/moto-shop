import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { ArrowLeft, Plus, Trash2, Search, X, FileText, Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { formatDZD, calculateProfit, getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useApi'

const emptyCustomerForm = {
  name: '',
  phone: '',
  motorcycleBrand: '',
  motorcycleModel: '',
  plateNumber: '',
  notes: ''
}

interface PartRow {
  partId: number | null
  partName: string
  quantity: string
  buyPrice: number
  sellPrice: number
  stock: number
  searchResults: any[]
}

export default function NewJobPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const { toasts, addToast } = useToast()
  const isWorkerMode = typeof activeView === 'number'
  const isAdminView = user?.role === 'admin' && !isWorkerMode

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(isWorkerMode ? activeView as number : (user?.userId || 0))
  const [description, setDescription] = useState('')
  const [repairFee, setRepairFee] = useState('')
  const [workerMarkup, setWorkerMarkup] = useState('30')
  const [notes, setNotes] = useState('')
  const [parts, setParts] = useState<PartRow[]>([])
  const [saving, setSaving] = useState(false)
  const [motorcycleBrand, setMotorcycleBrand] = useState('')
  const [motorcycleModel, setMotorcycleModel] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [warrantyMonths, setWarrantyMonths] = useState('0')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ ...emptyCustomerForm })
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  useEffect(() => {
    window.api.settings.getAllUsers().then(res => {
      if (res.success) {
        const w = (res.data || []).filter((u: any) => u.role === 'worker' && u.isActive)
        setWorkers(w)
      }
    })
    if (!isEditMode) {
      window.api.settings.getAll().then(res => {
        if (res.success && res.data?.default_worker_markup != null && res.data.default_worker_markup !== '') {
          setWorkerMarkup(res.data.default_worker_markup)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (id) {
      window.api.jobs.getById(Number(id)).then(async res => {
        if (res.success && res.data) {
          const job = res.data
          // Workers can only edit their own jobs
          const ewId = typeof activeView === 'number' ? activeView : (user?.role === 'worker' ? user?.userId : null)
          if (ewId && job.workerId !== ewId) {
            navigate('/jobs', { replace: true })
            return
          }
          setSelectedCustomer(job.customer)
          setSelectedWorkerId(job.workerId)
          setDescription(job.description || '')
          setRepairFee(String(job.repairFee))
          setWorkerMarkup(String(job.workerMarkup))
          setNotes(job.notes || '')
          setMotorcycleBrand(job.motorcycleBrand || '')
          setMotorcycleModel(job.motorcycleModel || '')
          setPlateNumber(job.plateNumber || '')
          setDiscount(String(job.discount || 0))
          setDiscountType(job.discountType || 'fixed')
          setWarrantyMonths(String(job.warrantyMonths || 0))
          // Fetch current stock for each part (add back the job's own quantity since it will be restored on save)
          const partsWithStock = await Promise.all((job.parts || []).map(async (p: any) => {
            const partRes = await window.api.parts.getById(p.partId)
            const currentStock = partRes.success && partRes.data ? partRes.data.quantity : 0
            return {
              partId: p.partId,
              partName: p.partName,
              quantity: String(p.quantity),
              buyPrice: p.buyPrice,
              sellPrice: p.sellPrice,
              stock: currentStock + p.quantity,
              searchResults: []
            }
          }))
          setParts(partsWithStock)
        }
      })
    }
  }, [id])

  const searchCustomers = async (query: string) => {
    setCustomerSearch(query)
    if (query.length >= 2) {
      const res = await window.api.customers.getAll(query, 1, 20)
      setCustomerResults(res.success ? (res.data?.data || []) : [])
    } else {
      setCustomerResults([])
    }
  }

  const selectCustomer = (c: any) => {
    setSelectedCustomer(c)
    setCustomerSearch('')
    setCustomerResults([])
    setMotorcycleBrand(c.motorcycleBrand || '')
    setMotorcycleModel(c.motorcycleModel || '')
    setPlateNumber(c.plateNumber || '')
  }

  const openNewCustomerModal = () => {
    const name = customerSearch.trim()
    setNewCustomer({ ...emptyCustomerForm, name })
    setShowNewCustomerModal(true)
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return
    setCreatingCustomer(true)
    const payload = {
      ...newCustomer,
      name: newCustomer.name.trim()
    }
    const res = await window.api.customers.create(payload)
    setCreatingCustomer(false)
    if (res.success && res.data) {
      const created = res.data
      setSelectedCustomer(created)
      setMotorcycleBrand(created.motorcycleBrand || '')
      setMotorcycleModel(created.motorcycleModel || '')
      setPlateNumber(created.plateNumber || '')
      addToast(t('jobs.customerCreated'), 'success')
      setShowNewCustomerModal(false)
      setCustomerSearch('')
      setCustomerResults([])
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const addPartRow = () => setParts([...parts, { partId: null, partName: '', quantity: '1', buyPrice: 0, sellPrice: 0, stock: 0, searchResults: [] }])

  const searchPart = async (index: number, query: string) => {
    const updated = [...parts]
    updated[index].partName = query
    updated[index].partId = null
    if (query.length >= 2) {
      const res = await window.api.parts.search(query)
      updated[index].searchResults = res.success ? (res.data || []) : []
    } else {
      updated[index].searchResults = []
    }
    setParts(updated)
  }

  const selectPart = (index: number, part: any) => {
    const updated = [...parts]
    updated[index] = { partId: part.id, partName: part.name, quantity: '1', buyPrice: part.buyPrice, sellPrice: part.sellPrice, stock: part.quantity, searchResults: [] }
    setParts(updated)
  }

  const updatePartQty = (index: number, qty: string) => {
    const updated = [...parts]
    updated[index].quantity = qty
    setParts(updated)
  }

  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index))

  const profit = useMemo(() => {
    return calculateProfit(
      Number(repairFee) || 0,
      Number(workerMarkup) || 0,
      parts.filter(p => p.partId).map(p => ({ buyPrice: p.buyPrice, sellPrice: p.sellPrice, quantity: Number(p.quantity) || 0 })),
      Number(discount) || 0,
      discountType
    )
  }, [repairFee, workerMarkup, parts, discount, discountType])

  const openTemplateModal = async () => {
    setShowTemplateModal(true)
    setLoadingTemplates(true)
    const res = await window.api.templates.getAll()
    setTemplates(res.success ? (res.data || []) : [])
    setLoadingTemplates(false)
  }

  const loadTemplate = async (templateId: number) => {
    const res = await window.api.templates.getById(templateId)
    if (!res.success || !res.data) return
    const tmpl = res.data
    setDescription(tmpl.description || '')
    setRepairFee(String(tmpl.repairFee))
    setWorkerMarkup(String(tmpl.workerMarkup))
    setNotes(tmpl.notes || '')
    setParts(
      tmpl.parts.map((p: any) => ({
        partId: p.partId,
        partName: p.partName,
        quantity: String(p.quantity),
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        stock: p.stock,
        searchResults: []
      }))
    )
    setShowTemplateModal(false)
    addToast(t('templates.templateLoaded'), 'success')
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return
    setSavingTemplate(true)
    const data = {
      name: templateName.trim(),
      description,
      repairFee: Number(repairFee) || 0,
      workerMarkup: Number(workerMarkup) || 0,
      notes,
      parts: parts
        .filter((p) => p.partId)
        .map((p) => ({ partId: p.partId!, quantity: Number(p.quantity) || 1 }))
    }
    const res = await window.api.templates.create(data)
    setSavingTemplate(false)
    if (res.success) {
      addToast(t('templates.templateSaved'), 'success')
      setShowSaveTemplateModal(false)
      setTemplateName('')
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const handleSave = async () => {
    if (!selectedCustomer) { addToast(t('jobs.selectCustomer'), 'error'); return }
    if (!selectedWorkerId) { addToast(t('jobs.selectWorker'), 'error'); return }
    if (!Number(repairFee)) { addToast(t('jobs.repairFeeRequired'), 'error'); return }

    setSaving(true)
    const data = {
      customerId: selectedCustomer.id,
      workerId: selectedWorkerId,
      description,
      repairFee: Number(repairFee),
      workerMarkup: Number(workerMarkup) || 0,
      notes,
      motorcycleBrand: motorcycleBrand || undefined,
      motorcycleModel: motorcycleModel || undefined,
      plateNumber: plateNumber || undefined,
      discount: Number(discount) || 0,
      discountType,
      warrantyMonths: Number(warrantyMonths) || 0,
      parts: parts.filter(p => p.partId).map(p => ({
        partId: p.partId!,
        quantity: Number(p.quantity) || 1,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice
      }))
    }

    const res = isEditMode
      ? await window.api.jobs.update(Number(id), data)
      : await window.api.jobs.create(data)
    setSaving(false)

    if (res.success) {
      addToast(isEditMode ? t('jobs.jobUpdated') : t('jobs.jobCreated'), 'success')
      setTimeout(() => navigate(`/jobs/${isEditMode ? id : res.data.id}`), 500)
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  const workerPct = profit.totalAmount > 0 ? (profit.workerProfit / (profit.workerProfit + profit.totalStoreProfit || 1)) * 100 : 0
  const storePct = 100 - workerPct

  return (
    <div className="pb-40">
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft size={20} /><span>{t('common.back')}</span>
      </button>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">{isEditMode ? t('jobs.editJob') : t('jobs.newJob')}</h1>
        {!isEditMode && (
          <Button variant="secondary" size="sm" onClick={openTemplateModal}>
            <FileText size={16} />
            {t('templates.loadTemplate')}
          </Button>
        )}
      </div>

      {/* Section 1: Customer */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('jobs.customer')}</h3>
        {selectedCustomer ? (
          <div className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg">
            <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center text-text-primary font-bold">{getInitials(selectedCustomer.name)}</div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{selectedCustomer.name}</p>
              <p className="text-sm text-text-tertiary">{[selectedCustomer.phone, selectedCustomer.motorcycleBrand, selectedCustomer.motorcycleModel].filter(Boolean).join(' � ')}</p>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><X size={18} /></button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Input value={customerSearch} onChange={e => searchCustomers(e.target.value)} placeholder={t('jobs.selectCustomer')} icon={<Search size={18} />} />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full px-4 py-3 text-left hover:bg-bg-hover flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-primary">{getInitials(c.name)}</div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{c.name}</p>
                          <p className="text-xs text-text-tertiary">{c.phone} � {c.plateNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="button" variant="secondary" onClick={openNewCustomerModal} className="flex-shrink-0">
                <Plus size={16} className="mr-2" />{t('jobs.addNewCustomer')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Job Details */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{t('jobs.description')}</h3>
          {isAdminView && (description || Number(repairFee) > 0) && (
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Save size={14} />
              {t('templates.saveAsTemplate')}
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">{t('jobs.description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[80px]" placeholder={t('jobs.descriptionPlaceholder')} />
          </div>
          {isAdminView && (
            <div>
              <label className="label">{t('jobs.worker')}</label>
              <select value={selectedWorkerId} onChange={e => setSelectedWorkerId(Number(e.target.value))} className="input">
                <option value="">{t('jobs.selectWorker')}</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.displayName}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Input label={t('jobs.motorcycleBrand')} value={motorcycleBrand} onChange={e => setMotorcycleBrand(e.target.value)} />
            <Input label={t('jobs.motorcycleModel')} value={motorcycleModel} onChange={e => setMotorcycleModel(e.target.value)} />
            <Input label={t('jobs.plateNumber')} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section 3: Parts */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{t('jobs.partsUsed')}</h3>
          <Button variant="secondary" size="sm" onClick={addPartRow}><Plus size={16} />{t('jobs.addParts')}</Button>
        </div>
        {parts.length === 0 ? (
          <p className="text-text-tertiary text-sm py-4">{t('jobs.noPartsAdded')}</p>
        ) : (
          <div className="space-y-3">
            {parts.map((part, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 bg-bg-tertiary rounded-lg">
                <div className="col-span-4 relative">
                  {part.partId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{part.partName}</span>
                      <span className="text-xs text-text-tertiary">({t('parts.stock')}: {part.stock})</span>
                    </div>
                  ) : (
                    <>
                      <Input value={part.partName} onChange={e => searchPart(idx, e.target.value)} placeholder={t('parts.search')} />
                      {part.searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-36 overflow-y-auto">
                          {part.searchResults.map((p: any) => (
                            <button key={p.id} onClick={() => selectPart(idx, p)} className="w-full px-3 py-2 text-left text-sm hover:bg-bg-hover text-text-primary flex justify-between">
                              <span>{p.name}</span>
                              <span className="text-text-tertiary">{formatDZD(p.sellPrice)} · {t('parts.stock')}: {p.quantity}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="col-span-2">
                  <Input type="number" value={part.quantity} onChange={e => updatePartQty(idx, e.target.value)} min="1" max={String(part.stock)} placeholder={t('parts.quantity')} />
                </div>
                {isAdminView && (
                  <div className="col-span-2 text-sm">
                    <span className="text-text-tertiary">{t('parts.buyPrice')}: </span><span className="font-mono text-text-secondary">{formatDZD(part.buyPrice)}</span>
                  </div>
                )}
                <div className={cn(isAdminView ? 'col-span-2' : 'col-span-4', 'text-sm')}>
                  <span className="text-text-tertiary">{t('parts.sellPrice')}: </span><span className="font-mono font-bold text-text-primary">{formatDZD(part.sellPrice)}</span>
                </div>
                {isAdminView && (
                  <div className="col-span-1 text-right text-sm">
                    <span className="font-mono text-profit-positive">{formatDZD((part.sellPrice - part.buyPrice) * (Number(part.quantity) || 0))}</span>
                  </div>
                )}
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removePart(idx)} className="p-2 hover:bg-bg-hover rounded-lg text-text-tertiary hover:text-status-error transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Repair Fee & Markup */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('jobs.repairFee')} & {t('jobs.workerMarkup')}</h3>
        <div className="grid grid-cols-2 gap-6">
          <Input label={t('jobs.repairFee') + ' (DZD)'} type="number" value={repairFee} onChange={e => setRepairFee(e.target.value)} placeholder="0" />
          <Input label={t('jobs.workerMarkup')} type="number" value={workerMarkup} onChange={e => setWorkerMarkup(e.target.value)} placeholder="30" min="0" max="100" disabled={!isAdminView} />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Input label={t('jobs.discount')} type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" min="0" />
          <div>
            <label className="label">{t('jobs.discountType')}</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="input">
              <option value="fixed">{t('jobs.fixed')}</option>
              <option value="percent">{t('jobs.percent')}</option>
            </select>
          </div>
          <Input label={t('jobs.warrantyMonths')} type="number" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} placeholder="0" min="0" />
        </div>
        <div className="mt-4">
          <label className="label">{t('jobs.notes')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[60px]" />
        </div>
      </div>

      {/* Sticky Footer: Profit Breakdown */}
      <div className="fixed bottom-0 left-64 right-0 bg-bg-secondary border-t border-border-primary px-8 py-4 z-30">
        <div className="flex items-center gap-8">
          {/* Split bar */}
          <div className="flex-1">
            <div className="flex h-4 rounded-full overflow-hidden bg-bg-tertiary mb-3">
              <div className="bg-money-worker transition-all duration-300" style={{ width: `${workerPct}%` }} />
              <div className="bg-money-store transition-all duration-300" style={{ width: `${storePct}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-money-worker" />
                <span className="text-text-tertiary">{t('jobs.workerProfit')}:</span>
                <span className="font-mono font-bold text-money-worker">{formatDZD(profit.workerProfit)}</span>
              </div>
              {isAdminView && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-money-store" />
                  <span className="text-text-tertiary">{t('jobs.storeProfit')}:</span>
                  <span className="font-mono font-bold text-money-store">{formatDZD(profit.totalStoreProfit)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">{t('jobs.totalAmount')}:</span>
                <span className="font-mono text-xl font-extrabold text-profit-positive">{formatDZD(profit.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/jobs')}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : isEditMode ? t('jobs.updateJob') : t('jobs.createJob')}</Button>
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <Modal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        title={t('jobs.newCustomer')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewCustomerModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer}>
              {creatingCustomer ? t('common.loading') : t('jobs.createCustomer')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('customers.name')} value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
          <Input label={t('customers.phone')} value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('customers.brand')} value={newCustomer.motorcycleBrand} onChange={e => setNewCustomer({ ...newCustomer, motorcycleBrand: e.target.value })} />
            <Input label={t('customers.model')} value={newCustomer.motorcycleModel} onChange={e => setNewCustomer({ ...newCustomer, motorcycleModel: e.target.value })} />
          </div>
          <Input label={t('customers.plateNumber')} value={newCustomer.plateNumber} onChange={e => setNewCustomer({ ...newCustomer, plateNumber: e.target.value })} />
          <div>
            <label className="label">{t('customers.notes')}</label>
            <textarea value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })} className="input min-h-[80px]" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={t('templates.loadTemplate')} size="md">
        {loadingTemplates ? (
          <p className="text-text-tertiary text-center py-8">{t('common.loading')}</p>
        ) : templates.length === 0 ? (
          <p className="text-text-tertiary text-center py-8">{t('templates.noTemplates')}</p>
        ) : (
          <div className="space-y-2">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => loadTemplate(tmpl.id)}
                className="w-full text-left p-4 rounded-lg border border-border-primary hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{tmpl.name}</span>
                  <span className="text-xs text-text-tertiary">
                    {tmpl.partCount} {t('templates.parts')} · {formatDZD(tmpl.repairFee)}
                  </span>
                </div>
                {tmpl.description && (
                  <p className="text-sm text-text-tertiary mt-1 truncate">{tmpl.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Save as Template Modal */}
      <Modal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        title={t('templates.saveAsTemplate')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSaveTemplateModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()}>
              {savingTemplate ? t('common.loading') : t('common.save')}
            </Button>
          </>
        }
      >
        <div>
          <label className="label">{t('templates.templateName')}</label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={t('templates.namePlaceholder')}
            autoFocus
          />
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </div>
  )
}





