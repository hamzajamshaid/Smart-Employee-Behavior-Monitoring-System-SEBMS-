import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

const NAVY = '#0c2340'
const NAVY_2 = '#13315c'
const TEAL = '#2ec4b6'
const SLATE = '#3d5a80'
const TINT = '#e8f1f5'
const BORDER = '#cfe0ea'

const card = { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(12,35,64,0.08)', border: `1px solid ${BORDER}` }
const sectionTitle = { fontSize: '14px', fontWeight: 700, color: NAVY, margin: '0 0 12px 0' }

const formatDate = (value) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CustomerTicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [rating, setRating] = useState(0)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])
  const token = sessionStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/customer-login')
      return
    }
    fetchTicket()
  }, [id, token, navigate])

  useEffect(() => {
    if (!token) return
    const timer = setInterval(() => { fetchTicket() }, 5000)
    return () => clearInterval(timer)
  }, [id, token])

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
      await axios.put(`${API_BASE}/api/tickets/${id}/rate`, {
        customer_rating: stars
      }, { headers })
      setRating(stars)
      alert('Thank you for rating!')
      fetchTicket()
    } catch (err) {
      alert('Error rating ticket')
    }
  }

  const handleResolveTicket = async () => {
    if (!window.confirm('Mark this ticket as resolved?')) return
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      await axios.put(`${API_BASE}/api/tickets/${id}/resolve`, {}, { headers })
      fetchTicket()
    } catch (err) {
      alert('Error resolving ticket')
    }
  }

  const statusColor = (status) => {
    switch (status) {
      case 'Open': return '#d97706'
      case 'In Progress': return NAVY_2
      case 'Resolved': return '#16a34a'
      default: return '#888'
    }
  }

  if (loading) {
    return (
      <>
        <div style={{ padding: '24px', color: SLATE }}>Loading...</div>
      </>
    )
  }

  if (!ticket) {
    return (
      <>
        <div style={{ padding: '24px' }}>
          <p style={{ color: SLATE }}>Ticket not found</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '16px', padding: '10px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
            Go Back
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '121px', boxSizing: 'border-box', padding: '0 30px', margin: '-24px -24px 24px', position: 'sticky', top: 0, zIndex: 50, background: TINT, borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}` }}>
          <button
            onClick={() => navigate('/customer-tickets')}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: NAVY, padding: 0 }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              #{ticket.id} - {ticket.title}
            </h1>
            <p style={{ fontSize: '13px', color: SLATE, margin: '6px 0 0 0' }}>
              Created: {formatDate(ticket.created_at)}
            </p>
          </div>
          <span style={{
            padding: '8px 16px',
            background: statusColor(ticket.status) + '20',
            color: statusColor(ticket.status),
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            {ticket.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            <div style={card}>
              <h3 style={sectionTitle}>Your Issue</h3>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </p>
            </div>

            <div style={card}>
              <h3 style={sectionTitle}>Support Conversation</h3>

              <div ref={messagesRef} style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${BORDER}` }}>
                {messages.length > 0 ? (
                  messages.map((msg, idx) => {
                    const mine = msg.sender_type === 'Customer'
                    return (
                      <div key={idx} style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px' }}>
                          <img src={mine ? '/icons/comm/user-round-dark.png' : '/icons/comm/headset-dark.png'} alt="" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
                          <span style={{ fontWeight: 700, color: mine ? NAVY : TEAL }}>{mine ? 'You' : (msg.sender_name || 'Support')}</span>
                          <span style={{ color: '#94a3b8' }}>{formatDate(msg.sent_at)}</span>
                        </div>
                        <p style={{ maxWidth: '80%', fontSize: '14px', color: '#334155', lineHeight: 1.5, margin: 0, background: mine ? TINT : '#f0fdfa', border: `1px solid ${mine ? BORDER : '#ccfbf1'}`, padding: '10px 14px', borderRadius: '10px', whiteSpace: 'pre-wrap' }}>
                          {msg.message}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                    No messages yet
                  </p>
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Reply to support..."
                  rows={3}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${BORDER}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    boxSizing: 'border-box',
                    color: NAVY
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    background: NAVY,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  Send
                </button>
              </form>
            </div>

            {ticket.status === 'Resolved' && ticket.resolution_note && (
              <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '16px', border: '1px solid #a7f3d0' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#047857', margin: '0 0 8px 0' }}>✓ Resolution</h4>
                <p style={{ fontSize: '14px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {ticket.resolution_note}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '145px', alignSelf: 'start' }}>
            <div style={card}>
              <h4 style={{ ...sectionTitle, marginBottom: '14px' }}>Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  ['Type', ticket.type || 'General'],
                  ['Priority', ticket.priority || 'Medium'],
                  ['Assigned To', ticket.employee_name || 'Unassigned']
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '14px', color: NAVY, fontWeight: 600, margin: '2px 0 0 0' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {ticket.status !== 'Resolved' && (
              <div style={card}>
                <h4 style={{ ...sectionTitle, marginBottom: '14px' }}>Ticket Status</h4>
                <button
                  onClick={handleResolveTicket}
                  style={{ width: '100%', padding: '10px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
                >
                  Mark as Resolved
                </button>
              </div>
            )}

            {ticket.status === 'Resolved' && (
              <div style={card}>
                <h4 style={{ ...sectionTitle, marginBottom: '14px' }}>Rate this Support</h4>
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
                          color: '#f5b301',
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
                    <p style={{ fontSize: '22px', margin: 0, color: '#f5b301' }}>
                      {'★'.repeat(ticket.customer_rating)}{'☆'.repeat(5 - ticket.customer_rating)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>Thank you for rating!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
