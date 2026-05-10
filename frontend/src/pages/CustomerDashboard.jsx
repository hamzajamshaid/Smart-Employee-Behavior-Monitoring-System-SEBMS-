import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import KPICard from '../components/KPICard';

const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const customerId = localStorage.getItem('customer_id');
  const customerName = localStorage.getItem('name');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !customerId) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, customerId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, appointmentsRes, ticketsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/customers/${customerId}/summary`, { headers }).catch(() => ({})),
        axios.get(`${API_BASE}/api/appointments?customer_id=${customerId}`, { headers }).catch(() => ({})),
        axios.get(`${API_BASE}/api/tickets?customer_id=${customerId}`, { headers }).catch(() => ({}))
      ]);

      setSummary(summaryRes.data);
      setAppointments(appointmentsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  const upcomingAppointments = appointments.filter(a => new Date(a.appointment_date) >= new Date());
  const openTickets = tickets.filter(t => t.status !== 'Resolved');

  // Loading Skeleton Component
  const SkeletonKPI = () => (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e8e8e8',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }}>
      <div style={{ height: '16px', background: '#e8e8e8', borderRadius: '4px', marginBottom: '12px', width: '60%' }} />
      <div style={{ height: '36px', background: '#e8e8e8', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '12px', background: '#e8e8e8', borderRadius: '4px', width: '50%' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .card-hover { transition: all 0.2s linear; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(0,82,204,0.15); transform: translateY(-2px); }
      `}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>Welcome, {customerName}!</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Your customer dashboard</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 30px' }}>
        {/* KPI Cards */}
        {summary || !loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out' }}><KPICard label="Total Appointments" value={appointments.length} sub="All time" color="#0052cc" /></div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.05s both' }}><KPICard label="Upcoming" value={upcomingAppointments.length} sub="Next bookings" color="#00a86b" /></div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.1s both' }}><KPICard label="Total Tickets" value={tickets.length} sub="Support requests" color="#ff9500" /></div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.15s both' }}><KPICard label="Open Tickets" value={openTickets.length} sub="Pending" color="#ef4444" /></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* Upcoming Appointments */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0052cc', marginBottom: '14px', marginTop: 0 }}>📅 Upcoming Appointments</h3>
            {upcomingAppointments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '32px', fontSize: '13px' }}>No upcoming appointments</p>
            ) : (
              <div style={{ maxHeight: '345px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingAppointments.slice(0, 5).map(apt => (
                  <div key={apt.id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', border: '1px solid #e8e8e8', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e8f0ff'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <p style={{ fontWeight: '700', color: '#0052cc', margin: 0 }}>{apt.appointment_date}</p>
                    <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0 0' }}>Service: {apt.service_type || 'General'}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/appointments')}
              style={{ width: '100%', marginTop: '12px', padding: '10px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,204,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
            >
              View All
            </button>
          </div>

          {/* Recent Tickets */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0052cc', marginBottom: '14px', marginTop: 0 }}>🎫 Support Tickets</h3>
            {tickets.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '32px', fontSize: '13px' }}>No tickets created</p>
            ) : (
              <div style={{ maxHeight: '345px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tickets.slice(0, 5).map(ticket => {
                  const statusColor = ticket.status === 'Open' ? '#ef4444' : ticket.status === 'In Progress' ? '#f59e0b' : '#10b981';
                  return (
                    <div key={ticket.id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', border: '1px solid #e8e8e8', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = statusColor + '15'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'translateX(0)'; }} onClick={() => navigate(`/customer-tickets/${ticket.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <p style={{ fontWeight: '700', color: '#0052cc', margin: 0 }}>#{ticket.id}</p>
                        <span style={{ padding: '2px 8px', background: statusColor + '20', color: statusColor, borderRadius: '3px', fontSize: '10px', fontWeight: '700' }}>{ticket.status}</span>
                      </div>
                      <p style={{ color: '#666', margin: 0 }}>{ticket.title}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate('/customer-tickets')}
              style={{ width: '100%', marginTop: '12px', padding: '10px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,204,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}