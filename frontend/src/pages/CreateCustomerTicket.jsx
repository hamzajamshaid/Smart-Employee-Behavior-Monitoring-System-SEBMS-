import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

export default function CreateCustomerTicket() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'General',
    priority: 'Medium'
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const validateForm = () => {
    const errs = {}
    if (!formData.title.trim()) errs.title = 'Title required'
    if (!formData.description.trim()) errs.description = 'Description required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      await axios.post(`${API_BASE}/api/tickets`, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority
      }, { headers })
      alert('✅ Ticket created successfully!')
      navigate('/customer-tickets')
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed to create ticket'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc', padding: '30px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0052cc', margin: 0 }}>🎫 Create New Ticket</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0 0' }}>Describe your issue in detail</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
              <input
                type="text"
                placeholder="Brief title of your issue"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.title ? '#ef4444' : '#e8e8e8'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              {errors.title && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.title}</small>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description *</label>
              <textarea
                placeholder="Describe your issue in detail"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="5"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.description ? '#ef4444' : '#e8e8e8'}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              />
              {errors.description && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.description}</small>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
              <button
                type="button"
                onClick={() => navigate('/customer-tickets')}
                style={{ padding: '10px 20px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.15s' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '10px 20px', background: submitting ? '#999' : 'linear-gradient(135deg, #0052cc 0%, #003d99 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.15s' }}
              >
                {submitting ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}