import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

const NAVY = '#0c2340'
const TINT = '#e8f1f5'
const BORDER = '#cfe0ea'
const SLATE = '#3d5a80'
const RED = '#dc2626'

const card = { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(12,35,64,0.08)', border: `1px solid ${BORDER}`, marginBottom: '20px' }
const sectionTitle = { fontSize: '14px', fontWeight: 700, color: NAVY, margin: '0 0 12px 0' }

const formatDate = (value) => {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const qualityBand = (score) => (score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Bad')

export default function AdminTicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = sessionStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    const load = async () => {
      try {
        const [t, m, a] = await Promise.all([
          axios.get(`${API_BASE}/api/tickets/${id}`, { headers }),
          axios.get(`${API_BASE}/api/tickets/${id}/messages`, { headers }),
          axios.get(`${API_BASE}/api/tickets/${id}/analysis`, { headers }),
        ])
        setTicket(t.data)
        setMessages(m.data || [])
        setAnalysis(a.data)
      } catch (err) {
        console.error('Admin ticket load failed:', err)
        setTicket(null)
      } finally {
        setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [id, token, navigate])

  if (loading) return <div style={{ padding: '24px', color: SLATE }}>Loading...</div>
  if (!ticket) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: SLATE }}>Ticket not found</p>
        <button onClick={() => navigate('/tickets')} style={{ marginTop: '12px', padding: '10px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Back to Tickets</button>
      </div>
    )
  }

  const flagged = (analysis && analysis.flagged_messages) || []
  const flaggedById = {}
  flagged.forEach(f => { flaggedById[f.message_id] = f })
  const job = analysis && analysis.job

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '121px', boxSizing: 'border-box', padding: '0 30px', margin: '-24px -24px 24px', background: TINT, borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate('/tickets')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: NAVY, padding: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            #{ticket.id} - {ticket.title}
          </h1>
          <p style={{ fontSize: '13px', color: SLATE, margin: '6px 0 0 0' }}>From {ticket.customer_name || 'N/A'} · Created {formatDate(ticket.created_at)}</p>
        </div>
        <span style={{ padding: '8px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', background: '#10b98120', color: '#10b981' }}>{ticket.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={card}>
            <h3 style={sectionTitle}>Conversation</h3>
            <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>No messages yet</p>}
              {messages.map(m => {
                const isCustomer = m.sender_type === 'Customer'
                const flag = flaggedById[m.id]
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isCustomer ? 'flex-start' : 'flex-end' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: isCustomer ? SLATE : NAVY }}>{m.sender_name || m.sender_type}</span> · {formatDate(m.sent_at)}
                    </div>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', background: flag ? '#fef2f2' : (isCustomer ? '#f9fafb' : TINT), border: `1px solid ${flag ? RED : BORDER}` }}>
                      {m.message}
                    </div>
                    {flag && (
                      <div style={{ fontSize: '11px', color: RED, fontWeight: 700, marginTop: '4px' }}>
                        ⚠ Flagged · negative {Math.round(flag.negative_prob * 100)}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={card}>
            <h3 style={sectionTitle}>Ticket Quality</h3>
            {analysis && analysis.analyzed ? (
              <>
                <p style={{ fontSize: '28px', fontWeight: 800, color: NAVY, margin: '0 0 4px 0' }}>
                  {analysis.quality_score != null ? `${analysis.quality_score} · ${qualityBand(analysis.quality_score)}` : 'Pending rating'}
                </p>
                <p style={{ fontSize: '12px', color: SLATE, margin: '0 0 12px 0' }}>Chat score {analysis.chat_score} · Flags {analysis.flagged_count}</p>
              </>
            ) : job && job.status === 'running' ? (
              <p style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 600 }}>Analyzing {job.done} of {job.total} messages</p>
            ) : job && job.status === 'failed' ? (
              <p style={{ fontSize: '13px', color: RED }}>Analysis failed: {job.error || 'unknown error'}</p>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Not analyzed yet. Analysis runs when the ticket is resolved.</p>
            )}
            {ticket.customer_rating ? <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>Customer rating: {ticket.customer_rating}★</p> : null}
          </div>

          <div style={card}>
            <h3 style={sectionTitle}>Flagged Messages</h3>
            {flagged.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No flagged messages</p>
            ) : (
              flagged.map(f => (
                <div key={f.message_id} style={{ borderLeft: `3px solid ${RED}`, paddingLeft: '10px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: RED, fontWeight: 700, margin: '0 0 2px 0' }}>{f.sender_type} · negative {Math.round(f.negative_prob * 100)}%</p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>{f.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
