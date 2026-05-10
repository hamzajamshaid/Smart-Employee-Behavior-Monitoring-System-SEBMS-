import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import EmployeeLogin from './pages/EmployeeLogin'
import CustomerLogin from './pages/CustomerLogin'
import CustomerRegister from './pages/CustomerRegister'
import CustomerFeedback from './pages/CustomerFeedback'

// Admin Pages
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Tickets from './pages/Tickets'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AdminAppointments from './pages/AdminAppointments'
import Feedback from './pages/Feedback'
import EmployeeDetail from './pages/EmployeeDetail'

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeTickets from './pages/EmployeeTickets'
import EmployeeAppointments from './pages/EmployeeAppointments'
import Attendance from './pages/Attendance'
import EmployeeTicketDetail from './pages/EmployeeTicketDetail'

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerTickets from './pages/CustomerTickets'
import Appointments from './pages/Appointments'
import CustomerTicketDetail from './pages/CustomerTicketDetail'

// Components
import Sidebar from './components/Sidebar'

// Loading component
function Loading() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>
}

// Main Layout Component
function MainLayout() {
  const userRole = localStorage.getItem('role')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f8fc' }}>
      <Sidebar userRole={userRole} />
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: '250px',
        transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Outlet />
      </main>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const [isReady, setIsReady] = useState(true)

  useEffect(() => {
    setIsReady(true)
  }, [])

  if (!isReady) {
    return <Loading />
  }

  return (
    <Router>
      <Routes>
        {/* ========== PUBLIC ROUTES (No Layout/Auth) ========== */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-register" element={<CustomerRegister />} />
        {/* 🔓 FEEDBACK FORM — PUBLIC (No auth needed!) */}
        <Route path="/feedback/:interactionId" element={<CustomerFeedback />} />

        {/* ========== PROTECTED ROUTES WITH LAYOUT ========== */}
        <Route element={<MainLayout />}>
          {/* ADMIN ROUTES */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="Admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute requiredRole="Admin"><Employees /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<ProtectedRoute requiredRole="Admin"><EmployeeDetail /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute requiredRole="Admin"><Tickets /></ProtectedRoute>} />
          <Route path="/admin-appointments" element={<ProtectedRoute requiredRole="Admin"><AdminAppointments /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute requiredRole="Admin"><Alerts /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute requiredRole="Admin"><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="Admin"><Settings /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute requiredRole="Admin"><Feedback /></ProtectedRoute>} />

          {/* EMPLOYEE ROUTES */}
          <Route path="/employee-dashboard" element={<ProtectedRoute requiredRole="Employee"><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee-tickets" element={<ProtectedRoute requiredRole="Employee"><EmployeeTickets /></ProtectedRoute>} />
          <Route path="/employee-tickets/:id" element={<ProtectedRoute requiredRole="Employee"><EmployeeTicketDetail /></ProtectedRoute>} />
          <Route path="/employee-appointments" element={<ProtectedRoute requiredRole="Employee"><EmployeeAppointments /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute requiredRole="Employee"><Attendance /></ProtectedRoute>} />

          {/* CUSTOMER ROUTES */}
          <Route path="/customer-dashboard" element={<ProtectedRoute requiredRole="Customer"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer-tickets" element={<ProtectedRoute requiredRole="Customer"><CustomerTickets /></ProtectedRoute>} />
          <Route path="/customer-tickets/:id" element={<ProtectedRoute requiredRole="Customer"><CustomerTicketDetail /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute requiredRole="Customer"><Appointments /></ProtectedRoute>} />
        </Route>

        {/* ========== FALLBACK ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}