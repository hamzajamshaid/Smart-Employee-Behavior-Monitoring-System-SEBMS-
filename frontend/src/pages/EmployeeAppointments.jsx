import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function EmployeeAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const token = localStorage.getItem('token');
  const employeeId = localStorage.getItem('employee_id');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [token, employeeId, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/appointments?employee_id=${employeeId}`, { headers });
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filterStatus);

  const upcomingCount = appointments.filter(a => new Date(a.appointment_date) >= new Date()).length;

  const statusColor = (status) => {
    const colors = { 'Pending': '#f59e0b', 'Confirmed': '#0052cc', 'Completed': '#10b981', 'Cancelled': '#ef4444' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>📅 My Appointments</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingCount}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'Pending', 'Confirmed', 'Completed'].map(status => (
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
              {status === 'all' ? `All (${appointments.length})` : `${status} (${appointments.filter(a => a.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div style={cardStyle}>
          {filteredAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>No appointments found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAppointments.map(apt => (
                <div
                  key={apt.id}
                  style={{
                    padding: '16px',
                    border: `2px solid ${statusColor(apt.status)}`,
                    background: statusColor(apt.status) + '05',
                    borderRadius: '8px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)', e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>
                        {apt.appointment_date} at {apt.appointment_time || 'N/A'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                        Customer: {apt.customer_name || 'N/A'}
                      </p>
                    </div>
                    <span style={{ padding: '6px 12px', background: statusColor(apt.status) + '20', color: statusColor(apt.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {apt.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', margin: '0' }}>
                    Service: {apt.service_type || 'General'} | Vehicle: {apt.vehicle_model || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}