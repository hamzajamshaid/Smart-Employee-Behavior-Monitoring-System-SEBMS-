import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

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

const fmt = (v) => (v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const weekStart = (d) => {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

const withinDate = (f, filter) => {
  if (filter === 'all') return true;
  if (!f.created_at) return false;
  const t = new Date(f.created_at);
  const now = new Date();
  if (filter === 'week') return t >= weekStart(now);
  if (filter === 'month') return t >= new Date(now.getFullYear(), now.getMonth(), 1);
  const days = filter === 'today' ? 1 : Number(filter);
  return t >= new Date(now.getTime() - days * DAY_MS);
};

const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const getRatingColor = (rating) => (rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444');

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${active ? '#0c2340' : '#e8e8e8'}`, background: active ? '#0c2340' : '#fff', color: active ? '#fff' : '#0c2340', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s' });
const inputStyle = { padding: '8px 10px', border: '1px solid #cfd8e3', borderRadius: '6px', fontSize: '13px', background: '#fff', minWidth: '150px' };
const filterBox = { display: 'flex', flexDirection: 'column', gap: '4px' };
const filterLabel = { fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' };

const Field = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>{value}</div>
  </div>
);

export default function Feedback() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${API_BASE}/api/feedback`, { headers })
      .then(res => setFeedbackList(res.data || []))
      .catch(err => console.error('Failed to fetch feedback:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  const avgRating = feedbackList.length > 0 ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1) : 0;
  const employees = [...new Set(feedbackList.map(f => f.employee_name).filter(Boolean))].sort();
  const q = search.trim().replace('#', '').toLowerCase();

  const filtered = feedbackList
    .filter(f =>
      (filterRating === 'all' || f.rating === Number(filterRating)) &&
      withinDate(f, dateFilter) &&
      (employeeFilter === 'all' || f.employee_name === employeeFilter) &&
      (!q ||
        String(f.id).includes(q) ||
        (f.customer_name || '').toLowerCase().includes(q) ||
        (f.employee_name || '').toLowerCase().includes(q) ||
        (f.comment || '').toLowerCase().includes(q)))
    .sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));

  const groups = [];
  const byKey = {};
  filtered.forEach(f => {
    const hasDate = !!f.created_at;
    const d = hasDate ? new Date(f.created_at) : null;
    const k = hasDate ? dayStart(d).getTime() : 'none';
    if (!byKey[k]) {
      byKey[k] = {
        label: hasDate ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date',
        items: [],
      };
      groups.push(byKey[k]);
    }
    byKey[k].items.push(f);
  });

  const renderCard = (f) => {
    const color = getRatingColor(f.rating);
    return (
      <div key={f.id} style={{ padding: '14px 16px', background: color + '10', border: `2px solid ${color}`, borderRadius: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', background: '#0c2340', borderRadius: '4px', padding: '3px 8px', marginTop: '2px' }}>#{f.id}</span>
            <Field label="Customer" value={f.customer_name || 'Anonymous'} />
            <Field label="Employee" value={f.employee_name || 'Unknown'} />
            <Field label="Session" value={f.interaction_id ?? '—'} />
            <Field label="Date" value={fmt(f.created_at)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} color={color} fill={i < f.rating ? color : '#e0e0e0'} />
            ))}
            <span style={{ fontSize: '13px', fontWeight: '700', color, marginLeft: '4px' }}>{f.rating}.0</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#333', margin: '10px 0 0 0', lineHeight: '1.6', fontStyle: 'italic' }}>"{f.comment || f.message || 'No comment'}"</p>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}><img src="/icons/nav/message-square-dark.png" alt="" style={{ width: '30px', height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />Feedback</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Customer reviews and ratings</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Average Rating</p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: getRatingColor(avgRating), margin: 0 }}>{avgRating}★</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 30px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterRating('all')} style={btnStyle(filterRating === 'all')}>All ({feedbackList.length})</button>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = feedbackList.filter(f => f.rating === rating).length;
            return <button key={rating} onClick={() => setFilterRating(rating.toString())} style={btnStyle(filterRating === rating.toString())}>{rating}★ ({count})</button>;
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ ...filterBox, flex: 1, minWidth: '240px' }}>
            <span style={filterLabel}>Search</span>
            <input type="text" placeholder="ID, customer, employee or comment" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: '0', width: '100%', boxSizing: 'border-box' }} />
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
              {employees.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
            Showing {filtered.length} of {feedbackList.length} feedback
          </p>
          <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '6px' }}>
            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>No feedback found</p>
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
