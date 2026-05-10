import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function Attendance() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const employeeId = localStorage.getItem('employee_id');
  const employeeName = localStorage.getItem('name');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
      return;
    }
    fetchAttendance();
  }, [token, employeeId, navigate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/attendance?employee_id=${employeeId}`, { headers });
      setRecords(res.data?.records || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>⏱️ Attendance</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>{employeeName}</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <p style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Present Days</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>{summary.present_days || 0}</p>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Absent Days</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', margin: 0 }}>{summary.absent_days || 0}</p>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Attendance Rate</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0 }}>{summary.attendance_rate || 0}%</p>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} />
            Attendance Records
          </h3>
          
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>No attendance records</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#e8f0ff', borderBottom: '2px solid #0052cc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#0052cc', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#0052cc', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Check In</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#0052cc', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Check Out</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#0052cc', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => {
                    const statusColor = record.status === 'Present' ? '#10b981' : '#ef4444';
                    return (
                      <tr key={record.id} style={{ borderBottom: '1px solid #e8e8e8', background: idx % 2 === 0 ? '#fafbfc' : '#fff' }}>
                        <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>
                          {new Date(record.check_in_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {new Date(record.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 12px', background: statusColor + '20', color: statusColor, borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}