import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={cn('bg-bg-secondary rounded-xl p-6 border border-border-primary', hover && 'hover:border-border-secondary hover:shadow-md transition-all duration-150 cursor-pointer', className)}>
      {children}
    </div>
  )
}
