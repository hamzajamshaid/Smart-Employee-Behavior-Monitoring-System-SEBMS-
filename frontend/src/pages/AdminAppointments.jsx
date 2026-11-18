import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

const SERVICES = ['General', 'Technical', 'Maintenance', 'Inspection', 'Repair'];
const emptyForm = { employee_id: '', customer_id: '', date: '', time: '', service_type: 'General', notes: '' };

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestPick, setRequestPick] = useState({});
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const token = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
    fetchEmployees();
    fetchCustomers();
  }, []);

  const fetchAll = async () => {
    try {
      const [all, reqs] = await Promise.all([
        axios.get(`${API_BASE}/api/appointments`, { headers }),
        axios.get(`${API_BASE}/api/appointments/requests`, { headers }),
      ]);
      setAppointments(all.data || []);
      setRequests(reqs.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`, { headers });
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/customers`, { headers });
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers');
    }
  };

  const activeEmployees = employees.filter(e => !e.status || e.status === 'Active');

  const acceptRequest = async (id) => {
    const empId = requestPick[id];
    if (!empId) {
      alert('Choose an employee first');
      return;
    }
    try {
      await axios.patch(`${API_BASE}/api/appointments/${id}/accept`, { employee_id: Number(empId) }, { headers });
      alert('✅ Request accepted');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not accept this request');
    }
    fetchAll();
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/appointments/admin-create`, {
        employee_id: formData.employee_id,
        customer_id: formData.customer_id,
        appointment_date: `${formData.date}T${formData.time}`,
        service_type: formData.service_type,
        description: formData.notes,
      }, { headers });
      alert('✅ Appointment created');
      setFormData(emptyForm);
      setShowCreateForm(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create appointment');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await axios.delete(`${API_BASE}/api/appointments/${id}`, { headers });
      alert('✅ Appointment cancelled');
      fetchAll();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatWhen = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

  const filteredEmployees = employees.filter(e =>
    (e.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmployeeAppointments = (empId) => appointments.filter(a => a.employee_id === empId);

  const upcomingAppointments = appointments.filter(a =>
    a.appointment_date && a.status !== 'Cancelled' && new Date(a.appointment_date) >= new Date()
  );

  const statusColor = (status) => {
    const colors = { 'Pending': '#f59e0b', 'Confirmed': '#0c2340', 'Completed': '#10b981', 'Cancelled': '#ef4444' };
    return colors[status] || '#6b7280';
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };
  const fieldStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' };
  const badge = (status) => ({ padding: '4px 10px', background: statusColor(status) + '20', color: statusColor(status), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' });

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}><img src="/icons/nav/calendar-days-dark.png" alt="" style={{ width: '30px', height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />Appointments</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingAppointments.length} · Open requests: {requests.length}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2E4057 0%, #4a6fa5 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Plus size={16} />
              New Appointment
            </button>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '13px', boxShadow: '0 1px 3px rgba(12,35,64,0.1)', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0c2340' }} />

              {showDropdown && filteredEmployees.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #0c2340', borderTop: 'none', borderRadius: '0 0 6px 6px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(12,35,64,0.15)', marginTop: '2px' }}>
                  <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: !selectedEmployee ? '#e8f1f5' : 'transparent', fontWeight: !selectedEmployee ? '600' : '500' }} onClick={() => { setSelectedEmployee(null); setSearchQuery(''); setShowDropdown(false); }}>All Employees</div>
                  {filteredEmployees.map(e => (
                    <div key={e.id} onClick={() => { setSelectedEmployee(e.id); setSearchQuery(''); setShowDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: selectedEmployee === e.id ? '#e8f1f5' : 'transparent', borderLeft: selectedEmployee === e.id ? '3px solid #0c2340' : '3px solid transparent', fontWeight: selectedEmployee === e.id ? '600' : '500' }}>
                      {e.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0c2340', marginBottom: '16px', marginTop: 0 }}>Create Appointment</h3>
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Employee *</label>
                <select value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} style={fieldStyle} required>
                  <option value="">Select Employee</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Customer *</label>
                <select value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} style={fieldStyle} required>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={fieldStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Time *</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} style={fieldStyle} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Service Type</label>
                <select value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} style={fieldStyle}>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...fieldStyle, minHeight: '80px', resize: 'none' }} placeholder="Add notes..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: '10px 20px', background: '#f0f0f0', color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2E4057 0%, #4a6fa5 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Open requests */}
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
                  <p style={{ fontSize: '13px', color: '#333', margin: '0 0 10px 0' }}><strong>Service:</strong> {r.service_type || 'General'}</p>
                  <select
                    value={requestPick[r.id] || ''}
                    onChange={e => setRequestPick({ ...requestPick, [r.id]: e.target.value })}
                    style={fieldStyle}
                  >
                    <option value="">Assign to employee</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <button
                    onClick={() => acceptRequest(r.id)}
                    style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Accept Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedEmployee ? (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0c2340', margin: '0 0 16px 0' }}>
              {employees.find(e => e.id === selectedEmployee)?.name}
            </h2>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {getEmployeeAppointments(selectedEmployee).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '32px' }}>No appointments</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getEmployeeAppointments(selectedEmployee).map(apt => (
                    <div key={apt.id} style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0c2340', margin: 0 }}>{formatWhen(apt.appointment_date)}</p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>{apt.customer_name} · {apt.description || 'No notes'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={badge(apt.status)}>{apt.status}</span>
                        {apt.status !== 'Cancelled' && (
                          <button onClick={() => handleDeleteAppointment(apt.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Cancel</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            {employees.map(emp => {
              const empApts = getEmployeeAppointments(emp.id);
              const upcomingCount = empApts.filter(a => a.status !== 'Cancelled' && new Date(a.appointment_date) >= new Date()).length;
              return (
                <div key={emp.id} style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0c2340', marginBottom: '12px', marginTop: 0 }}>
                    {emp.name}
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginLeft: '8px' }}>({upcomingCount} upcoming)</span>
                  </h3>
                  <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: '6px', paddingRight: '8px' }}>
                    {empApts.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '24px' }}>No appointments</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                        {empApts.map(apt => (
                          <div key={apt.id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', border: '1px solid #e8e8e8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', color: '#0c2340' }}>{formatWhen(apt.appointment_date)}</span>
                              <span style={badge(apt.status)}>{apt.status}</span>
                            </div>
                            <p style={{ color: '#333', margin: '0 0 4px 0', fontWeight: '500' }}>{apt.customer_name}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#999', fontSize: '11px' }}>{(apt.description || 'No notes').substring(0, 30)}</span>
                              {apt.status !== 'Cancelled' && (
                                <button onClick={() => handleDeleteAppointment(apt.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>Cancel</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
