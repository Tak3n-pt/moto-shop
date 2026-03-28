import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { formatDateTime } from '../../lib/utils'

interface DocumentLayoutProps {
  title: string
  documentNumber?: string
  date?: string
  children: ReactNode
}

interface ShopSettings {
  shop_name?: string
  shop_phone?: string
  shop_address?: string
}

export default function DocumentLayout({ title, documentNumber, date, children }: DocumentLayoutProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ShopSettings>({})
  const isRtl = i18n.language === 'ar'

  useEffect(() => {
    window.api.settings.getAll().then((res) => {
      if (res.success && res.data) {
        setSettings({
          shop_name: res.data['shop_name'],
          shop_phone: res.data['shop_phone'],
          shop_address: res.data['shop_address'],
        })
      }
    })
  }, [])

  const generatedAt = formatDateTime(new Date().toISOString())

  return (
    <div
      className={`doc-page${isRtl ? ' document-rtl' : ''}`}
      style={{ background: '#fff', color: '#000' }}
    >
      {/* Shop Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: '#000' }}>
          {settings.shop_name || t('app.name', 'Moto Shop')}
        </div>
        {settings.shop_phone && (
          <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>
            {t('documents.phone', 'Tel')}: {settings.shop_phone}
          </div>
        )}
        {settings.shop_address && (
          <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>
            {settings.shop_address}
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#333', borderWidth: 1.5, margin: '12px 0' }} />

      {/* Document Title + Meta */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#000' }}>
          {title}
        </div>
        {(documentNumber || date) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 8, fontSize: 12, color: '#333' }}>
            {documentNumber && (
              <span>
                <strong>{t('documents.number', 'N°')}</strong> {documentNumber}
              </span>
            )}
            {date && (
              <span>
                <strong>{t('documents.date', 'Date')}</strong>: {date}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {children}

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 8,
          borderTop: '1px solid #ccc',
          fontSize: 10,
          color: '#888',
          textAlign: 'center',
        }}
      >
        {t('documents.generatedAt', 'Generated')}: {generatedAt}
      </div>
    </div>
  )
}
