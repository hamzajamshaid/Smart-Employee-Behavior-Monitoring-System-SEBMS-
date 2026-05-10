import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import KPICard from '../components/KPICard';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { 'Ahmed Raza': '#0052cc', 'Sara Khan': '#00a86b', 'Bilal Ahmed': '#ff6b35' };
const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' }
];

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0052cc', background: active ? '#0052cc' : '#fff', color: active ? '#fff' : '#0052cc', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s linear' });

const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const employeeId = localStorage.getItem('employee_id');
  const employeeName = localStorage.getItem('name') || 'Employee';
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
      
      setSummary(summaryRes.data);
      setInteractions(interactionsRes.data || []);

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
        .card-hover:hover { box-shadow: 0 8px 24px rgba(0,82,204,0.15); transform: translateY(-2px); }
      `}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>My Performance</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Welcome, {employeeName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#333', fontWeight: '600' }}>Period: <span style={{ color: '#0052cc', fontWeight: '700' }}>{periodLabel}</span></p>
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
                style={{ padding: '6px 10px', border: '1px solid #0052cc', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} 
              />
              <span style={{ color: '#333', fontSize: '12px', fontWeight: '600' }}>to</span>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                style={{ padding: '6px 10px', border: '1px solid #0052cc', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} 
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
              <KPICard label="Your Score" value={`${Math.round(summary.unified_score || 0)}`} sub="out of 100" color="#0052cc" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.05s both' }}>
              <KPICard label="Presence Rate" value={`${Math.round(summary.presence_rate || 0)}%`} sub="target ≥ 90%" color="#00a86b" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.1s both' }}>
              <KPICard label="Avg Response" value={`${(summary.avg_response || 0).toFixed(1)}s`} sub="limit: 15s" color="#ff9500" />
            </div>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out 0.15s both' }}>
              <KPICard label="Feedback" value={`${(summary.feedback || 0).toFixed(1)}★`} sub="out of 5" color="#9333ea" />
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
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0052cc', marginBottom: '14px', marginTop: 0 }}>📈 Your Score Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[50, 100]} fontSize={11} stroke="#ddd" />
                  <Tooltip contentStyle={{ background: '#fff', border: '2px solid #0052cc', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,82,204,0.15)', padding: '8px 12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#333' }} />
                  <Line type="monotone" dataKey={employeeName} stroke="#0052cc" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px' }}>No data available</div>
            )}
          </div>

          {/* Recent Interactions */}
          <div className="card-hover" style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0052cc', marginBottom: '6px', marginTop: 0 }}>📋 Recent Interactions</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Last {interactions.length} interactions</p>
            <div style={{ maxHeight: '345px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#e8f0ff', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid #0052cc' }}>
                    {['Time', 'Present', 'Emotion', 'Voice', 'Response', 'Rating'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Time' ? 'left' : 'center', padding: '10px 8px', color: '#0052cc', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
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
                        style={{ borderBottom: '1px solid #e8f0ff', transition: 'background 0.15s linear', background: idx % 2 === 0 ? '#fafbfc' : '#fff' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#e8f0ff'} 
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fafbfc' : '#fff'}
                      >
                        <td style={{ padding: '10px 8px', color: '#1a1a1a', fontWeight: '600' }}>{i.time || '—'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: i.present ? '#00a86b' : '#e53935', fontWeight: '700', fontSize: '13px' }}>{i.present ? '✓' : '✗'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px' }}>{i.emotion ? `${Math.round(i.emotion)}%` : '—'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: voiceColor(i.voice), fontWeight: '600', fontSize: '11px' }}>{i.voice ? `${Math.round(i.voice)}%` : '—'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px' }}>{i.response ? `${i.response}s` : '—'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#555', fontSize: '11px' }}>{i.feedback ? `${i.feedback}★` : '—'}</td>
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

        {/* Score Components — FIXED */}
        <div className="card-hover" style={cardStyle}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0052cc', marginBottom: '18px', marginTop: 0 }}>📊 Score Components</h3>
          {summary ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
              {[
                { 
                  label: 'Presence', 
                  value: Math.min(100, Math.max(0, summary.presence_rate || 0)), 
                  color: '#00a86b',
                  desc: 'Face detection at counter'
                },
                { 
                  label: 'Emotion', 
                  value: Math.min(100, Math.max(0, summary.emotion_score || 0)), 
                  color: '#0052cc',
                  desc: 'Positive emotion ratio'
                },
                { 
                  label: 'Response', 
                  value: Math.min(100, Math.max(0, 100 - ((summary.avg_response || 15) / 15) * 100)), 
                  color: '#ff9500',
                  desc: 'Speed (≤15s = 100%)'
                },
                { 
                  label: 'Feedback', 
                  value: Math.min(100, Math.max(0, ((summary.feedback || 0) / 5) * 100)), 
                  color: '#9333ea',
                  desc: 'Customer rating'
                },
                { 
                  label: 'Voice', 
                  value: Math.min(100, Math.max(0, summary.voice_score || 0)), 
                  color: '#e53935',
                  desc: 'Tone sentiment'
                }
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>{s.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{Math.round(s.value)}%</span>
                  </div>
                  <div style={{ width: '100%', background: '#f0f0f0', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}dd)`, height: '10px', borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
                  </div>
                  <p style={{ fontSize: '10px', color: '#999', margin: '0', fontWeight: '500' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: '#999' }}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}