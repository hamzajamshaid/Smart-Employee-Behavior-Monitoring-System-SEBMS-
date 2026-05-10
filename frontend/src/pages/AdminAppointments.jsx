import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    customer_id: '',
    date: '',
    time: '',
    duration: '30',
    notes: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAppointments();
    fetchEmployees();
    fetchCustomers();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/appointments`, { headers });
      setAppointments(res.data || []);
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

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/appointments`, {
        ...formData,
        notify_employee: true,
        notify_customer: true
      }, { headers });
      alert('✅ Appointment created & notifications sent');
      setFormData({ employee_id: '', customer_id: '', date: '', time: '', duration: '30', notes: '' });
      setShowCreateForm(false);
      fetchAppointments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await axios.delete(`${API_BASE}/api/appointments/${id}`, { headers });
      alert('✅ Deleted');
      fetchAppointments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmployeeAppointments = (empId) => 
    appointments.filter(a => a.employee_id === empId);

  const upcomingAppointments = appointments.filter(a => {
    const aptDate = new Date(a.date);
    return aptDate >= new Date();
  });

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };
  const durationBadge = (minutes) => {
    const colors = { '15': '#3b82f6', '30': '#0052cc', '60': '#7c3aed', '90': '#ec4899' };
    return { background: colors[minutes] + '20', color: colors[minutes], padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' };
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>📅 Appointments</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Upcoming: {upcomingAppointments.length}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2E4057 0%, #4a6fa5 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 64, 87, 0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
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
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #0052cc', borderRadius: '6px', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,82,204,0.1)', background: '#fff', color: '#1a1a1a' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0052cc' }} />
              
              {showDropdown && filteredEmployees.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #0052cc', borderTop: 'none', borderRadius: '0 0 6px 6px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,82,204,0.15)', marginTop: '2px' }}>
                  <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: !selectedEmployee ? '#e8f0ff' : 'transparent', fontWeight: !selectedEmployee ? '600' : '500' }} onClick={() => { setSelectedEmployee(null); setSearchQuery(''); setShowDropdown(false); }}>All Employees</div>
                  {filteredEmployees.map(e => (
                    <div key={e.id} onClick={() => { setSelectedEmployee(e.id); setSearchQuery(''); setShowDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: selectedEmployee === e.id ? '#e8f0ff' : 'transparent', borderLeft: selectedEmployee === e.id ? '3px solid #0052cc' : '3px solid transparent', fontWeight: selectedEmployee === e.id ? '600' : '500' }}>
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
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '16px', marginTop: 0 }}>Create Appointment</h3>
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Employee *</label>
                <select value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff' }} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Customer *</label>
                <select value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff' }} required>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Time *</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff' }} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Duration (minutes)</label>
                <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff' }}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff', minHeight: '80px', resize: 'none' }} placeholder="Add notes..." />
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
        {selectedEmployee ? (
          // Single Employee View
          <div style={cardStyle}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0052cc', margin: '0 0 16px 0' }}>
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
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0052cc', margin: 0 }}>{apt.date} at {apt.time}</p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>{apt.notes || 'No notes'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={durationBadge(apt.duration)}>{apt.duration}m</span>
                        <button onClick={() => handleDeleteAppointment(apt.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // All Employees View
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            {employees.map(emp => {
              const empApts = getEmployeeAppointments(emp.id);
              const upcomingCount = empApts.filter(a => new Date(a.date) >= new Date()).length;
              return (
                <div key={emp.id} style={cardStyle}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0052cc', marginBottom: '12px', marginTop: 0 }}>
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
                              <span style={{ fontWeight: '700', color: '#0052cc' }}>{apt.date}</span>
                              <span style={durationBadge(apt.duration)}>{apt.duration}m</span>
                            </div>
                            <p style={{ color: '#333', margin: '0 0 4px 0', fontWeight: '500' }}>{apt.time}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#999', fontSize: '11px' }}>{apt.notes?.substring(0, 30) || 'No notes'}</span>
                              <button onClick={() => handleDeleteAppointment(apt.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>Delete</button>
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