import { useState } from 'react'

export default function CredentialsModal({ title, employeeName, code, password, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Code: ${code}\nPassword: ${password}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      setCopied(false)
    }
  }

  const btn = { border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,35,64,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '380px', maxWidth: '90vw', padding: '24px', boxShadow: '0 10px 30px rgba(12,35,64,0.25)', borderTop: '3px solid #2ec4b6' }}>
        <h3 style={{ margin: '0 0 6px', color: '#0c2340', fontSize: '20px', fontWeight: 800 }}>{title}</h3>
        <p style={{ margin: '0 0 16px', color: '#3d5a80', fontSize: '14px' }}>{employeeName}</p>
        <div style={{ background: '#e8f1f5', border: '1px solid #cfe0ea', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '15px', color: '#0c2340', lineHeight: 1.8 }}>
          <div><strong>Code:</strong> {code}</div>
          <div><strong>Password:</strong> {password}</div>
        </div>
        <p style={{ margin: '12px 0 16px', color: '#b45309', fontSize: '12px' }}>This password is shown only once. Save it now.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={copy} style={{ ...btn, background: '#e8f1f5', color: '#0c2340' }}>{copied ? 'Copied' : 'Copy'}</button>
          <button onClick={onClose} style={{ ...btn, background: '#0c2340', color: '#fff' }}>Close</button>
        </div>
      </div>
    </div>
  )
}
