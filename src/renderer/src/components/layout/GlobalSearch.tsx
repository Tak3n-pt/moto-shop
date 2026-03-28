import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Package, Users, Wrench, Truck, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isOpen])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return }
    const res = await window.api.search.global(q)
    if (res.success) setResults(res.data)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 250)
  }

  const goTo = (path: string) => {
    onClose()
    navigate(path)
  }

  const hasResults = results && (results.parts?.length || results.customers?.length || results.jobs?.length || results.suppliers?.length)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-bg-secondary rounded-xl border border-border-primary shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary">
          <Search size={20} className="text-text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-text-primary outline-none text-sm placeholder:text-text-disabled"
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          />
          <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded text-text-tertiary"><X size={16} /></button>
        </div>

        {results && (
          <div className="max-h-80 overflow-y-auto">
            {!hasResults && (
              <p className="text-center text-text-tertiary text-sm py-8">{t('search.noResults')}</p>
            )}

            {results.parts?.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold uppercase text-text-tertiary bg-bg-tertiary flex items-center gap-2">
                  <Package size={14} /> {t('nav.parts')}
                </div>
                {results.parts.map((r: any) => (
                  <button key={`p-${r.id}`} onClick={() => goTo('/parts')} className="w-full px-4 py-2.5 text-left hover:bg-bg-hover flex items-center justify-between">
                    <span className="text-sm text-text-primary">{r.name}</span>
                    {r.extra && <span className="text-xs text-text-tertiary">{r.extra}</span>}
                  </button>
                ))}
              </div>
            )}

            {results.customers?.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold uppercase text-text-tertiary bg-bg-tertiary flex items-center gap-2">
                  <Users size={14} /> {t('nav.customers')}
                </div>
                {results.customers.map((r: any) => (
                  <button key={`c-${r.id}`} onClick={() => goTo(`/customers/${r.id}`)} className="w-full px-4 py-2.5 text-left hover:bg-bg-hover flex items-center justify-between">
                    <span className="text-sm text-text-primary">{r.name}</span>
                    {r.extra && <span className="text-xs text-text-tertiary">{r.extra}</span>}
                  </button>
                ))}
              </div>
            )}

            {results.jobs?.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold uppercase text-text-tertiary bg-bg-tertiary flex items-center gap-2">
                  <Wrench size={14} /> {t('nav.jobs')}
                </div>
                {results.jobs.map((r: any) => (
                  <button key={`j-${r.id}`} onClick={() => goTo(`/jobs/${r.id}`)} className="w-full px-4 py-2.5 text-left hover:bg-bg-hover flex items-center justify-between">
                    <span className="text-sm text-text-primary">{r.name || `Job #${r.id}`}</span>
                    <span className="text-xs text-text-tertiary">#{r.id}</span>
                  </button>
                ))}
              </div>
            )}

            {results.suppliers?.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold uppercase text-text-tertiary bg-bg-tertiary flex items-center gap-2">
                  <Truck size={14} /> {t('nav.suppliers')}
                </div>
                {results.suppliers.map((r: any) => (
                  <button key={`s-${r.id}`} onClick={() => goTo(`/suppliers/${r.id}`)} className="w-full px-4 py-2.5 text-left hover:bg-bg-hover flex items-center justify-between">
                    <span className="text-sm text-text-primary">{r.name}</span>
                    {r.extra && <span className="text-xs text-text-tertiary">{r.extra}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-2 border-t border-border-primary">
          <p className="text-xs text-text-disabled">{t('search.hint')}</p>
        </div>
      </div>
    </div>
  )
}
