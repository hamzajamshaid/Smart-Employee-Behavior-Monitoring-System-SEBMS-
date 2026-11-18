import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { 'Ahmed Raza': '#0c2340', 'Sara Khan': '#00a86b', 'Bilal Ahmed': '#ff6b35' };
const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${active ? '#0c2340' : '#e8e8e8'}`, background: active ? '#0c2340' : '#fff', color: active ? '#fff' : '#0c2340', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s' });
const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

export default function Reports() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const [employees, setEmployees] = useState([]);
  const [details, setDetails] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generatingReport, setGeneratingReport] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };
  const buildParams = () => period === 'custom' && dateFrom && dateTo ? `date_from=${dateFrom}&date_to=${dateTo}` : `period=${period}`;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${API_BASE}/api/employees`, { headers }).then(res => {
      setEmployees(res.data);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/api/reports/stats?${buildParams()}`, { headers }).then(res => {
      const map = {};
      res.data.forEach(row => { map[row.employee_id] = row; });
      setDetails(map);
    }).catch(err => console.error('Stats error:', err));
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    const params = buildParams();
    axios.get(`${API_BASE}/api/dashboard/trend?${params}`, { headers }).then(res => {
      const raw = res.data, names = Object.keys(raw);
      if (names.length === 0) return;
      const days = raw[names[0]].map(d => d.date);
      const merged = days.map((date, i) => { const obj = { date }; names.forEach(name => { obj[name] = raw[name][i]?.score; }); return obj; });
      setTrendData(merged);
    });
  }, [period, dateFrom, dateTo]);

  const generateReport = async (empId = null, empName = null) => {
    try {
      setGeneratingReport(empId || 'all');
      const params = buildParams();
      const endpoint = empId ? `/api/reports/employee/${empId}` : `/api/reports/all`;
      const res = await axios.get(`${API_BASE}${endpoint}?${params}`, { headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${empName ? empName.toLowerCase().replace(/ /g, '-') : 'all-employees'}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed to generate report'));
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderTop: '1px solid #0c2340', borderBottom: '1px solid #0c2340', padding: '0 30px', height: '121px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}><img src="/icons/nav/trending-up-dark.png" alt="" style={{ width: '30px', height: '30px', verticalAlign: 'middle', marginRight: '10px' }} />Employee Reports</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Performance analytics and insights</p>
          </div>
          <button onClick={() => generateReport()} disabled={generatingReport !== null} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2E4057 0%, #4a6fa5 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: generatingReport === null ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', opacity: generatingReport !== null ? 0.7 : 1 }} onMouseEnter={e => generatingReport === null && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 64, 87, 0.2)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}>
            <FileText size={14} />
            {generatingReport === 'all' ? 'Generating...' : 'All Reports'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Period Filter */}
        <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#333', fontWeight: '700', textTransform: 'uppercase' }}>Period:</span>
          {PERIODS.map(p => <button key={p.value} onClick={() => setPeriod(p.value)} style={btnStyle(period === p.value)}>{p.label}</button>)}
          {period === 'custom' && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} /><span style={{ color: '#666', fontSize: '12px', fontWeight: '600' }}>to</span><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} /></div>}
        </div>

        {/* Employee Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {employees.map(e => {
            const d = details[e.id];
            const scoreColor = d?.unified_score >= 80 ? '#10b981' : d?.unified_score >= 65 ? '#f59e0b' : '#ef4444';
            const boxColor = e.status === 'Active' ? '#10b981' : '#9ca3af';
            return (
              <div key={e.id} style={{ ...cardStyle, borderTop: `4px solid ${boxColor}` }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(12,35,64,0.15)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #0c2340 0%, #13315c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                      {e.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{e.name}</p>
                      <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0 0' }}>{e.employee_code || 'N/A'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: '800', color: scoreColor, margin: 0 }}>{d?.unified_score ?? '—'}</p>
                </div>

                {d ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      {[{ label: 'Presence', value: `${d.presence_rate || '—'}%` }, { label: 'Response', value: `${d.avg_response || '—'}s` }, { label: 'Feedback', value: `${d.feedback || '—'}★` }, { label: 'Interactions', value: d.total_interactions || '—' }].map(s => (
                        <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e8e8e8' }}>
                          <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>{s.label}</p>
                          <p style={{ fontSize: '16px', fontWeight: '800', color: '#0c2340', margin: '4px 0 0 0' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => generateReport(e.id, e.name)} disabled={generatingReport !== null} style={{ width: '100%', padding: '10px 16px', background: boxColor, color: '#fff', border: 'none', borderRadius: '6px', cursor: generatingReport === null ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: generatingReport !== null ? 0.7 : 1 }} onMouseEnter={e => generatingReport === null && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = `0 4px 12px ${boxColor}40`)} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}>
                      <Download size={14} />
                      {generatingReport === e.id ? 'Generating...' : 'Generate Report'}
                    </button>
                  </>
                ) : <p style={{ color: '#999', fontSize: '12px' }}>Loading...</p>}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}