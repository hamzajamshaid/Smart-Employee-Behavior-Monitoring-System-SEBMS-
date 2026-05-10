import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'
import Layout from '../components/Layout'

export default function CustomerTicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [rating, setRating] = useState(0)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/customer-login')
      return
    }
    fetchTicket()
  }, [id, token, navigate])

  const fetchTicket = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      const res = await axios.get(`${API_BASE}/api/tickets/${id}`, { headers })
      setTicket(res.data)
      
      const msgRes = await axios.get(`${API_BASE}/api/tickets/${id}/messages`, { headers })
      setMessages(msgRes.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      await axios.post(`${API_BASE}/api/tickets/${id}/messages`, {
        message: newMessage
      }, { headers })
      
      setNewMessage('')
      fetchTicket()
    } catch (err) {
      alert('Error sending message')
    }
  }

  const handleRateTicket = async (stars) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      await axios.put(`${API_BASE}/api/tickets/${id}`, {
        customer_rating: stars
      }, { headers })
      setRating(stars)
      alert('Thank you for rating!')
      fetchTicket()
    } catch (err) {
      alert('Error rating ticket')
    }
  }

  const statusColor = (status) => {
    switch(status) {
      case 'Open': return '#E8B84B'
      case 'In Progress': return '#3498DB'
      case 'Resolved': return '#27AE60'
      default: return '#888'
    }
  }

  if (loading) {
    return (
      <Layout userRole="Customer">
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
      </Layout>
    )
  }

  if (!ticket) {
    return (
      <Layout userRole="Customer">
        <div style={{ padding: '24px' }}>
          <p style={{ color: '#aaa' }}>Ticket not found</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '16px', padding: '8px 16px', background: '#2E4057', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Customer">
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/customer-tickets')}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2E4057', margin: 0 }}>
              #{ticket.id} - {ticket.title}
            </h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>
              Created: {ticket.created_at || 'N/A'}
            </p>
          </div>
          <span style={{
            padding: '8px 16px',
            background: statusColor(ticket.status) + '20',
            color: statusColor(ticket.status),
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {ticket.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
          {/* Main Content */}
          <div>
            {/* Ticket Info */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2E4057', marginBottom: '12px' }}>Your Issue</h3>
              <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                {ticket.description}
              </p>
            </div>

            {/* Messages */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2E4057', marginBottom: '16px' }}>Support Conversation</h3>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                {messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: msg.sender_type === 'Customer' ? '#2E4057' : '#27AE60' }}>
                          {msg.sender_type === 'Customer' ? '👤 You' : '🔵 Support'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>
                          {msg.sent_at || 'Just now'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#555', margin: '0 0 0 24px', lineHeight: '1.5', background: msg.sender_type === 'Customer' ? '#f0f0f0' : 'transparent', padding: msg.sender_type === 'Customer' ? '8px 12px' : 0, borderRadius: '6px' }}>
                        {msg.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
                    No messages yet
                  </p>
                )}
              </div>

              {/* Message Form */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Reply to support..."
                  rows={3}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#2E4057',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    alignSelf: 'flex-end'
                  }}
                >
                  Send
                </button>
              </form>
            </div>

            {/* Resolution (if resolved) */}
            {ticket.status === 'Resolved' && ticket.resolution_note && (
              <div style={{ background: '#e8f5e9', borderRadius: '12px', padding: '16px', border: '1px solid #c8e6c9' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#27AE60', margin: '0 0 8px 0' }}>✓ Resolution</h4>
                <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
                  {ticket.resolution_note}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Ticket Info */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#2E4057', marginBottom: '12px' }}>Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div>
                  <p style={{ color: '#aaa', margin: 0 }}>Type</p>
                  <p style={{ color: '#555', fontWeight: '600', margin: 0 }}>{ticket.type || 'General'}</p>
                </div>
                <div>
                  <p style={{ color: '#aaa', margin: 0 }}>Priority</p>
                  <p style={{ color: '#555', fontWeight: '600', margin: 0 }}>{ticket.priority || 'Medium'}</p>
                </div>
                <div>
                  <p style={{ color: '#aaa', margin: 0 }}>Assigned To</p>
                  <p style={{ color: '#555', fontWeight: '600', margin: 0 }}>{ticket.employee_name || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            {/* Rating */}
            {ticket.status === 'Resolved' && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#2E4057', marginBottom: '12px' }}>Rate this Support</h4>
                {!ticket.customer_rating ? (
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRateTicket(star)}
                        style={{
                          fontSize: '24px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: rating >= star ? 1 : 0.5,
                          transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.target.style.transform = rating >= star ? 'scale(1.1)' : 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', margin: 0, color: '#E8B84B' }}>
                      {'★'.repeat(ticket.customer_rating)}{'☆'.repeat(5 - ticket.customer_rating)}
                    </p>
                    <p style={{ fontSize: '11px', color: '#aaa', margin: '4px 0 0 0' }}>Thank you for rating!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}