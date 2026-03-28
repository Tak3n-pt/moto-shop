import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-shop-steel-600 hover:bg-shop-steel-700 text-white shadow-sm',
      secondary: 'bg-bg-tertiary hover:bg-bg-hover text-text-primary border border-border-primary',
      danger: 'bg-status-error hover:bg-red-600 text-white',
      ghost: 'hover:bg-bg-hover text-text-secondary'
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-6 py-3 min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[56px]'
    }
    return (
      <button ref={ref} className={cn('inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
