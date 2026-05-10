import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchEmployeeData()
  }, [id, period, token])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const empRes = await axios.get(`${API_BASE}/api/employees/${id}`, { headers })
      setEmployee(empRes.data)

      const trendRes = await axios.get(`${API_BASE}/api/dashboard/trend?period=${period}&employee_id=${id}`, { headers })
      setTrendData(Array.isArray(trendRes.data) ? trendRes.data : [])

      const weeklyRes = await axios.get(`${API_BASE}/api/employees/${id}/weekly`, { headers })
      setWeeklyData(Array.isArray(weeklyRes.data) ? weeklyRes.data : [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="px-3 py-3 text-center"><p className="text-muted">Loading...</p></div>
  }

  if (!employee) {
    return <div className="px-3 py-3 text-center"><p className="text-danger">Employee not found</p></div>
  }

  const scoreColor = employee.unified_score >= 80 ? '#10b981' : employee.unified_score >= 65 ? '#f59e0b' : '#ef4444'
  
  const metrics = [
    { label: 'Presence Rate', value: `${employee.avg_presence || 0}%`, target: '≥ 90%', status: (employee.avg_presence || 0) >= 90 ? 'success' : 'warning' },
    { label: 'Avg Response', value: `${employee.avg_response || 0}s`, target: '< 15s', status: (employee.avg_response || 0) < 15 ? 'success' : 'warning' },
    { label: 'Emotion Score', value: `${employee.avg_emotion || 0}%`, target: '≥ 70%', status: (employee.avg_emotion || 0) >= 70 ? 'success' : 'warning' },
    { label: 'Feedback', value: `${employee.avg_feedback || 0}★`, target: '≥ 3.5★', status: (employee.avg_feedback || 0) >= 3.5 ? 'success' : 'warning' },
  ]

  const suggestions = []
  if ((employee.avg_presence || 0) < 90) suggestions.push(`Presence ${employee.avg_presence || 0}% below 90% target`)
  if ((employee.avg_response || 0) > 15) suggestions.push(`Response ${employee.avg_response || 0}s exceeds 15s limit`)
  if ((employee.avg_emotion || 0) < 70) suggestions.push(`Emotion ${employee.avg_emotion || 0}% is low`)
  if ((employee.avg_feedback || 0) < 3.5) suggestions.push(`Feedback ${employee.avg_feedback || 0}★ below 3.5`)
  if (suggestions.length === 0) suggestions.push('✓ All targets met')

  return (
    <div className="px-3 py-3">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid var(--neutral-200)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, marginBottom: '4px' }}>{employee.name}</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>Code: {employee.employee_code} | Counter: {employee.counter_id} | {employee.status}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: scoreColor }}>{employee.unified_score || 0}</div>
          <p className="text-muted" style={{ margin: 0, fontSize: '11px' }}>Overall Score</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {metrics.map((m) => (
          <div key={m.label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>{m.label}</p>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>{m.value}</div>
              </div>
              <span className={`badge badge-${m.status}`}>{m.target}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--neutral-200)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: scoreColor, width: m.status === 'success' ? '100%' : '60%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-2" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
        <span className="text-muted" style={{ fontSize: '12px', fontWeight: '600' }}>Period:</span>
        {['week', 'month'].map(p => (
          <button 
            key={p} 
            className={period === p ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => setPeriod(p)}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            {p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="card mb-2">
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontSize: '16px' }}>📈 Score Trend</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" fontSize={11} />
              <YAxis domain={[50, 100]} fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted">No data available</p>
        )}
      </div>

      {weeklyData.length > 0 && (
        <div className="card mb-2">
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontSize: '16px' }}>📊 Weekly Scores</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" fontSize={11} />
              <YAxis domain={[50, 100]} fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontSize: '16px' }}>💡 Recommendations</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--neutral-50)', borderLeft: '3px solid var(--primary)', borderRadius: '4px' }}>
              <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}