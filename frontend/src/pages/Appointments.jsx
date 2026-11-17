import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

const SERVICES = ['General', 'Technical', 'Maintenance', 'Inspection', 'Repair'];

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openDays, setOpenDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [serviceType, setServiceType] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const token = sessionStorage.getItem('token');
  const customerId = sessionStorage.getItem('customer_id');
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

  const openBookingModal = async () => {
    setSelectedDay('');
    setSlots([]);
    setSelectedSlot('');
    setServiceType('General');
    setShowModal(true);
    try {
      const res = await axios.get(`${API_BASE}/api/availability/open-days?days=30`, { headers });
      setOpenDays(res.data.days || []);
    } catch (err) {
      setOpenDays([]);
    }
  };

  const pickDay = async (day) => {
    setSelectedDay(day);
    setSelectedSlot('');
    try {
      const res = await axios.get(`${API_BASE}/api/availability/slots?date=${day}`, { headers });
      setSlots(res.data.slots || []);
    } catch (err) {
      setSlots([]);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/appointments`, {
        appointment_date: selectedSlot,
        service_type: serviceType,
      }, { headers });
      alert('✅ Request sent. Staff will confirm your appointment.');
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not book this slot. Please try again.');
      if (selectedDay) pickDay(selectedDay);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const formatSlot = (s) => s.slice(11, 16);
  const formatWhen = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

  const upcomingAppointments = appointments.filter(a => new Date(a.appointment_date) >= new Date());
  const pastAppointments = appointments.filter(a => new Date(a.appointment_date) < new Date());

  const statusColor = (status) => {
    const colors = { 'Pending': '#f59e0b', 'Confirmed': '#0c2340', 'Completed': '#10b981', 'Cancelled': '#ef4444' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };
  const chipStyle = (selected) => ({
    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
    border: `1px solid ${selected ? '#0c2340' : '#cfe0ea'}`,
    background: selected ? '#0c2340' : '#fff', color: selected ? '#fff' : '#0c2340',
  });
  const label = { fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}><img src="/icons/nav/calendar-days-dark.png" alt="" style={{ width: '30px', height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />My Appointments</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingAppointments.length}</p>
          </div>
          <button
            onClick={openBookingModal}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            <Plus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Booking modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0c2340', marginBottom: '16px', marginTop: 0 }}>Book an Appointment</h3>
            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={label}>1. Choose a day</span>
                {openDays.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>No open days yet. Staff have not set their availability.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {openDays.map(day => (
                      <button key={day} type="button" onClick={() => pickDay(day)} style={chipStyle(selectedDay === day)}>
                        {formatDay(day)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDay && (
                <div>
                  <span style={label}>2. Choose a time</span>
                  {slots.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>No free times on this day. Please pick another day.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {slots.map(s => (
                        <button key={s} type="button" onClick={() => setSelectedSlot(s)} style={chipStyle(selectedSlot === s)}>
                          {formatSlot(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={label}>Service Type</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f0f0f0', color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
                <button type="submit" disabled={!selectedSlot || submitting} style={{ padding: '10px 20px', background: !selectedSlot || submitting ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: !selectedSlot || submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0c2340', marginBottom: '16px' }}>📍 Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <div style={cardStyle}>
              <p style={{ textAlign: 'center', color: '#999', padding: '32px', fontSize: '13px', margin: 0 }}>No upcoming appointments</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {upcomingAppointments.map(apt => (
                <div key={apt.id} style={cardStyle}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0c2340', margin: '0 0 8px 0' }}>📅 {formatWhen(apt.appointment_date)}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Service:</strong> {apt.service_type || 'General'}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Staff:</strong> {apt.employee_name || 'Awaiting assignment'}</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e8e8' }}>
                    <span style={{ padding: '4px 12px', background: statusColor(apt.status) + '20', color: statusColor(apt.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {apt.status === 'Pending' ? 'Awaiting confirmation' : apt.status}
                    </span>
                    {apt.status === 'Confirmed' && (
                      <button onClick={() => navigate(`/meeting/${apt.id}`)} style={{ padding: '6px 14px', background: '#0c2340', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Join meeting</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pastAppointments.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0c2340', marginBottom: '16px' }}>📋 Past Appointments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {pastAppointments.map(apt => (
                <div key={apt.id} style={{ ...cardStyle, opacity: 0.7 }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#666', margin: '0 0 8px 0' }}>📅 {formatWhen(apt.appointment_date)}</p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}><strong>Service:</strong> {apt.service_type || 'General'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e8e8' }}>
                    <span style={{ padding: '4px 12px', background: statusColor(apt.status) + '20', color: statusColor(apt.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {apt.status}
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
