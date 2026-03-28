import { CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  toasts: { id: number; message: string; type: 'success' | 'error' | 'info' }[]
}

export default function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-5 min-w-[300px]',
          toast.type === 'success' && 'bg-bg-secondary border-status-success/40',
          toast.type === 'error' && 'bg-bg-secondary border-status-error/40',
          toast.type === 'info' && 'bg-bg-secondary border-status-info/40'
        )}>
          {toast.type === 'success' && <CheckCircle size={20} className="text-status-success shrink-0" />}
          {toast.type === 'error' && <XCircle size={20} className="text-status-error shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-status-info shrink-0" />}
          <span className="text-sm font-medium text-text-primary">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
