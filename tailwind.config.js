/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'shop-charcoal': {
          900: '#1a1b1e',
          950: '#0a0a0b'
        },
        'shop-steel': {
          500: '#0c84eb',
          600: '#0066c9',
          700: '#0151a3'
        },
        'shop-orange': {
          500: '#f97316',
          600: '#ea580c'
        },
        'okba': {
          400: '#E0BB62',
          500: '#D4A84B',
          600: '#B8922F'
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)'
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)'
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
          pending: '#8b5cf6'
        },
        money: {
          worker: '#8b5cf6',
          store: '#0066c9'
        },
        profit: {
          positive: '#10b981',
          negative: '#ef4444'
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          accent: '#0066c9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
