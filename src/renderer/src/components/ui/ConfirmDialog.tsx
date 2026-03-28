import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel, variant = 'danger' }: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose() }}>{confirmLabel || t('common.confirm')}</Button>
      </>
    }>
      <p className="text-text-secondary">{message}</p>
    </Modal>
  )
}
