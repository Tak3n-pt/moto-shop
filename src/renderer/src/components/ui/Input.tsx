import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-text-tertiary mb-1.5">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-shop-steel-500 focus:border-transparent outline-none transition-all duration-150 min-h-[48px]',
              icon && 'pl-10',
              error && 'border-status-error focus:ring-status-error',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
