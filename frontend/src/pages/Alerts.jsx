import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

const LOW = '#ef4444';
const GREEN = '#16a34a';
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Last 1 day' },
  { value: '2', label: 'Last 2 days' },
  { value: '3', label: 'Last 3 days' },
  { value: '4', label: 'Last 4 days' },
  { value: '5', label: 'Last 5 days' },
  { value: '6', label: 'Last 6 days' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const fmt = (v) => (v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const weekStart = (d) => {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

const withinDate = (a, filter) => {
  if (filter === 'all') return true;
  if (!a.triggered_at) return false;
  const t = new Date(a.triggered_at);
  const now = new Date();
  if (filter === 'week') return t >= weekStart(now);
  if (filter === 'month') return t >= new Date(now.getFullYear(), now.getMonth(), 1);
  const days = filter === 'today' ? 1 : Number(filter);
  return t >= new Date(now.getTime() - days * DAY_MS);
};

const bucketStart = (d, mode) => (mode === 'week' ? weekStart(d) : new Date(d.getFullYear(), d.getMonth(), d.getDate()));

const bucketLabel = (d, mode) => (mode === 'week'
  ? `Week of ${weekStart(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));

const inputStyle = { padding: '8px 10px', border: '1px solid #cfd8e3', borderRadius: '6px', fontSize: '13px', background: '#fff', minWidth: '150px' };
const filterBox = { display: 'flex', flexDirection: 'column', gap: '4px' };
const filterLabel = { fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' };

const Field = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>{value}</div>
  </div>
);

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('low');
  const [explain, setExplain] = useState({});
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const groupMode = 'day';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAlerts();
  }, [token, navigate]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/alerts`, { headers });
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await axios.put(`${API_BASE}/api/alerts/${alertId}/resolve`, {}, { headers });
      alert('✅ Alert resolved');
      fetchAlerts();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed to resolve alert'));
    }
  };

  const loadExplanation = async (alertId) => {
    setExplain(prev => ({ ...prev, [alertId]: { loading: true } }));
    try {
      const res = await axios.get(`${API_BASE}/api/alerts/${alertId}/explain`, { headers });
      setExplain(prev => ({ ...prev, [alertId]: { data: res.data } }));
    } catch (err) {
      setExplain(prev => ({ ...prev, [alertId]: { error: err.response?.data?.error || 'Could not generate explanation' } }));
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  const accent = tab === 'low' ? LOW : GREEN;
  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' };
  const tabStyle = (active, color) => ({ padding: '8px 16px', background: active ? color : '#fff', color: active ? '#fff' : color, border: `1px solid ${active ? color : '#e8e8e8'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' });

  const lowAlerts = alerts.filter(a => a.alert_type === 'Low Score' && !a.is_resolved);
  const resolvedAlerts = alerts.filter(a => a.is_resolved);
  const tabAlerts = tab === 'low' ? lowAlerts : resolvedAlerts;
  const employees = Object.values(alerts.reduce((acc, a) => {
    if (a.employee_id != null) acc[a.employee_id] = { id: String(a.employee_id), name: a.employee_name || 'Unknown employee' };
    return acc;
  }, {})).sort((x, y) => x.name.localeCompare(y.name));
  const q = search.trim().replace('#', '').toLowerCase();

  const filtered = tabAlerts
    .filter(a =>
      withinDate(a, dateFilter) &&
      (employeeFilter === 'all' || String(a.employee_id) === employeeFilter) &&
      (!q ||
        String(a.id).includes(q) ||
        (a.employee_name || '').toLowerCase().includes(q) ||
        (a.customer_name || '').toLowerCase().includes(q) ||
        (a.message || '').toLowerCase().includes(q)))
    .sort((x, y) => new Date(y.triggered_at) - new Date(x.triggered_at));

  const groups = [];
  const byKey = {};
  filtered.forEach(a => {
    const d = new Date(a.triggered_at);
    const k = bucketStart(d, groupMode).getTime();
    if (!byKey[k]) {
      byKey[k] = { label: bucketLabel(d, groupMode), items: [] };
      groups.push(byKey[k]);
    }
    byKey[k].items.push(a);
  });

  const renderCard = (a) => {
    const ex = explain[a.id] || {};
    return (
      <div key={a.id} style={{ padding: '14px 16px', background: accent + '10', border: `2px solid ${accent}`, borderRadius: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', background: '#0052cc', borderRadius: '4px', padding: '3px 8px', marginTop: '2px' }}>#{a.id}</span>
            <Field label="Employee" value={a.employee_name || 'Unknown employee'} />
            <Field label="Customer" value={a.customer_name} />
            <Field label="Session" value={`${a.session_id ?? '—'} · ${fmt(a.session_at)}`} />
            <Field label="Triggered" value={fmt(a.triggered_at)} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => loadExplanation(a.id)} disabled={ex.loading} style={{ padding: '7px 12px', background: '#fff', color: '#0052cc', border: '1px solid #0052cc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              {ex.loading ? 'Generating…' : 'Explain (AI)'}
            </button>
            {!a.is_resolved && (
              <button onClick={() => handleResolve(a.id)} style={{ padding: '7px 14px', background: LOW, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Resolve
              </button>
            )}
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#333', margin: '10px 0 0 0' }}>{a.message}</p>
        {a.is_resolved && <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>Resolved {fmt(a.resolved_at)}</p>}
        {ex.error && <p style={{ fontSize: '12px', color: '#b91c1c', margin: '10px 0 0 0' }}>{ex.error}</p>}
        {ex.data && (
          <div style={{ marginTop: '10px', background: '#fff', borderRadius: '6px', padding: '10px 12px' }}>
            <p style={{ fontSize: '12px', color: '#555', margin: '0 0 6px 0' }}>
              Unified score: <b>{ex.data.unified_score ?? '—'}</b>
            </p>
            <p style={{ fontSize: '12px', color: '#555', margin: '0 0 6px 0' }}>
              {ex.data.components.map(c => (c.score == null
                ? `${c.name}: ${c.note}`
                : `${c.name} ${c.score} → ${c.points} of ${c.weight_pct} pts`)).join(' · ')}
            </p>
            {ex.data.lines.map((line, i) => (
              <p key={i} style={{ fontSize: '13px', color: '#333', margin: '4px 0' }}>• {line}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>🚨 Alerts</h1>
        <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Low unified score: {lowAlerts.length} · Resolved: {resolvedAlerts.length}</p>
      </div>

      <div style={{ padding: '24px 30px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('low')} style={tabStyle(tab === 'low', LOW)}>Low Unified Score ({lowAlerts.length})</button>
          <button onClick={() => setTab('resolved')} style={tabStyle(tab === 'resolved', GREEN)}>Resolved ({resolvedAlerts.length})</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ ...filterBox, flex: 1, minWidth: '240px' }}>
            <span style={filterLabel}>Search</span>
            <input type="text" placeholder="ID, employee, customer or message" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: '0', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={filterBox}>
            <span style={filterLabel}>Date</span>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={inputStyle}>
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={filterBox}>
            <span style={filterLabel}>Employee</span>
            <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} style={inputStyle}>
              <option value="all">All employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div style={cardStyle}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
            Showing {filtered.length} of {tabAlerts.length} alerts
          </p>
          <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '6px' }}>
            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>No alerts found</p>
              </div>
            ) : groups.map(g => (
              <div key={g.label} style={{ marginBottom: '18px' }}>
                <h4 style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, fontSize: '13px', color: '#333', margin: '0 0 8px 0', padding: '6px 0', borderBottom: '1px solid #e8e8e8' }}>
                  {g.label} · {g.items.length}
                </h4>
                {g.items.map(renderCard)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
