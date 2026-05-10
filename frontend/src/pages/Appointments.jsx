import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ appointment_date: '', service_type: 'General' });
  const token = localStorage.getItem('token');
  const customerId = localStorage.getItem('customer_id');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !customerId) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [token, customerId, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/appointments?customer_id=${customerId}`, { headers });
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/appointments`, {
        ...formData,
        customer_id: customerId
      }, { headers });
      alert('✅ Appointment booked successfully');
      setFormData({ appointment_date: '', service_type: 'General' });
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const upcomingAppointments = appointments.filter(a => new Date(a.appointment_date) >= new Date());
  const pastAppointments = appointments.filter(a => new Date(a.appointment_date) < new Date());

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
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingAppointments.length}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            <Plus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '16px', marginTop: 0 }}>Book an Appointment</h3>
            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date</label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Service Type</label>
                <select
                  value={formData.service_type}
                  onChange={e => setFormData({...formData, service_type: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e8e8e8', paddingTop: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f0f0f0', color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Upcoming */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0052cc', marginBottom: '16px' }}>📍 Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <div style={cardStyle}>
              <p style={{ textAlign: 'center', color: '#999', padding: '32px', fontSize: '13px', margin: 0 }}>No upcoming appointments</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {upcomingAppointments.map(apt => (
                <div key={apt.id} style={cardStyle}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: '0 0 8px 0' }}>📅 {apt.appointment_date}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Service:</strong> {apt.service_type || 'General'}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Vehicle:</strong> {apt.vehicle_model || 'N/A'}</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e8e8' }}>
                    <span style={{ padding: '4px 12px', background: statusColor(apt.status) + '20', color: statusColor(apt.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0052cc', marginBottom: '16px' }}>📋 Past Appointments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {pastAppointments.map(apt => (
                <div key={apt.id} style={{ ...cardStyle, opacity: 0.7 }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#666', margin: '0 0 8px 0' }}>📅 {apt.appointment_date}</p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}><strong>Service:</strong> {apt.service_type || 'General'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e8e8' }}>
                    <span style={{ padding: '4px 12px', background: '#e5e7eb', color: '#6b7280', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}