import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const blankWeek = () => DAYS.map((_, i) => ({ weekday: i, enabled: false, start: '10:00', end: '18:00', slot_minutes: 30 }));

export default function EmployeeAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAvail, setShowAvail] = useState(false);
  const [week, setWeek] = useState(blankWeek());
  const [blocked, setBlocked] = useState([]);
  const [newBlock, setNewBlock] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);
  const token = sessionStorage.getItem('token');
  const employeeId = sessionStorage.getItem('employee_id');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [token, employeeId, navigate]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [mine, reqs] = await Promise.all([
        axios.get(`${API_BASE}/api/appointments?employee_id=${employeeId}`, { headers }),
        axios.get(`${API_BASE}/api/appointments/requests`, { headers }),
      ]);
      setAppointments(mine.data || []);
      setRequests(reqs.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/appointments/${id}/accept`, {}, { headers });
      alert('✅ Request accepted');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not accept this request');
    }
    fetchAll();
  };

  const openAvailability = async () => {
    setShowAvail(true);
    try {
      const res = await axios.get(`${API_BASE}/api/availability/me`, { headers });
      const next = blankWeek();
      (res.data.weekly || []).forEach(row => {
        next[row.weekday] = { weekday: row.weekday, enabled: true, start: row.start, end: row.end, slot_minutes: row.slot_minutes };
      });
      setWeek(next);
      setBlocked(res.data.blocked_dates || []);
    } catch (err) {
      alert('Could not load your availability');
    }
  };

  const updateDay = (i, patch) => setWeek(w => w.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const addBlocked = () => {
    if (!newBlock || blocked.includes(newBlock)) return;
    setBlocked([...blocked, newBlock].sort());
    setNewBlock('');
  };

  const saveAvailability = async () => {
    const weekly = week
      .filter(d => d.enabled)
      .map(d => ({ weekday: d.weekday, start: d.start, end: d.end, slot_minutes: Number(d.slot_minutes) }));
    setSavingAvail(true);
    try {
      await axios.put(`${API_BASE}/api/availability/me`, { weekly, blocked_dates: blocked }, { headers });
      alert('✅ Availability saved');
      setShowAvail(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not save availability');
    } finally {
      setSavingAvail(false);
    }
  };

  const formatWhen = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

  const filteredAppointments = filterStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const upcomingCount = appointments.filter(a => new Date(a.appointment_date) >= new Date()).length;

  const statusColor = (status) => {
    const colors = { 'Pending': '#f59e0b', 'Confirmed': '#0c2340', 'Completed': '#10b981', 'Cancelled': '#ef4444' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };
  const inputStyle = { padding: '8px 10px', border: '1px solid #cfe0ea', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}><img src="/icons/nav/calendar-days-dark.png" alt="" style={{ width: '30px', height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />My Appointments</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingCount} · Requests: {requests.length}</p>
          </div>
          <button
            onClick={openAvailability}
            style={{ padding: '10px 20px', background: '#0c2340', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            My Availability
          </button>
        </div>
      </div>

      {/* Availability panel */}
      {showAvail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', maxWidth: '560px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0c2340', margin: '0 0 6px 0' }}>My Availability</h3>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>Customers can only book the times you open here.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {week.map((d, i) => (
                <div key={d.weekday} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 90px', gap: '8px', alignItems: 'center', opacity: d.enabled ? 1 : 0.5 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#0c2340', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={d.enabled} onChange={e => updateDay(i, { enabled: e.target.checked })} />
                    {DAYS[i]}
                  </label>
                  <input type="time" value={d.start} disabled={!d.enabled} onChange={e => updateDay(i, { start: e.target.value })} style={inputStyle} />
                  <input type="time" value={d.end} disabled={!d.enabled} onChange={e => updateDay(i, { end: e.target.value })} style={inputStyle} />
                  <select value={d.slot_minutes} disabled={!d.enabled} onChange={e => updateDay(i, { slot_minutes: e.target.value })} style={inputStyle}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>Blocked dates (leave, holidays)</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input type="date" value={newBlock} onChange={e => setNewBlock(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={addBlocked} style={{ padding: '8px 14px', background: '#0c2340', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {blocked.length === 0 && <span style={{ fontSize: '13px', color: '#999' }}>No blocked dates</span>}
                {blocked.map(b => (
                  <span key={b} style={{ padding: '4px 10px', background: '#e8f1f5', borderRadius: '4px', fontSize: '12px', color: '#0c2340', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {b}
                    <button type="button" onClick={() => setBlocked(blocked.filter(x => x !== b))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: '700' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e8e8e8', paddingTop: '16px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowAvail(false)} style={{ padding: '10px 20px', background: '#f0f0f0', color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={saveAvailability} disabled={savingAvail} style={{ padding: '10px 20px', background: savingAvail ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: savingAvail ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>
                {savingAvail ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Requests */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0c2340', marginBottom: '16px' }}>📥 Open Requests</h2>
          {requests.length === 0 ? (
            <div style={cardStyle}>
              <p style={{ textAlign: 'center', color: '#999', padding: '24px', fontSize: '13px', margin: 0 }}>No open requests</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {requests.map(r => (
                <div key={r.id} style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0c2340', margin: '0 0 8px 0' }}>{formatWhen(r.appointment_date)}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Customer:</strong> {r.customer_name || 'N/A'}</p>
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 4px 0' }}><strong>Service:</strong> {r.service_type || 'General'}</p>
                  <button
                    onClick={() => acceptRequest(r.id)}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Accept Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'Pending', 'Confirmed', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 16px',
                background: filterStatus === status ? '#0c2340' : '#fff',
                color: filterStatus === status ? '#fff' : '#0c2340',
                border: `1px solid ${filterStatus === status ? '#0c2340' : '#e8e8e8'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.15s'
              }}
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0c2340', margin: 0 }}>{formatWhen(apt.appointment_date)}</p>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Customer: {apt.customer_name || 'N/A'}</p>
                    </div>
                    <span style={{ padding: '6px 12px', background: statusColor(apt.status) + '20', color: statusColor(apt.status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {apt.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
                    Service: {apt.service_type || 'General'} | Vehicle: {apt.vehicle_model || 'N/A'}
                  </p>
                  {apt.status === 'Confirmed' && (
                    <button onClick={() => navigate(`/meeting/${apt.id}`)} style={{ marginTop: '10px', padding: '8px 14px', background: '#0c2340', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Join meeting</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
