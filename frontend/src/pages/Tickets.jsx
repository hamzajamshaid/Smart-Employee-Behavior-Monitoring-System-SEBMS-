import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

export default function Tickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

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
      await axios.put(`${API_BASE}/api/tickets/${ticketId}`, 
        { status: newStatus }, 
        { headers }
      )
      setTickets(prev => prev.map(t => t.id === ticketId ? {...t, status: newStatus} : t))
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed to update'))
    } finally {
      setUpdating(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleAssignEmployee = async (ticketId, employeeId) => {
    try {
      setUpdating(prev => ({ ...prev, [ticketId]: true }))
      await axios.put(`${API_BASE}/api/tickets/${ticketId}`, 
        { employee_id: employeeId || null }, 
        { headers }
      )
      setTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? {...t, employee_name: employeeId ? employees.find(e => e.id === parseInt(employeeId))?.name : 'Unassigned'} 
          : t
      ))
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed to assign'))
    } finally {
      setUpdating(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toString().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter
    const matchesType = typeFilter === 'All' || t.type === typeFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const getStatusColor = (status) => {
    const colors = {
      'Open': '#f59e0b',
      'In Progress': '#3b82f6',
      'Resolved': '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#eab308',
      'High': '#f59e0b',
      'Urgent': '#ef4444'
    }
    return colors[priority] || '#6b7280'
  }

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid var(--neutral-200)' }}>
        <div>
          <h1>🎫 Tickets</h1>
          <p className="text-muted">Manage all customer support tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'var(--white)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by ID or title..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ flex: 1, minWidth: '200px' }} 
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Open', 'In Progress', 'Resolved'].map(status => (
            <button 
              key={status} 
              className={statusFilter === status ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setStatusFilter(status)} 
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              {status}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map(priority => (
            <button 
              key={priority} 
              className={priorityFilter === priority ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setPriorityFilter(priority)} 
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              {priority}
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>{filteredTickets.length} tickets</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-3">Loading...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-3"><p className="text-muted">📋 No tickets found</p></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ID</th>
                <th style={{ textAlign: 'left' }}>Title</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '12px' }}>
                    #{ticket.id}
                  </td>
                  <td style={{ fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.title}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '13px' }}>
                    {ticket.customer_name}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '12px' }}>
                    <span className="badge badge-neutral">{ticket.type}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      background: getPriorityColor(ticket.priority) + '20',
                      color: getPriorityColor(ticket.priority),
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      disabled={updating[ticket.id]}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: `2px solid ${getStatusColor(ticket.status)}`,
                        borderRadius: '4px',
                        background: '#fff',
                        color: getStatusColor(ticket.status),
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={ticket.employee_id || ''}
                      onChange={(e) => handleAssignEmployee(ticket.id, e.target.value)}
                      disabled={updating[ticket.id]}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '4px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--neutral-500)' }}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '12px', padding: '6px 12px' }} 
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      disabled={updating[ticket.id]}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}