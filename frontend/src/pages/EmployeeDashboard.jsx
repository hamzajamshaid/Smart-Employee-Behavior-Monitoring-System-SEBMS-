import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import KPICard from '../components/KPICard';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { 'Ahmed Raza': '#0c2340', 'Sara Khan': '#00a86b', 'Bilal Ahmed': '#ff6b35' };
const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' }
];

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0c2340', background: active ? '#0c2340' : '#fff', color: active ? '#fff' : '#0c2340', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s linear' });

const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };


const STATUS_STYLE = {
  scored: ['#00a86b', 'Scored'],
  insufficient_signals: ['#ff9500', 'Insufficient'],
  no_presence: ['#6b7280', 'No person'],
  detector_miss: ['#7c3aed', 'Detector miss'],
  failed: ['#e53935', 'Failed'],
  not_processed: ['#999', 'Not processed'],
  in_progress: ['#0c2340', 'In progress'],
  legacy: ['#999', 'Legacy'],
};
const statusBadge = s => {
  const [c, l] = STATUS_STYLE[s] || ['#999', s || '—'];
  return <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: '700', color: c, border: `1px solid ${c}`, borderRadius: '4px', padding: '1px 6px' }}>{l}</span>;
};
const clampOrNull = v => (v == null ? null : Math.min(100, Math.max(0, v)));
const fmtNum = v => (v == null ? '—' : Math.round(v));
const fmtPct = v => (v == null ? '—' : `${Math.round(v)}%`);
const fmtSec = v => (v == null ? '—' : `${Number(v).toFixed(1)}s`);
const fmtStars = v => (v == null ? '—' : `${Number(v).toFixed(1)}★`);
const mapSummary = d => (d ? {
  total_interactions: d.total_interactions,
  insufficient_signal_count: d.insufficient_signal_count,
  unified_score: d.avg_unified_score,
  presence_rate: d.avg_presence,
  emotion_score: d.avg_emotion,
  voice_score: d.avg_voice,
  avg_response: d.avg_response,
  feedback: d.avg_feedback,
} : { error: true });
const mapInteraction = r => ({
  ...r,
  time: r.start_timestamp ? new Date(r.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
  present: null, // no validated presence threshold yet
  emotion: r.emotion_score,
  voice: r.voice_score,
  response: r.response_seconds,
  feedback: r.feedback ?? null,
  status: r.processing_status,
});

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');
  const employeeId = sessionStorage.getItem('employee_id');
  const employeeName = sessionStorage.getItem('name') || 'Employee';
  const headers = { Authorization: `Bearer ${token}` };

  const periodLabel = period === 'custom' ? `${dateFrom} to ${dateTo}` : PERIODS.find(p => p.value === period)?.label || 'This Month';

  const buildParams = () => {
    let p = period === 'custom' ? '' : `period=${period}`;
    if (period === 'custom' && dateFrom && dateTo) p = `date_from=${dateFrom}&date_to=${dateTo}`;
    return p ? `?${p}` : '';
  };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, employeeId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = buildParams();
      
      const [summaryRes, interactionsRes, trendRes] = await Promise.all([
        axios.get(`${API_BASE}/api/dashboard/summary${params}&employee_id=${employeeId}`, { headers }).catch(() => ({})),
        axios.get(`${API_BASE}/api/dashboard/interactions${params}&employee_id=${employeeId}`, { headers }).catch(() => ({})),
        axios.get(`${API_BASE}/api/dashboard/trend${params}&employee_id=${employeeId}`, { headers }).catch(() => ({}))
      ]);

      console.log('📊 Employee Summary:', summaryRes.data);
      console.log('📋 Employee Interactions:', interactionsRes.data);
      
      setSummary(mapSummary(summaryRes.data));
      setInteractions((Array.isArray(interactionsRes.data) ? interactionsRes.data : []).map(mapInteraction));

      const raw = trendRes.data || {};
      const names = Object.keys(raw);
      if (names.length > 0) {
        const days = raw[names[0]].map(d => d.date);
        const merged = days.map((date, i) => {
          const obj = { date };
          names.forEach(name => { obj[name] = raw[name][i]?.score; });
          return obj;
        });
        setTrendData(merged);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setSummary({ unified_score: 0, presence_rate: 0, avg_response: 0, feedback: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, dateFrom, dateTo]);

  const voiceColor = (v) => !v ? '#bbb' : v >= 80 ? '#00a86b' : v >= 65 ? '#ff9500' : '#e53935';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .card-hover { transition: all 0.2s linear; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(12,35,64,0.15); transform: translateY(-2px); }
      `}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}>My Performance</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Welcome, {employeeName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#333', fontWeight: '600' }}>Period: <span style={{ color: '#0c2340', fontWeight: '700' }}>{periodLabel}</span></p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#333', fontWeight: '700' }}>Period:</span>
          {PERIODS.map(p => (<button key={p.value} onClick={() => setPeriod(p.value)} style={btnStyle(period === p.value)}>{p.label}</button>))}
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                style={{ padding: '6px 10px', border: '1px solid #0c2340', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} 
              />
              <span style={{ color: '#333', fontSize: '12px', fontWeight: '600' }}>to</span>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                style={{ padding: '6px 10px', border: '1px solid #0c2340', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 30px' }}>
        {/* Alerts */}
        {summary?.alerts?.map(a => (
          <div 
            key={a.id} 
            style={{ background: '#fff8e1', border: '1px solid #ffe082', borderLeft: '4px solid #ffc107', color: '#856404', padding: '12px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span>⚠</span>
            <span>{a.message}</span>
          </div>
        ))}

        {/* KPI Cards */}
        {summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <KPICard label="Your Score" value={`${fmtNum(summary.unified_score)}`} sub="out of 100" color="#0c2340" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.05s both' }}>
              <KPICard label="Avg presence score" value={`${fmtNum(summary.presence_rate)}`} sub="average of measured presence scores" color="#00a86b" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.1s both' }}>
              <KPICard label="Avg Response" value={`${fmtSec(summary.avg_response)}`} sub="limit: 15s" color="#ff9500" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.15s both' }}>
              <KPICard label="Feedback" value={`${fmtStars(summary.feedback)}`} sub="out of 5" color="#9333ea" />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ background: '#e8e8e8', borderRadius: '10px', height: '120px' }} />)}
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* Score Trend */}
          <div className="card-hover" style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '14px', marginTop: 0 }}>📈 Your Score Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[50, 100]} fontSize={11} stroke="#ddd" />
                  <Tooltip contentStyle={{ background: '#fff', border: '2px solid #0c2340', borderRadius: '6px', boxShadow: '0 2px 8px rgba(12,35,64,0.15)', padding: '8px 12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#333' }} />
                  <Line type="linear" dataKey={employeeName} stroke="#0c2340" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px' }}>No data available</div>
            )}
          </div>

          {/* Recent Interactions */}
          <div className="card-hover" style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '6px', marginTop: 0 }}>📋 Recent Interactions</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Last {interactions.length} interactions</p>
            <div style={{ maxHeight: '345px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#e8f1f5', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid #0c2340' }}>
                    {['Time', 'Presence score', 'Expression (exp.)', 'Voice (exp.)', 'Response', 'Rating'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Time' ? 'left' : 'center', padding: '10px 8px', color: '#0c2340', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interactions.length > 0 ? (
                    interactions.map((i, idx) => (
                      <tr 
                        key={i.id} 
                        style={{ borderBottom: '1px solid #e8f1f5', transition: 'background 0.15s linear', background: idx % 2 === 0 ? '#fafbfc' : '#fff' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#e8f1f5'} 
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fafbfc' : '#fff'}
                      >
                        <td style={{ padding: '10px 8px', color: '#1a1a1a', fontWeight: '600' }}>{i.time || '—'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#1a1a1a', fontWeight: '700', fontSize: '13px' }}>{fmtNum(i.presence_score)}<br />{statusBadge(i.status)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px' }}>{fmtPct(i.emotion)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: voiceColor(i.voice), fontWeight: '600', fontSize: '11px' }}>{fmtPct(i.voice)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px' }}>{fmtSec(i.response)}</td>
                        <td onClick={() => i.feedback && window.alert('Rating: ' + i.feedback + ' star(s)\n\n' + (i.comment || 'No comment'))} style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px', cursor: i.feedback ? 'pointer' : 'default', textDecoration: i.feedback ? 'underline' : 'none' }}>{i.feedback ? `${i.feedback}★` : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No interactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}