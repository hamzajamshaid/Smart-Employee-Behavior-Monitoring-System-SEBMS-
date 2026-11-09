import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const cell = { padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 14, textAlign: 'left' };
const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

export default function CounterWorkflow() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/counter/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      setRows(res.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Counter Workflow</h2>
        <button onClick={load} disabled={loading} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#0052cc', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {error && <p style={{ color: '#d9480f' }}>{error}</p>}
      <div style={{ background: '#fff', borderRadius: 10, overflowX: 'auto', border: '1px solid #e8e8e8' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Session', 'Employee', 'Start', 'Arrival', 'Employee responded', 'Response (s)', 'Status', 'End', 'Video'].map((h) => (
                <th key={h} style={{ ...cell, fontWeight: 600, background: '#f7f9fc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.interaction_id}>
                <td style={cell}>#{r.interaction_id}</td>
                <td style={cell}>{r.employee_name || '—'}</td>
                <td style={cell}>{fmt(r.start)}</td>
                <td style={cell}>{fmt(r.arrival_at)}</td>
                <td style={cell}>{fmt(r.response_at)}</td>
                <td style={cell}>{r.response_seconds ?? '—'}</td>
                <td style={cell}>{r.response_status || '—'}</td>
                <td style={cell}>{fmt(r.end)}</td>
                <td style={cell}>{r.has_video ? '✓' : '✗'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td style={cell} colSpan={9}>No counter sessions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
