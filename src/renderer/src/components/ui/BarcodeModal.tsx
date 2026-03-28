import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { formatDZD } from '@/lib/utils'
import { Search } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function BarcodeModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [barcode, setBarcode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleLookup = async () => {
    if (!barcode.trim()) return
    setSearching(true)
    setNotFound(false)
    setResult(null)
    const res = await window.api.parts.getByBarcode(barcode.trim())
    setSearching(false)
    if (res.success && res.data) {
      setResult(res.data)
    } else {
      setNotFound(true)
    }
  }

  const handleClose = () => {
    setBarcode('')
    setResult(null)
    setNotFound(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('barcode.title')} size="sm">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={barcode}
            onChange={e => { setBarcode(e.target.value); setNotFound(false); setResult(null) }}
            placeholder={t('barcode.placeholder')}
            onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
            autoFocus
          />
          <Button onClick={handleLookup} disabled={searching}>
            <Search size={18} />
          </Button>
        </div>

        {notFound && (
          <p className="text-sm text-status-error">{t('barcode.notFound')}</p>
        )}

        {result && (
          <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
            <p className="font-medium text-text-primary">{result.name}</p>
            {result.category && <p className="text-sm text-text-tertiary">{result.category}</p>}
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">{t('parts.sellPrice')}</span>
              <span className="font-mono font-bold text-text-primary">{formatDZD(result.sellPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">{t('parts.stock')}</span>
              <span className={`font-mono font-bold ${result.quantity <= result.minStock ? 'text-status-error' : 'text-text-primary'}`}>{result.quantity}</span>
            </div>
            <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => { handleClose(); navigate('/parts') }}>
              {t('parts.viewDetails')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
