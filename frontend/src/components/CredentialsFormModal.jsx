import { useState } from 'react'
import axios from 'axios'
import API_BASE from '../config'

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #cfe0ea', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: '#0c2340' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#3d5a80', marginBottom: '6px' }

export default function CredentialsFormModal({ employee, token, onClose, onSaved }) {
  const [code, setCode] = useState(employee.employee_code || '')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(employee.status || 'Active')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setError('')
    if (!code.trim()) { setError('Employee code is required'); return }
    if (password.trim() && password.trim().length < 6) { setError('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      const res = await axios.put(
        `${API_BASE}/api/employees/${employee.id}/reset-password`,
        { employee_code: code.trim(), password: password.trim(), status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSaved({ title: 'Credentials saved', name: employee.name, code: res.data.employee_code, password: res.data.new_password, status: res.data.status })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save')
      setSaving(false)
    }
  }

  const btn = { border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,35,64,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '400px', maxWidth: '90vw', padding: '24px', boxShadow: '0 10px 30px rgba(12,35,64,0.25)', borderTop: '3px solid #2ec4b6' }}>
        <h3 style={{ margin: '0 0 6px', color: '#0c2340', fontSize: '20px', fontWeight: 800 }}>Credentials</h3>
        <p style={{ margin: '0 0 18px', color: '#3d5a80', fontSize: '14px' }}>{employee.name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Employee code</label>
            <input style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Password (blank = auto-generate)</label>
            <input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
        {error && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: '13px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} disabled={saving} style={{ ...btn, background: '#e8f1f5', color: '#0c2340' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btn, background: '#0c2340', color: '#fff' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
