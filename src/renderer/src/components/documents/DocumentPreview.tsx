import { useEffect, type ReactNode } from 'react'
import './documents.css'

interface DocumentPreviewProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function DocumentPreview({ title, onClose, children }: DocumentPreviewProps) {
  useEffect(() => {
    document.body.classList.add('printing-document')
    return () => {
      document.body.classList.remove('printing-document')
    }
  }, [])

  function handlePrint() {
    window.api.print()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#e5e7eb',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#1f2937',
          color: '#fff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>&#128438;</span> Print
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            &#10005; Close
          </button>
        </div>
      </div>

      {/* Document area */}
      <div
        className="document-overlay"
        style={{
          padding: '32px 16px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
