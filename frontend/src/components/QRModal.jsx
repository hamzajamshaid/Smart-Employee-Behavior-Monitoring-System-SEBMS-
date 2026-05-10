import { useState } from 'react'
import { QRCodeSVG as QRCode } from 'qrcode.react'

export default function QRModal({ interactionId, onClose }) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  
  // Generate feedback URL that customer can scan
  const feedbackUrl = `${window.location.origin}/feedback/${interactionId}`
  
  const downloadQR = () => {
    const qrCanvas = document.querySelector('#qr-code svg')
    if (qrCanvas) {
      // Convert SVG to canvas then to image
      const svgData = new XMLSerializer().serializeToString(qrCanvas)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `feedback-qr-${interactionId}.png`
        link.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out' }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0052cc', margin: 0 }}>Customer Feedback QR Code</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)', e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.color = 'inherit')}
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
          Customers can scan this QR code with their phone to submit feedback about this interaction. The code redirects to a feedback form.
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#f5f8fc',
          border: '2px dashed #0052cc',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div id="qr-code" style={{ background: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <QRCode
              value={feedbackUrl}
              size={280}
              level="H"
              includeMargin={true}
              fgColor="#0052cc"
              bgColor="#ffffff"
            />
          </div>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Interaction ID: {interactionId}
          </p>
        </div>

        {/* URL Display */}
        <div style={{
          background: '#f0f0f0',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <code style={{ fontSize: '11px', color: '#333', wordBreak: 'break-all', margin: 0, flex: 1 }}>
            {feedbackUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(feedbackUrl)
              alert('Link copied to clipboard!')
            }}
            style={{
              background: '#0052cc',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#003d99')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0052cc')}
          >
            Copy
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={downloadQR}
            style={{
              flex: 1,
              padding: '12px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#059669')}
            onMouseLeave={e => (e.currentTarget.style.background = '#10b981')}
          >
            ⬇️ Download QR
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d0d0d0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#e0e0e0')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}