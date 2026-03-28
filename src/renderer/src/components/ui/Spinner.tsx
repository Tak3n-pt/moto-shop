import { cn } from '@/lib/utils'

export default function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('animate-spin rounded-full border-2 border-border-primary border-t-shop-steel-500', sizes[size], className)} />
  )
}
