import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'pending'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant, children, className }: BadgeProps) {
  const styles = {
    success: 'bg-status-success/10 text-status-success border-status-success/30',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
    error: 'bg-status-error/10 text-status-error border-status-error/30',
    info: 'bg-status-info/10 text-status-info border-status-info/30',
    pending: 'bg-status-pending/10 text-status-pending border-status-pending/30'
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase border', styles[variant], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
