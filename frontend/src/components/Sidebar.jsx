import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar({ userRole }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('employee_id')
    localStorage.removeItem('customer_id')
    localStorage.removeItem('name')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/employees', label: 'Employees', icon: '👥' },
    { path: '/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/admin-appointments', label: 'Appointments', icon: '📅' },
    { path: '/alerts', label: 'Alerts', icon: '🚨' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/feedback', label: 'Feedback', icon: '💬' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const employeeMenuItems = [
    { path: '/employee-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/employee-appointments', label: 'Appointments', icon: '📅' },
    { path: '/employee-tickets', label: 'My Tickets', icon: '🎫' },
    { path: '/attendance', label: 'Attendance', icon: '⏱️' },
  ]

  const customerMenuItems = [
    { path: '/customer-dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/appointments', label: 'Book Appointment', icon: '📅' },
    { path: '/customer-tickets', label: 'My Tickets', icon: '🎫' },
  ]

  const menuItems = 
    userRole === 'Admin' ? adminMenuItems :
    userRole === 'Employee' ? employeeMenuItems :
    customerMenuItems

  return (
    <>
      <style>{`
        .sidebar-container {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: ${isOpen ? '250px' : '80px'};
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5aa0 100%);
          color: #fff;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 16px rgba(0, 0, 0, 0.12);
          transition: width 320ms cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        body {
          --sidebar-width: ${isOpen ? '250px' : '80px'};
        }

        .sidebar-header {
          padding: ${isOpen ? '24px 16px' : '24px 12px'};
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .sidebar-branding {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .sidebar-logo-icon {
          font-size: 28px;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
        }

        .sidebar-brand {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.5px;
          color: #fff;
          opacity: ${isOpen ? 1 : 0};
          transition: opacity 200ms ease;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms ease;
          flex-shrink: 0;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .sidebar-toggle:active {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .sidebar-nav-item {
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          border: none;
          padding: 14px 14px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: ${isOpen ? 'flex-start' : 'center'};
          gap: 14px;
          font-size: 14px;
          font-weight: 500;
          transition: all 220ms ease;
          text-align: left;
          white-space: nowrap;
          position: relative;
        }

        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .sidebar-nav-item.active {
          background: rgba(0, 82, 204, 0.25);
          color: #fff;
          border-left: 3px solid #0052cc;
          padding-left: 11px;
        }

        .sidebar-nav-item.active:hover {
          background: rgba(0, 82, 204, 0.35);
        }

        .sidebar-icon {
          font-size: 20px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: ${isOpen ? 1 : 0};
          transition: opacity 200ms ease;
          font-size: 14px;
        }

        .sidebar-footer {
          padding: 16px 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        .sidebar-logout-btn {
          background: rgba(239, 68, 68, 0.15);
          color: #fff;
          border: 1px solid rgba(239, 68, 68, 0.35);
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: ${isOpen ? 'flex-start' : 'center'};
          gap: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 220ms ease;
          width: 100%;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .sidebar-logout-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .sidebar-logout-label {
          opacity: ${isOpen ? 1 : 0};
          transition: opacity 200ms ease;
        }

        main {
          margin-left: ${isOpen ? '250px' : '80px'} !important;
          transition: margin-left 320ms cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>

      <div className="sidebar-container">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-branding">
            <div className="sidebar-logo-icon">⚙️</div>
            <h2 className="sidebar-brand">SEBMS</h2>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sidebar-toggle"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Logout"
          >
            <span className="sidebar-logout-icon">🚪</span>
            <span className="sidebar-logout-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}