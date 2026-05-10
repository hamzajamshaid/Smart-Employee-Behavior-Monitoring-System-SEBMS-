import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function CustomerTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const token = localStorage.getItem('token');
  const customerId = localStorage.getItem('customer_id');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !customerId) {
      navigate('/login');
      return;
    }
    fetchTickets();
  }, [token, customerId, navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/tickets?customer_id=${customerId}`, { headers });
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const statusColor = (status) => {
    const colors = { 'Open': '#ef4444', 'In Progress': '#f59e0b', 'Resolved': '#10b981' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>🎫 My Support Tickets</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Total: {tickets.length}</p>
          </div>
          <button
            onClick={() => navigate('/customer-tickets/new')}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0052cc 0%, #003d99 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,204,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            <Plus size={16} />
            New Ticket
          </button>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #0052cc', borderRadius: '6px', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,82,204,0.1)', background: '#fff', color: '#1a1a1a' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0052cc' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'Open', 'In Progress', 'Resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 16px',
                background: filterStatus === status ? '#0052cc' : '#fff',
                color: filterStatus === status ? '#fff' : '#0052cc',
                border: `1px solid ${filterStatus === status ? '#0052cc' : '#e8e8e8'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => filterStatus !== status && (e.currentTarget.style.background = '#f0f0f0')}
              onMouseLeave={e => filterStatus !== status && (e.currentTarget.style.background = '#fff')}
            >
              {status === 'all' ? `All (${tickets.length})` : `${status} (${tickets.filter(t => t.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' }}>
          {filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>No tickets found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/customer-tickets/${ticket.id}`)}
                  style={{
                    padding: '16px',
                    border: `1px solid ${statusColor(ticket.status)}`,
                    background: statusColor(ticket.status) + '05',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)', e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>#{ticket.id} - {ticket.title}</h4>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Created: {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ padding: '4px 12px', background: statusColor(ticket.status) + '20', color: statusColor(ticket.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {ticket.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', margin: '0' }}>{ticket.description?.substring(0, 100) || 'No description'}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}