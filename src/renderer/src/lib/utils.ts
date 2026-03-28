import { clsx, type ClassValue } from 'clsx'
import i18n from '../i18n'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' DZD'
}

const localeMap: Record<string, string> = {
  fr: 'fr-FR',
  ar: 'ar-DZ',
  en: 'en-GB'
}

const getLocale = () => localeMap[i18n.language as keyof typeof localeMap] || 'en-GB'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'status-success'
    case 'in_progress': return 'status-info'
    case 'pending': return 'status-pending'
    case 'cancelled': return 'status-error'
    default: return 'status-info'
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'completed': return i18n.t('jobs.completed')
    case 'in_progress': return i18n.t('jobs.inProgress')
    case 'pending': return i18n.t('jobs.pending')
    case 'cancelled': return i18n.t('jobs.cancelled')
    default: return status
  }
}

export function calculateProfit(repairFee: number, workerMarkup: number, parts: { buyPrice: number; sellPrice: number; quantity: number }[], discount = 0, discountType: 'fixed' | 'percent' = 'fixed') {
  const workerProfit = repairFee * (workerMarkup / 100)
  let storeRepairProfit = repairFee - workerProfit
  let partsTotal = 0
  let partsCost = 0
  for (const p of parts) {
    partsTotal += p.sellPrice * p.quantity
    partsCost += p.buyPrice * p.quantity
  }
  let storePartsProfit = partsTotal - partsCost
  const discountAmount = discountType === 'percent'
    ? (repairFee + partsTotal) * (discount / 100)
    : discount
  const totalAmount = repairFee + partsTotal - discountAmount
  if (discountAmount > 0) {
    const revenueBeforeDiscount = repairFee + partsTotal
    if (revenueBeforeDiscount > 0) {
      const repairShare = repairFee / revenueBeforeDiscount
      const partsShare = 1 - repairShare
      storeRepairProfit -= discountAmount * repairShare
      storePartsProfit -= discountAmount * partsShare
    } else {
      storeRepairProfit -= discountAmount
    }
  }
  const totalStoreProfit = storeRepairProfit + storePartsProfit

  return { workerProfit, storeRepairProfit, partsTotal, partsCost, storePartsProfit, totalAmount, totalStoreProfit, discountAmount }
}

export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'paid': return i18n.t('jobs.paid')
    case 'partial': return i18n.t('jobs.partial')
    case 'unpaid': return i18n.t('jobs.unpaid')
    default: return status
  }
}
