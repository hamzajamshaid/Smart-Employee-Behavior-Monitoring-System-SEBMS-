import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    counter_id: '',
    email: '',
    phone: '',
  })
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login')
    else fetchEmployees()
  }, [token])

  const fetchEmployees = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await axios.get(`${API_BASE}/api/employees`, { headers })
      setEmployees(res.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name required'
    if (!formData.counter_id) errors.counter_id = 'Counter ID required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      setSubmitting(true)
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await axios.post(`${API_BASE}/api/employees`, formData, { headers })
      alert(`✅ Employee added!\nCode: ${res.data.employee_code}\nPassword: ${res.data.password}`)
      setShowAddForm(false)
      setFormData({ name: '', counter_id: '', email: '', phone: '' })
      fetchEmployees()
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateEmployee = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      setSubmitting(true)
      const headers = { 'Authorization': `Bearer ${token}` }
      await axios.patch(`${API_BASE}/api/employees/${selectedEmployee.id}`, formData, { headers })
      alert('✅ Updated')
      setShowEditModal(false)
      setSelectedEmployee(null)
      setFormData({ name: '', counter_id: '', email: '', phone: '' })
      fetchEmployees()
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEmployee = async () => {
    try {
      setSubmitting(true)
      const headers = { 'Authorization': `Bearer ${token}` }
      await axios.delete(`${API_BASE}/api/employees/${selectedEmployee.id}`, { headers })
      alert('✅ Deleted')
      setShowDeleteModal(false)
      setSelectedEmployee(null)
      fetchEmployees()
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || 'Failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp)
    setFormData({
      name: emp.name,
      counter_id: emp.counter_id,
      email: emp.email || '',
      phone: emp.phone || '',
    })
    setShowEditModal(true)
  }

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.employee_code.includes(searchTerm)
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid var(--neutral-200)' }}>
        <div>
          <h1>👥 Employees</h1>
          <p className="text-muted">Manage staff members and monitor performance</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Employee
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && <Modal title="Add New Employee" onClose={() => setShowAddForm(false)}>
        <EmployeeForm formData={formData} setFormData={setFormData} formErrors={formErrors} onSubmit={handleAddEmployee} submitting={submitting} />
      </Modal>}

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && <Modal title="Edit Employee" onClose={() => { setShowEditModal(false); setSelectedEmployee(null); }}>
        <EmployeeForm formData={formData} setFormData={setFormData} formErrors={formErrors} onSubmit={handleUpdateEmployee} submitting={submitting} isEdit />
      </Modal>}

      {/* Delete Modal */}
      {showDeleteModal && selectedEmployee && <Modal title="Delete Employee?" onClose={() => setShowDeleteModal(false)}>
        <p className="mb-2">Are you sure you want to delete <strong>{selectedEmployee.name}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-danger" onClick={handleDeleteEmployee} disabled={submitting}>{submitting ? 'Deleting...' : 'Delete'}</button>
          <button className="btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}>Cancel</button>
        </div>
      </Modal>}

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'var(--white)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Search by name or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Active', 'Inactive', 'On Leave'].map(status => (
            <button key={status} className={statusFilter === status ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatusFilter(status)} style={{ fontSize: '12px', padding: '8px 16px' }}>
              {status}
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>{filteredEmployees.length} employees</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-3">Loading...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-3"><p className="text-muted">📋 No employees found</p></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Name</th>
                <th>Code</th>
                <th>Counter</th>
                <th>Status</th>
                <th>Score</th>
                <th>Interactions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{emp.name}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px' }}>{emp.employee_code}</td>
                  <td style={{ textAlign: 'center' }}>{emp.counter_id}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${emp.status === 'Active' ? 'success' : emp.status === 'Inactive' ? 'danger' : 'warning'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span>{emp.unified_score}</span>
                      <div style={{ width: '100px', height: '6px', background: 'var(--neutral-200)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, var(--primary))', width: `${(emp.unified_score / 100) * 100}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{emp.total_interactions}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: '12px', padding: '6px 12px' }} 
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: '12px', padding: '6px 12px' }} 
                        onClick={() => handleEditClick(emp)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger" 
                        style={{ fontSize: '12px', padding: '6px 12px' }} 
                        onClick={() => { setSelectedEmployee(emp); setShowDeleteModal(true); }}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
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

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--neutral-200)' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--neutral-500)' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmployeeForm({ formData, setFormData, formErrors, onSubmit, submitting, isEdit }) {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <FormField label="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} error={formErrors.name} />
        <FormField label="Counter ID *" type="number" value={formData.counter_id} onChange={(e) => setFormData({...formData, counter_id: e.target.value})} error={formErrors.counter_id} />
        <FormField label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} error={formErrors.email} />
        <FormField label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update' : 'Add'} Employee
        </button>
      </div>
    </form>
  )
}

function FormField({ label, type = 'text', value, onChange, error }) {
  return (
    <div>
      <label>{label}</label>
      <input type={type} value={value} onChange={onChange} style={{ borderColor: error ? 'var(--danger)' : 'var(--neutral-300)' }} />
      {error && <small className="text-danger mt-1">{error}</small>}
    </div>
  )
}