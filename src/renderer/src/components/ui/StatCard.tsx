import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string
  trend?: { value: string; positive: boolean }
  onClick?: () => void
}

export default function StatCard({ icon, iconColor, label, value, trend, onClick }: StatCardProps) {
  return (
    <div
      className={cn('bg-bg-secondary rounded-xl p-6 border border-border-primary', onClick && 'cursor-pointer hover:bg-bg-hover transition-colors')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconColor)}>
          {icon}
        </div>
        {trend && (
          <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', trend.positive ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error')}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <p className="text-sm text-text-tertiary mb-1">{label}</p>
      <p className="font-mono text-2xl font-extrabold text-text-primary">{value}</p>
    </div>
  )
}
