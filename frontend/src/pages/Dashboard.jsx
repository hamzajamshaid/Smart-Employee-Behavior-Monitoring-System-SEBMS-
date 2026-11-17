import ScoreBreakdownModal from '../components/ScoreBreakdownModal'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import API_BASE from '../config'
import KPICard from '../components/KPICard'
import QRModal from '../components/QRModal'
import InteractionModal from '../components/InteractionModal'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = { 'Ahmed Raza': '#0c2340', 'Sara Khan': '#00a86b', 'Bilal Ahmed': '#ff6b35' }
const PERIODS = [{ label: 'Today', value: 'today' }, { label: 'This Week', value: 'week' }, { label: 'This Month', value: 'month' }, { label: 'All time', value: 'all' }, { label: 'Custom', value: 'custom' }]

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0c2340', background: active ? '#0c2340' : '#fff', color: active ? '#fff' : '#0c2340', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s linear' })

const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' }


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
const fmtNum = v => (v == null ? '—' : Math.round(v));
const fmtPct = v => (v == null ? '—' : `${Math.round(v)}%`);
const fmtScore = v => (v == null ? '—' : Number(v).toFixed(1));
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

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [trendData, setTrendData] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [period, setPeriod] = useState('month')
  const [idQuery, setIdQuery] = useState('')
  const [notesFor, setNotesFor] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedInteraction, setSelectedInteraction] = useState(null)
  const [qrInteraction, setQrInteraction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [batchMsg, setBatchMsg] = useState('')
  const [detailEmployee, setDetailEmployee] = useState(null)
  const [breakdownId, setBreakdownId] = useState(null)
  const [running, setRunning] = useState(() => JSON.parse(localStorage.getItem('sebms:jobs:v2') || '{}'))
  const [, setNow] = useState(0)
  const customerQ = customerQuery.trim().toLowerCase()
  const customerDigits = customerQuery.replace(/\D/g, '')
  const customerRows = interactions.filter(i => i.customer_name && (!customerQ || i.customer_name.toLowerCase().includes(customerQ) || (customerDigits.length > 0 && (i.customer_phone || '').includes(customerDigits)))).slice(0, 100)
  const refreshInteractions = () => {
    axios.get(`${API_BASE}/api/dashboard/interactions${buildParams()}`, { headers })
      .then(res => setInteractions((Array.isArray(res.data) ? res.data : []).map(mapInteraction)))
      .catch(() => {})
  }
  useEffect(() => {
    if (Object.keys(running).length === 0) return
    const t = setInterval(() => setNow(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  const updateRunning = (fn) => setRunning(prev => {
    const next = fn(prev)
    localStorage.setItem('sebms:jobs:v2', JSON.stringify(next))
    return next
  })
  const startProcess = async (id) => {
    const taskId = await runBatch([id])
    if (taskId) updateRunning(prev => ({ ...prev, [id]: { taskId, at: Date.now() } }))
  }
  const processButton = (row, small = false) => {
    const id = row.id
    const busy = Object.keys(running).length > 0
    const base = { padding: small ? '6px 10px' : '10px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: small ? '12px' : '13px', color: '#fff', whiteSpace: 'nowrap' }
    if (running[id]) {
      const hist = JSON.parse(localStorage.getItem('sebms:durations') || '[]')
      const expected = hist.length ? Math.round(hist.reduce((a, b) => a + b, 0) / hist.length) : 60
      const left = expected - Math.max(0, Math.round((Date.now() - running[id].at) / 1000))
      return <button disabled style={{ ...base, background: '#8fa8d8', cursor: 'not-allowed' }}>{left > 0 ? `Processing… ${left}s` : 'Finishing…'}</button>
    }
    if (row.processing_status === 'scored') return <button onClick={() => startProcess(id)} disabled={busy} style={{ ...base, background: '#16a34a', cursor: busy ? 'not-allowed' : 'pointer' }}>✓ Processed</button>
    return <button onClick={() => startProcess(id)} disabled={busy} style={{ ...base, background: '#0c2340', cursor: busy ? 'not-allowed' : 'pointer' }}>Process this session</button>
  }

  useEffect(() => {
    const ids = Object.keys(running)
    if (ids.length === 0) return
    const t = setInterval(async () => {
      for (const id of ids) {
        const row = interactions.find(x => String(x.id) === id)
        if (Date.now() - running[id].at > 10000 && row && row.processing_status === 'scored') {
          updateRunning(prev => { const n = { ...prev }; delete n[id]; return n })
          continue
        }
        if (Date.now() - running[id].at > 10 * 60 * 1000) {
          updateRunning(prev => { const n = { ...prev }; delete n[id]; return n })
          refreshInteractions()
          continue
        }
        try {
          const res = await axios.get(`${API_BASE}/api/batch/status/${running[id].taskId}`, { headers })
          if (res.data.status === 'SUCCESS' || res.data.status === 'FAILURE') {
            if (res.data.status === 'SUCCESS') {
              const took = Math.round((Date.now() - running[id].at) / 1000)
              const hist = JSON.parse(localStorage.getItem('sebms:durations') || '[]')
              localStorage.setItem('sebms:durations', JSON.stringify([...hist, took].slice(-10)))
            }
            updateRunning(prev => { const n = { ...prev }; delete n[id]; return n })
            refreshInteractions()
          }
        } catch (e) {
          console.warn('Batch status check failed for session', id, e.message)
        }
      }
    }, 3000)
    return () => clearInterval(t)
  }, [running, interactions])

  const runBatch = async (ids = []) => {
    let taskId = null
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(`${API_BASE}/api/batch/trigger`, { interaction_ids: ids }, { headers: { Authorization: `Bearer ${token}` } })
      taskId = res.data.task_id || null
      setBatchMsg(ids.length ? `Session #${ids[0]} queued for processing` : 'Batch queued (last 24 hours)')
      ;[10, 30, 60, 120, 180].forEach(sec => setTimeout(refreshInteractions, sec * 1000))
    } catch (e) {
      setBatchMsg('Batch failed: ' + (e.response?.data?.error || e.message))
    }
    setTimeout(() => setBatchMsg(''), 8000)
    return taskId
  }
  const [showDropdown, setShowDropdown] = useState(false)
  const [topPerformers, setTopPerformers] = useState([])

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedEmpName = employees.find(e => e.id === selectedEmp)?.name || 'All Employees'
  const periodLabel = period === 'custom' ? `${dateFrom} to ${dateTo}` : PERIODS.find(p => p.value === period)?.label || 'This Month'
  const voiceColor = (v) => !v ? '#bbb' : v >= 80 ? '#00a86b' : v >= 65 ? '#ff9500' : '#e53935'

  const buildParams = () => {
    let p = period === 'custom' ? '' : `period=${period}`
    if (period === 'all') p += '&limit=1000'
    if (period === 'custom' && dateFrom && dateTo) p = `date_from=${dateFrom}&date_to=${dateTo}`
    if (selectedEmp) p += `&employee_id=${selectedEmp}`
    return p ? `?${p}` : ''
  }

  useEffect(() => {
    axios.get(`${API_BASE}/api/employees`, { headers }).then(res => setEmployees(res.data)).catch(err => console.error('Employees fetch failed:', err))
  }, [])

  useEffect(() => {
    const params = buildParams()
    setSummary(null)
    
    // Fetch summary
    axios.get(`${API_BASE}/api/dashboard/summary${params}`, { headers })
      .then(res => {
        console.log('📊 Summary data:', res.data)
        setSummary(mapSummary(res.data))
      })
      .catch(err => {
        console.error('Summary fetch failed:', err)
        setSummary({ error: true })
      })
    
    // Fetch interactions
    axios.get(`${API_BASE}/api/dashboard/interactions${params}`, { headers })
      .then(res => {
        console.log('📋 Interactions data:', res.data)
        setInteractions((Array.isArray(res.data) ? res.data : []).map(mapInteraction))
      })
      .catch(err => {
        console.error('Interactions fetch failed:', err)
        setInteractions([])
      })
    
    // Fetch trend data
    axios.get(`${API_BASE}/api/dashboard/trend${params}`, { headers })
      .then(res => {
        console.log('📈 Trend data:', res.data)
        const raw = res.data
        const names = Object.keys(raw)
        if (names.length === 0) {
          setTrendData([])
          return
        }
        const days = raw[names[0]].map(d => d.date)
        const merged = days.map((date, i) => {
          const obj = { date }
          names.forEach(name => { obj[name] = raw[name][i]?.score })
          return obj
        })
        setTrendData(merged)
      })
      .catch(err => {
        console.error('Trend fetch failed:', err)
        setTrendData([])
      })
    
    // Top performers: measured interactions only, from the backend.
    // Shown only when at least 2 employees have measured data (otherwise it is not a ranking).
    const perfPeriod = period === 'custom' ? 'month' : period
    axios.get(`${API_BASE}/api/dashboard/performers?period=${perfPeriod}`, { headers })
      .then(res => {
        const ranked = res.data?.ranked || []
        setTopPerformers(ranked.length >= 2
          ? ranked.map(r => ({ ...r, name: r.name, score: r.avg_unified_score }))
          : [])
      })
      .catch(err => {
        console.error('Performers fetch failed:', err)
        setTopPerformers([])
      })
  }, [selectedEmp, period, dateFrom, dateTo, employees])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .card-hover { transition: all 0.2s linear; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(12,35,64,0.15); transform: translateY(-2px); }
      `}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f1f5', borderBottom: '2px solid #0c2340', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0c2340', margin: 0, lineHeight: '1.1' }}>Performance Dashboard</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                onFocus={() => setShowDropdown(true)} 
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '13px', boxShadow: '0 1px 3px rgba(12,35,64,0.1)', transition: 'all 0.15s linear', color: '#1a1a1a', background: '#fff' }} 
                onMouseEnter={e => e.target.style.borderColor = '#13315c'} 
                onMouseLeave={e => e.target.style.borderColor = '#0c2340'} 
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0c2340', fontSize: '14px' }}>🔍</span>
              {showDropdown && filteredEmployees.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #0c2340', borderTop: 'none', borderRadius: '0 0 6px 6px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(12,35,64,0.15)', marginTop: '2px' }}>
                  <div 
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: !selectedEmp ? '#e8f1f5' : 'transparent', transition: 'background 0.15s linear', fontWeight: !selectedEmp ? '600' : '500' }} 
                    onClick={() => { setSelectedEmp(null); setSearchQuery(''); setShowDropdown(false) }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f1f5'} 
                    onMouseLeave={e => e.currentTarget.style.background = !selectedEmp ? '#e8f1f5' : 'transparent'}
                  >
                    All Employees
                  </div>
                  {filteredEmployees.map(e => (
                    <div 
                      key={e.id} 
                      onClick={() => { setSelectedEmp(e.id); setSearchQuery(''); setShowDropdown(false) }} 
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#333', background: selectedEmp === e.id ? '#e8f1f5' : 'transparent', borderLeft: selectedEmp === e.id ? '3px solid #0c2340' : '3px solid transparent', transition: 'background 0.15s linear', fontWeight: selectedEmp === e.id ? '600' : '500' }} 
                      onMouseEnter={e => e.currentTarget.style.background = '#e8f1f5'} 
                      onMouseLeave={e => e.currentTarget.style.background = selectedEmp === e.id ? '#e8f1f5' : 'transparent'}
                    >
                      {e.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#333', fontWeight: '600' }}>
              Viewing: <span style={{ color: '#0c2340', fontWeight: '700' }}>{selectedEmpName}</span> • <span style={{ color: '#0c2340', fontWeight: '700' }}>{periodLabel}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#333', fontWeight: '700' }}>Period:</span>
          {PERIODS.map(p => (<button key={p.value} onClick={() => setPeriod(p.value)} style={btnStyle(period === p.value)}>{p.label}</button>))}
          <button onClick={() => runBatch([])} style={btnStyle(false)}>▶ Run batch</button>
          {batchMsg && <span style={{ fontSize: '12px', color: '#0c2340', fontWeight: 600 }}>{batchMsg}</span>}
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #0c2340', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} />
              <span style={{ color: '#333', fontSize: '12px', fontWeight: '600' }}>to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #0c2340', borderRadius: '5px', fontSize: '12px', color: '#1a1a1a', background: '#fff' }} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 30px' }}>
        {summary?.alerts?.map(a => (
          <div key={a.id} style={{ background: '#fff8e1', border: '1px solid #ffe082', borderLeft: '4px solid #ffc107', color: '#856404', padding: '12px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠</span>
            <span>{a.message}</span>
          </div>
        ))}

        {/* KPI Cards */}
        {summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div className="card-hover" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <KPICard label="Unified Score" value={`${fmtNum(summary.unified_score)}`} sub="out of 100" color="#0c2340" />
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

        {/* Top Performers */}
        {topPerformers.length === 0 ? (
          <div className="card-hover" style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '14px', marginTop: 0 }}>🏆 Top Performers</h3>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Not enough measured data to rank. A ranking needs at least 2 employees with measured interactions.
            </p>
          </div>
        ) : (
          <div className="card-hover" style={{ ...cardStyle, marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '14px', marginTop: 0 }}>🏆 Top Performers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {topPerformers.map((emp, idx) => (
                <div 
                  key={emp.id} 
                  className="card-hover" 
                  style={{ background: 'linear-gradient(135deg, #e8f1f5 0%, #fff 100%)', border: '1px solid #d0e0ff', borderRadius: '8px', padding: '16px', textAlign: 'center', position: 'relative', cursor: 'pointer', transition: 'all 0.2s linear' }} 
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(12,35,64,0.15)' }} 
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'absolute', top: '-8px', right: '10px', background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : '#cd7f32', color: idx === 1 ? '#666' : '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    {idx + 1}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '8px 0 10px' }}>{emp.name}</p>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#0c2340', margin: '0 0 4px' }}>{emp.score}</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0', fontWeight: '600' }}>Score</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', marginTop: '20px', marginBottom: '12px' }}>
          {/* Score Trend */}
          <div className="card-hover" style={cardStyle}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '14px', marginTop: 0 }}>📈 Score Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[50, 100]} fontSize={11} stroke="#ddd" />
                  <Tooltip contentStyle={{ background: '#fff', border: '2px solid #0c2340', borderRadius: '6px', boxShadow: '0 2px 8px rgba(12,35,64,0.15)', padding: '8px 12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#333' }} />
                  {Object.keys(COLORS).map(name => trendData[0]?.[name] !== undefined ? <Line key={name} type="linear" dataKey={name} stroke={COLORS[name]} strokeWidth={2.5} dot={false} /> : null)}
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
            <input type="text" value={idQuery} onChange={e => setIdQuery(e.target.value)} placeholder="Search session ID (e.g. 1297)" style={{ width: '100%', padding: '8px 10px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ maxHeight: '345px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#e8f1f5', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid #0c2340' }}>
                    {['Session', 'Employee', "What's missing"].map(h => (
                      <th key={h} style={{ textAlign: h === 'Employee' ? 'left' : 'center', padding: '10px 8px', color: '#0c2340', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interactions.length > 0 ? (
                    interactions.filter(i => !idQuery.trim() || String(i.id).includes(idQuery.trim())).map((i, idx) => (
                      <tr 
                        key={i.id} 
                        style={{ borderBottom: '1px solid #e8f1f5', cursor: 'pointer', transition: 'background 0.15s linear', background: idx % 2 === 0 ? '#fafbfc' : '#fff' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#e8f1f5'} 
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fafbfc' : '#fff'}
                      >
                        <td onClick={() => setSelectedInteraction(i)} style={{ padding: '10px 8px', textAlign: 'center', color: '#0c2340', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>#{i.id}</td>
                        <td onClick={() => setSelectedInteraction(i)} style={{ padding: '10px 8px', color: '#1a1a1a', fontWeight: '600', cursor: 'pointer' }}>{i.employee_name || 'N/A'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {i.alert ? (<><span style={{ background: '#dc2626', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>Alert</span>{' '}<button onClick={(e) => { e.stopPropagation(); setNotesFor(i) }} style={{ background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>View</button></>) : i.processing_status === 'scored' ? <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>✓ All captured</span> : <span style={{ color: '#999', fontSize: '11px' }}>—</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No interactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {notesFor && (
                <div onClick={() => setNotesFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', padding: '20px', width: '460px', maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 6px', color: '#dc2626', fontSize: '16px' }}>Alert · Session #{notesFor.id}</h3>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px' }}>{notesFor.employee_name} · {notesFor.start_timestamp}</p>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
                      {(notesFor.notes || []).map((n, k) => <li key={k}>{n}</li>)}
                    </ul>
                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                      <button onClick={() => setNotesFor(null)} style={{ padding: '6px 14px', border: '1px solid #0c2340', background: '#fff', color: '#0c2340', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Find a customer */}
        <div className="card-hover" style={{ ...cardStyle, marginTop: '12px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0c2340', marginBottom: '14px', marginTop: 0 }}>🔎 Find a customer</h3>
          <input
            type="text"
            value={customerQuery}
            onChange={e => setCustomerQuery(e.target.value)}
            placeholder="Customer name or phone number"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #0c2340', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{customerQuery.trim() ? `${customerRows.length} match(es)` : 'Recent customers, newest first'}</p>
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
            {customerRows.length === 0 && (
              <div style={{ padding: '16px', color: '#999', fontSize: '13px' }}>No matching customer</div>
            )}
            {customerRows.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                <div style={{ minWidth: 0 }}>
                  <strong>{i.customer_name}</strong> · {i.customer_phone} · session #{i.id} · {i.employee_name} · {i.feedback ? `${i.feedback}★` : 'no rating'} · {i.processing_status}
                  {i.comment && <div style={{ color: '#555', fontStyle: 'italic', marginTop: '4px' }}>"{i.comment}"</div>}
                  <div style={{ color: '#b45309', fontSize: '12px', marginTop: '4px' }}>{(i.notes || []).join(' · ')}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setDetailEmployee(i.employee_id)} style={btnStyle(false)}>Detail analysis</button>
                  {processButton(i)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {qrInteraction && (
        <>
          {console.log('📱 Rendering QRModal for interaction:', qrInteraction)}
          <QRModal interactionId={qrInteraction} onClose={() => {
            console.log('❌ Closing QR Modal')
            setQrInteraction(null)
          }} />
        </>
      )}
      {detailEmployee && createPortal(
        <div onClick={() => setDetailEmployee(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: 'min(1200px, 100%)', boxSizing: 'border-box', margin: 'auto', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}>
            {(() => {
              const rows = interactions.filter(i => i.employee_id === detailEmployee)
              const name = rows[0]?.employee_name || 'Employee'
              const rated = rows.filter(r => r.feedback)
              const avgRating = rated.length ? (rated.reduce((sum, r) => sum + r.feedback, 0) / rated.length).toFixed(1) : '—'
              const th = { textAlign: 'left', padding: '8px', fontSize: '12px', color: '#0c2340', borderBottom: '2px solid #0c2340', whiteSpace: 'nowrap' }
              const td = { padding: '8px', fontSize: '12px', color: '#333', borderBottom: '1px solid #eee', verticalAlign: 'top' }
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0c2340', fontSize: '20px' }}>{name}</h3>
                      <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{rows.length} session(s) · avg rating {avgRating}★</div>
                    </div>
                    <button onClick={() => setDetailEmployee(null)} style={btnStyle(false)}>Close</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Session', 'Date & time', 'Employee', 'Status', 'Rating', 'Comment', 'Presence', 'Expression', 'Voice', 'Unified', 'Response', 'Missing', 'Action'].map(h => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.id}>
                            <td style={td}>#{r.id}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>{r.start_timestamp ? new Date(r.start_timestamp).toLocaleString() : '—'}</td>
                            <td style={td}>{r.employee_name || '—'}</td>
                            <td style={td}>{r.processing_status || '—'}</td>
                            <td style={td}>{r.feedback ? `${r.feedback}★` : '—'}</td>
                            <td style={{ ...td, maxWidth: '200px' }}>{r.comment ? `"${r.comment}"` : '—'}</td>
                            <td style={td}>{fmtScore(r.presence_score)}</td>
                            <td style={td}>{fmtScore(r.emotion_score)}</td>
                            <td onClick={() => r.voice_score != null && setSelectedInteraction({ ...r, openTranscript: true })} style={{ ...td, cursor: r.voice_score != null ? 'pointer' : 'default', color: r.voice_score != null ? '#0c2340' : '#333', textDecoration: r.voice_score != null ? 'underline' : 'none', fontWeight: r.voice_score != null ? '700' : '400' }}>{fmtScore(r.voice_score)}</td>
                            <td style={td}><span onClick={() => r.unified_score != null && setBreakdownId(r.id)} style={{ cursor: r.unified_score != null ? 'pointer' : 'default', color: '#0c2340', fontWeight: '700', textDecoration: r.unified_score != null ? 'underline' : 'none' }}>{fmtScore(r.unified_score)}</span></td>
                            <td style={td}>{r.response_seconds != null ? `${r.response_seconds}s` : '—'}</td>
                            <td style={td}>{['presence', 'emotion', 'response', 'feedback', 'voice'].filter(k => !(r.signals_used || []).includes(k)).join(', ') || '—'}</td>
                            <td style={td}>{processButton(r, true)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
        </div>,
        document.body
      )}
      {breakdownId && <ScoreBreakdownModal interactionId={breakdownId} onClose={() => setBreakdownId(null)} />}
      {selectedInteraction && <InteractionModal interaction={selectedInteraction} onClose={() => setSelectedInteraction(null)} />}
    </div>
  )
}