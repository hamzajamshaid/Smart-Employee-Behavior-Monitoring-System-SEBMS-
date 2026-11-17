import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import axios from 'axios'
import API_BASE from '../config'

const DAY_MS = 24 * 60 * 60 * 1000

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
]

const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Resolved']
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent']

const getStatusColor = (status) => ({ 'Open': '#f59e0b', 'In Progress': '#3b82f6', 'Resolved': '#10b981' }[status] || '#6b7280')
const getPriorityColor = (priority) => ({ 'Low': '#10b981', 'Medium': '#eab308', 'High': '#f59e0b', 'Urgent': '#ef4444' }[priority] || '#6b7280')

const fmt = (v) => (v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const weekStart = (d) => {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}

const withinDate = (t, filter) => {
  if (filter === 'all') return true
  if (!t.created_at) return false
  const x = new Date(t.created_at)
  const now = new Date()
  if (filter === 'week') return x >= weekStart(now)
  if (filter === 'month') return x >= new Date(now.getFullYear(), now.getMonth(), 1)
  const days = filter === 'today' ? 1 : Number(filter)
  return x >= new Date(now.getTime() - days * DAY_MS)
}

const btnStyle = (active, color = '#0052cc') => ({ padding: '8px 14px', borderRadius: '6px', border: `1px solid ${active ? color : '#e8e8e8'}`, background: active ? color : '#fff', color: active ? '#fff' : color, cursor: 'pointer', fontSize: '12px', fontWeight: active ? '600' : '500' })
const inputStyle = { padding: '8px 10px', border: '1px solid #cfd8e3', borderRadius: '6px', fontSize: '13px', background: '#fff', minWidth: '150px' }
const filterBox = { display: 'flex', flexDirection: 'column', gap: '4px' }
const filterLabel = { fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }

const Field = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>{value}</div>
  </div>
)

export default function Tickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    fetchTickets()
    fetchEmployees()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tickets`, { headers })
      setTickets(res.data || [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`, { headers })
      setEmployees(res.data || [])
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
  }

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [ticketId]: true }))
      await axios.put(`${API_BASE}/api/tickets/${ticketId}`, { status: newStatus }, { headers })
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed to update'))
    } finally {
      setUpdating(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleAssignEmployee = async (ticketId, employeeId) => {
    try {
      setUpdating(prev => ({ ...prev, [ticketId]: true }))
      await axios.put(`${API_BASE}/api/tickets/${ticketId}`, { employee_id: employeeId || null }, { headers })
      setTickets(prev => prev.map(t =>
        t.id === ticketId
          ? { ...t, employee_id: employeeId ? parseInt(employeeId) : null, employee_name: employeeId ? employees.find(e => e.id === parseInt(employeeId))?.name : 'Unassigned' }
          : t
      ))
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed to assign'))
    } finally {
      setUpdating(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>

  const types = [...new Set(tickets.map(t => t.type).filter(Boolean))].sort()
  const q = search.trim().replace('#', '').toLowerCase()

  const filtered = tickets
    .filter(t =>
      (statusFilter === 'All' || t.status === statusFilter) &&
      (priorityFilter === 'All' || t.priority === priorityFilter) &&
      (typeFilter === 'All' || t.type === typeFilter) &&
      (employeeFilter === 'all' || (employeeFilter === 'unassigned' ? !t.employee_id : String(t.employee_id) === employeeFilter)) &&
      withinDate(t, dateFilter) &&
      (!q ||
        String(t.id).includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.customer_name || '').toLowerCase().includes(q) ||
        (t.employee_name || '').toLowerCase().includes(q)))
    .sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0))

  const groups = []
  const byKey = {}
  filtered.forEach(t => {
    const hasDate = !!t.created_at
    const d = hasDate ? new Date(t.created_at) : null
    const k = hasDate ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : 'none'
    if (!byKey[k]) {
      byKey[k] = {
        label: hasDate ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date',
        items: [],
      }
      groups.push(byKey[k])
    }
    byKey[k].items.push(t)
  })

  const renderCard = (t) => {
    const sColor = getStatusColor(t.status)
    const pColor = getPriorityColor(t.priority)
    return (
      <div key={t.id} style={{ padding: '14px 16px', background: sColor + '10', border: `2px solid ${sColor}`, borderRadius: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', background: '#0052cc', borderRadius: '4px', padding: '3px 8px', marginTop: '2px' }}>#{t.id}</span>
            <Field label="Title" value={t.title || '—'} />
            <Field label="Customer" value={t.customer_name || '—'} />
            <Field label="Employee" value={t.employee_name || 'Unassigned'} />
            <Field label="Type" value={t.type || '—'} />
            <Field label="Created" value={fmt(t.created_at)} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ background: pColor + '20', color: pColor, padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{t.priority}</span>
            <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)} disabled={updating[t.id]} style={{ padding: '6px 10px', fontSize: '12px', border: `2px solid ${sColor}`, borderRadius: '4px', background: '#fff', color: sColor, fontWeight: '600', cursor: 'pointer' }}>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={t.employee_id || ''} onChange={(e) => handleAssignEmployee(t.id, e.target.value)} disabled={updating[t.id]} style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cfd8e3', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
              <option value="">Unassigned</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <button onClick={() => navigate(`/tickets/${t.id}`)} disabled={updating[t.id]} style={{ fontSize: '12px', padding: '7px 12px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>View</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>🎫 Tickets</h1>
        <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Manage all customer support tickets · {tickets.length} total</p>
      </div>

      <div style={{ padding: '24px 30px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={btnStyle(statusFilter === s)}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {PRIORITY_OPTIONS.map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} style={btnStyle(priorityFilter === p, '#7c3aed')}>{p}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ ...filterBox, flex: 1, minWidth: '240px' }}>
            <span style={filterLabel}>Search</span>
            <input type="text" placeholder="ID, title, customer or employee" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: '0', width: '100%', boxSizing: 'border-box' }} />
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
              <option value="unassigned">Unassigned</option>
              {employees.map(emp => <option key={emp.id} value={String(emp.id)}>{emp.name}</option>)}
            </select>
          </div>
          <div style={filterBox}>
            <span style={filterLabel}>Type</span>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
              <option value="All">All types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
            Showing {filtered.length} of {tickets.length} tickets
          </p>
          <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '6px' }}>
            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>No tickets found</p>
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
  )
}
