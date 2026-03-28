import { useState, useCallback } from 'react'

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (apiFn: () => Promise<{ success: boolean; data?: T; error?: string }>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      if (!res.success) {
        setError(res.error || 'An error occurred')
        return null
      }
      setData(res.data ?? null)
      return res.data ?? null
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute, setData }
}

export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return { toasts, addToast }
}
