import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-text-tertiary mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-shop-steel-500 focus:border-transparent outline-none transition-all duration-150 min-h-[48px]',
            error && 'border-status-error',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
