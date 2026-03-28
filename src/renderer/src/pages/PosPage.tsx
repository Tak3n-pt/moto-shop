import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScanBarcode, Trash2, History, CreditCard, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchInput from '@/components/ui/SearchInput'
import Toast from '@/components/ui/Toast'
import { formatDZD, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useWorkerTab } from '@/context/WorkerTabContext'
import { useToast } from '@/hooks/useApi'

interface CartItem {
  partId: number
  name: string
  price: number
  quantity: number
  stock: number
  barcode?: string | null
}

export default function PosPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  const { toasts, addToast } = useToast()
  const navigate = useNavigate()

  const isWorkerMode = typeof activeView === 'number'
  const effectiveCashierId = isWorkerMode ? activeView : (user?.role === 'worker' ? user?.userId : undefined)

  const [cart, setCart] = useState<CartItem[]>([])
  const [manualBarcode, setManualBarcode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingParts, setSearchingParts] = useState(false)
  const [discount, setDiscount] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [summary, setSummary] = useState<{ saleCount: number; totalRevenue: number; totalItems: number; totalDue: number }>({ saleCount: 0, totalRevenue: 0, totalItems: 0, totalDue: 0 })
  const [processing, setProcessing] = useState(false)

  // USB Barcode Scanner Interceptor
  // Detects rapid keystrokes (< 80ms apart) that end with Enter — this is how USB scanners work.
  // Works regardless of which input has focus. If the user is typing manually (slow), it does nothing.
  const scanBufferRef = useRef('')   // Resolved chars (AZERTY→digits)
  const scanRawRef = useRef('')      // Raw chars as typed (for input cleanup)
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKeyTimeRef = useRef(0)
  const barcodeLookupRef = useRef<(code: string) => Promise<void>>()

  useEffect(() => {
    const SCANNER_THRESHOLD = 80 // ms between keystrokes — scanners type at ~10-50ms, humans at ~150-300ms
    const MIN_BARCODE_LENGTH = 3

    // AZERTY number row: when caps lock is off, these chars appear instead of digits
    // Also maps physical key codes to their intended characters
    const AZERTY_TO_NUMBER: Record<string, string> = {
      '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
      '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
      '§': '6', '!': '8',
    }
    // Physical key code → digit (works regardless of keyboard layout)
    const CODE_TO_DIGIT: Record<string, string> = {
      'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
      'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
      'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4', 'Numpad5': '5',
      'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9', 'Numpad0': '0',
    }

    const resolveChar = (e: KeyboardEvent): string | null => {
      // If it's a digit key by physical position, use the digit
      if (CODE_TO_DIGIT[e.code]) return CODE_TO_DIGIT[e.code]
      // If it's an AZERTY special char, map to digit
      if (AZERTY_TO_NUMBER[e.key]) return AZERTY_TO_NUMBER[e.key]
      // Otherwise use the key as-is if it's a single printable char
      if (e.key.length === 1) return e.key
      return null
    }

    let scanDetected = false // true once we detect rapid typing (scanner mode)

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Enter key — check if buffer looks like a barcode scan
      if (e.key === 'Enter') {
        const buffer = scanBufferRef.current
        if (buffer.length >= MIN_BARCODE_LENGTH && scanDetected) {
          e.preventDefault()
          e.stopPropagation()
          const code = buffer
          scanBufferRef.current = ''
          scanRawRef.current = ''
          scanDetected = false
          if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null }
          barcodeLookupRef.current?.(code)
          return
        }
        // Not a scan — reset and let Enter pass through normally
        scanBufferRef.current = ''
        scanRawRef.current = ''
        scanDetected = false
        return
      }

      // Printable character
      const ch = resolveChar(e)
      if (ch && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If this keystroke is slow (human speed), always reset — never block human typing
        if (timeSinceLastKey > SCANNER_THRESHOLD) {
          scanBufferRef.current = ''
          scanRawRef.current = ''
          scanDetected = false
        }

        scanBufferRef.current += ch
        scanRawRef.current += e.key

        // Only flag as scanner when 3+ chars arrived at scanner speed (< 80ms each)
        if (scanBufferRef.current.length >= 3 && timeSinceLastKey <= SCANNER_THRESHOLD) {
          scanDetected = true
        }

        // Only block if confirmed scanner — never block slow (human) keystrokes
        if (scanDetected && timeSinceLastKey <= SCANNER_THRESHOLD) {
          e.preventDefault()
          e.stopPropagation()
        }

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
        scanTimerRef.current = setTimeout(() => {
          scanBufferRef.current = ''
          scanRawRef.current = ''
          scanDetected = false
        }, 200)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    }
  }, [])

  const loadRecentSales = async () => {
    const res = await window.api.pos.getRecent(6, effectiveCashierId)
    if (res.success && res.data) setRecentSales(res.data)
  }

  const loadSummary = async () => {
    const res = await window.api.pos.getSummary(effectiveCashierId ? { cashierId: effectiveCashierId } : undefined)
    if (res.success && res.data) setSummary(res.data)
  }

  const addPartToCart = (part: any, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.partId === part.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, part.quantity)
        return prev.map(item => item.partId === part.id ? { ...item, quantity: newQty, stock: part.quantity } : item)
      }
      return [...prev, { partId: part.id, name: part.name, price: part.sellPrice, quantity: Math.min(quantity, part.quantity), stock: part.quantity, barcode: part.barcode }]
    })
    addToast(t('pos.addedToCart'), 'success')
  }

  // Keep scanner ref pointing to latest closure
  barcodeLookupRef.current = async (code: string) => {
    const trimmed = code.replace(/[\r\n\t\x00-\x1f]/g, '').trim()
    if (!trimmed || trimmed.length < 3) return
    const res = await window.api.parts.getByBarcode(trimmed)
    if (res.success && res.data) {
      addPartToCart(res.data)
    } else {
      addToast(t('barcode.notFound'), 'error')
    }
  }

  const handleManualAdd = async () => {
    const trimmed = manualBarcode.replace(/[\r\n\t\x00-\x1f]/g, '').trim()
    if (!trimmed) return
    const res = await window.api.parts.getByBarcode(trimmed)
    if (res.success && res.data) {
      addPartToCart(res.data)
    } else {
      addToast(t('barcode.notFound'), 'error')
    }
    setManualBarcode('')
  }

  const handleSearchChange = async (value: string) => {
    setSearchTerm(value)
    if (value.length < 2) {
      setSearchResults([])
      return
    }
    setSearchingParts(true)
    const res = await window.api.parts.search(value)
    setSearchingParts(false)
    if (res.success) setSearchResults(res.data || [])
  }

  const updateQuantity = (partId: number, quantityStr: string) => {
    const qty = Number(quantityStr)
    if (Number.isNaN(qty) || qty <= 0) {
      addToast(t('pos.invalidQuantity'), 'error')
      return
    }
    setCart(prev => prev.map(item => item.partId === partId ? { ...item, quantity: Math.min(qty, item.stock) } : item))
  }

  const removeItem = (partId: number) => setCart(prev => prev.filter(item => item.partId !== partId))

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal)
  const total = Math.max(0, subtotal - discountValue)
  const cashValue = Number(cashReceived) > 0 ? Number(cashReceived) : total
  const amountDue = Math.max(total - cashValue, 0)
  const changeDue = amountDue > 0 ? 0 : Math.max(0, cashValue - total)

  const handleCheckout = async () => {
    if (!user) return
    if (cart.length === 0) {
      addToast(t('pos.emptyCart'), 'error')
      return
    }

    setProcessing(true)
    const res = await window.api.pos.createSale({
      cashierId: user.userId,
      items: cart.map(item => ({ partId: item.partId, quantity: item.quantity })),
      discount: discountValue,
      notes: notes || undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      cashReceived: cashValue
    })
    setProcessing(false)

    if (res.success) {
      addToast(t('pos.saleSuccess'), 'success')
      if (amountDue > 0) {
        addToast(t('pos.outstandingWarning', { amount: formatDZD(amountDue) }), 'info')
      }
      if (res.data?.id) {
        const shouldPrint = window.confirm(t('pos.printPrompt'))
        if (shouldPrint) {
          navigate(`/pos/sales/${res.data.id}?print=true`)
          return
        }
      }
      setCart([])
      setDiscount('')
      setCashReceived('')
      setNotes('')
      setCustomerName('')
      setCustomerPhone('')
      loadRecentSales()
      loadSummary()
    } else {
      addToast(res.error || t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-text-primary">{t('pos.title')}</h1>
        <p className="text-text-tertiary">{t('pos.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3 text-sm text-text-primary">
              <div className="w-10 h-10 rounded-full bg-shop-steel-600/10 text-shop-steel-200 flex items-center justify-center">
                <ScanBarcode size={20} />
              </div>
              <div>
                <p className="font-semibold">{t('pos.scannerReady')}</p>
                <p className="text-text-tertiary text-xs">{t('pos.scannerHint')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder={t('pos.manualEntry')}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleManualAdd() } }}
              />
              <Button onClick={handleManualAdd}>{t('pos.add')}</Button>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-4">
            <div className="relative">
              <SearchInput value={searchTerm} onChange={handleSearchChange} placeholder={t('pos.search') || ''} />
              {searchTerm.length >= 2 && (
                <div className="absolute top-14 left-0 right-0 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                  {searchResults.length === 0 && !searchingParts && (
                    <p className="text-center py-4 text-sm text-text-tertiary">{t('search.noResults')}</p>
                  )}
                  {searchResults.map(part => (
                    <button
                      key={part.id}
                      onClick={() => { addPartToCart(part); setSearchResults([]); setSearchTerm('') }}
                      className="w-full px-4 py-3 text-left hover:bg-bg-hover flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{part.name}</p>
                        <p className="text-xs text-text-tertiary">{t('pos.stockLeft', { stock: part.quantity })}</p>
                      </div>
                      <span className="text-xs text-text-tertiary">{formatDZD(part.sellPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-text-primary">{t('pos.cart')}</h2>
                <span className="text-sm text-text-tertiary">{t('pos.cartCount', { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}</span>
              </div>
              {cart.length === 0 ? (
                <div className="py-10 text-center text-text-tertiary">
                  {t('pos.emptyCart')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-tertiary">
                        <th className="pb-2">{t('parts.name')}</th>
                        <th className="pb-2">{t('pos.quantity')}</th>
                        <th className="pb-2">{t('pos.price')}</th>
                        <th className="pb-2 text-right">{t('pos.lineTotal')}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {cart.map(item => (
                        <tr key={item.partId}>
                          <td className="py-3">
                            <p className="font-medium text-text-primary">{item.name}</p>
                            <p className="text-xs text-text-tertiary">{t('pos.stockLeft', { stock: item.stock })}</p>
                          </td>
                          <td className="py-3 pr-4 w-28">
                            <Input
                              type="number"
                              value={String(item.quantity)}
                              min={1}
                              max={item.stock}
                              onChange={e => updateQuantity(item.partId, e.target.value)}
                            />
                          </td>
                          <td className="py-3">{formatDZD(item.price)}</td>
                          <td className="py-3 text-right font-semibold">{formatDZD(item.price * item.quantity)}</td>
                          <td className="py-3 text-right">
                            <button className="p-2 text-text-tertiary hover:text-status-error" onClick={() => removeItem(item.partId)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-4">
            <div>
              <label className="label">{t('pos.discount')}</label>
              <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('pos.customerName')} value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input label={t('pos.customerPhone')} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <Input label={t('pos.cashReceived')} type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} min="0" />
            <Input label={t('pos.notes')} value={notes} onChange={e => setNotes(e.target.value)} />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-text-tertiary">
                <span>{t('invoice.subtotal') || 'Subtotal'}</span>
                <span>{formatDZD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-tertiary">
                <span>{t('pos.discount')}</span>
                <span>-{formatDZD(discountValue)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-tertiary">
                <span>{t('pos.cashReceived')}</span>
                <span>{formatDZD(cashValue)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text-primary">
                <span>{t('pos.totalRevenue')}</span>
                <span>{formatDZD(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-tertiary">
                <span>{t('pos.changeDue')}</span>
                <span>{formatDZD(changeDue)}</span>
              </div>
              {amountDue > 0 && (
                <div className="flex justify-between text-sm font-semibold text-status-warning">
                  <span>{t('pos.totalDue')}</span>
                  <span>{formatDZD(amountDue)}</span>
                </div>
              )}
            </div>

      <Button onClick={handleCheckout} disabled={processing || cart.length === 0}>
        {processing ? t('pos.processing') : t('pos.checkout')}
      </Button>
            <p className="text-xs text-text-tertiary flex items-center gap-2"><CreditCard size={14} /> {t('pos.cashOnly')}</p>
            {summary?.totalDue > 0 && (
              <div className="flex items-center gap-2 text-xs text-status-warning bg-status-warning/10 rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                <span>{t('pos.summaryDue', { amount: formatDZD(summary.totalDue || 0) })}</span>
              </div>
            )}
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-text-primary">
              <History size={18} />
              <h3 className="font-semibold">{t('pos.summaryToday')}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>{t('pos.totalRevenue')}</span><span className="font-semibold">{formatDZD(summary?.totalRevenue || 0)}</span></div>
              <div className="flex justify-between"><span>{t('pos.totalItems')}</span><span className="font-semibold">{summary?.totalItems || 0}</span></div>
              <div className="flex justify-between"><span>{t('pos.saleCount')}</span><span className="font-semibold">{summary?.saleCount || 0}</span></div>
              <div className="flex justify-between"><span>{t('pos.totalDue')}</span><span className="font-semibold text-status-warning">{formatDZD(summary?.totalDue || 0)}</span></div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-3 max-h-[360px] overflow-y-auto">
            <div className="flex items-center gap-2 text-text-primary">
              <History size={18} />
              <h3 className="font-semibold">{t('pos.recentSales')}</h3>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-text-tertiary">{t('search.noResults')}</p>
            ) : (
              <div className="space-y-3 text-sm">
                {recentSales.map(sale => (
                  <div key={sale.id} className="border border-border-primary rounded-lg p-3">
                    <div className="flex justify-between text-text-primary">
                      <span className="font-semibold flex items-center gap-2">#{sale.id}{sale.amountDue > 0 && <AlertTriangle size={14} className="text-status-warning" />}</span>
                      <span className="font-mono">{formatDZD(sale.total)}</span>
                    </div>
                    <p className="text-xs text-text-tertiary">{formatDateTime(sale.createdAt)}</p>
                    {sale.items?.length > 0 && (
                      <p className="text-xs text-text-tertiary mt-1">{sale.items.slice(0, 2).map((item: any) => `${item.partName} x${item.quantity}`).join(', ')}{sale.items.length > 2 ? '…' : ''}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
                      <span>{t('pos.changeDue')}: {formatDZD(sale.changeDue || 0)}</span>
                      <button className="text-shop-steel-500 hover:text-shop-steel-400" onClick={() => navigate(`/pos/sales/${sale.id}`)}>{t('common.view')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}
