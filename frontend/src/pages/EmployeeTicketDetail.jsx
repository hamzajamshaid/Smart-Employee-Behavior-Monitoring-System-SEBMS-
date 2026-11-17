import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function EmployeeTicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length]);
  const token = sessionStorage.getItem('token');
  const employeeId = sessionStorage.getItem('employee_id');
  const employeeName = sessionStorage.getItem('name');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
      return;
    }
    fetchTicket();
  }, [token, employeeId, id, navigate]);

  useEffect(() => {
    if (!token || !employeeId) return;
    const timer = setInterval(() => { fetchTicket(); }, 5000);
    return () => clearInterval(timer);
  }, [token, employeeId, id]);

  const fetchTicket = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tickets/${id}`, { headers });
      setTicket(res.data);
      
      const messagesRes = await axios.get(`${API_BASE}/api/tickets/${id}/messages`, { headers });
      setMessages(messagesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await axios.post(`${API_BASE}/api/tickets/${id}/messages`, {
        message: newMessage,
        sender_type: 'Employee',
        sender_id: employeeId
      }, { headers });

      setNewMessage('');
      fetchTicket();
    } catch (err) {
      alert('Error sending message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const statusColor = (status) => {
    const colors = { 'Open': '#ef4444', 'In Progress': '#f59e0b', 'Resolved': '#10b981' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;
  if (!ticket) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Ticket not found</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/employee-tickets')}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
          >
            <ArrowLeft size={24} color="#0c2340" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0c2340', margin: 0 }}>#{ticket.id} - {ticket.title}</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>From {ticket.customer_name || 'N/A'}</p>
          </div>
          <span style={{ padding: '6px 14px', background: statusColor(ticket.status) + '20', color: statusColor(ticket.status), borderRadius: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Ticket Details */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0c2340', marginTop: 0, marginBottom: '16px' }}>Ticket Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Type</p>
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{ticket.ticket_type || 'General'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Priority</p>
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{ticket.priority || 'Medium'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Created</p>
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>
                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Customer Rating</p>
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{ticket.customer_rating ? `${ticket.customer_rating}★` : '—'}</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 8px 0' }}>Description</p>
            <p style={{ fontSize: '13px', color: '#555', margin: 0, lineHeight: '1.6' }}>{ticket.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0c2340', marginTop: 0, marginBottom: '16px' }}>Conversation</h3>
          
          <div ref={messagesRef} style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '32px 0' }}>No messages yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.sender_type === 'Employee' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender_type === 'Employee' ? '#0c2340' : '#e8e8e8', color: msg.sender_type === 'Employee' ? '#fff' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                      <img src={msg.sender_type === 'Employee' ? '/icons/comm/headset-white.png' : '/icons/comm/user-round-dark.png'} alt="" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 4px 0', fontWeight: '600' }}>
                        {msg.sender_name || (msg.sender_type === 'Employee' ? employeeName : 'Customer')} • {new Date(msg.sent_at).toLocaleDateString()}
                      </p>
                      <div style={{ background: msg.sender_type === 'Employee' ? '#e8f1f5' : '#f9fafb', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#333' }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e8e8e8',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1a1a1a',
                background: '#f9fafb'
              }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              style={{
                padding: '10px 16px',
                background: sending || !newMessage.trim() ? '#d1d5db' : '#0c2340',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Send size={14} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}