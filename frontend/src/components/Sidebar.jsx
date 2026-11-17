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
    { path: '/dashboard', label: 'Dashboard', icon: '/icons/nav/layout-dashboard-light.png' },
    { path: '/employees', label: 'Employees', icon: '/icons/nav/users-light.png' },
    { path: '/tickets', label: 'Tickets', icon: '/icons/nav/ticket-light.png' },
    { path: '/admin-appointments', label: 'Appointments', icon: '/icons/nav/calendar-days-light.png' },
    { path: '/alerts', label: 'Alerts', icon: '/icons/nav/bell-light.png' },
    { path: '/reports', label: 'Reports', icon: '/icons/nav/trending-up-light.png' },
    { path: '/feedback', label: 'Feedback', icon: '/icons/nav/message-square-light.png' },
    { path: '/settings', label: 'Settings', icon: '/icons/nav/settings-light.png' },
  ]

  const employeeMenuItems = [
    { path: '/employee-dashboard', label: 'Dashboard', icon: '/icons/nav/layout-dashboard-light.png' },
    { path: '/employee-appointments', label: 'Appointments', icon: '/icons/nav/calendar-days-light.png' },
    { path: '/employee-tickets', label: 'My Tickets', icon: '/icons/nav/ticket-light.png' },
    { path: '/attendance', label: 'Attendance', icon: '⏱️' },
    { path: '/simulate', label: 'Simulate Capture', icon: '🎬' },
    { path: '/counter', label: 'Counter', icon: '🪑' },
  ]

  const customerMenuItems = [
    { path: '/customer-dashboard', label: 'Dashboard', icon: '/icons/nav/layout-dashboard-light.png' },
    { path: '/appointments', label: 'Book Appointment', icon: '/icons/nav/calendar-days-light.png' },
    { path: '/customer-tickets', label: 'My Tickets', icon: '/icons/nav/ticket-light.png' },
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
          background: linear-gradient(135deg, #0c2340 0%, #13315c 100%);
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
          background: rgba(46, 196, 182, 0.2);
          color: #fff;
          border-left: 3px solid #2ec4b6;
          padding-left: 11px;
        }

        .sidebar-nav-item.active:hover {
          background: rgba(46, 196, 182, 0.3);
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
            <svg width="60" height="72" viewBox="0 0 100 120" style={{ flexShrink: 0, display: 'block' }} aria-hidden="true">
              <path d="M50 4 L94 18 L94 58 C94 88 74 107 50 116 C26 107 6 88 6 58 L6 18 Z" fill="#2ec4b6" />
              <path d="M50 12 L86 23 L86 58 C86 82 70 98 50 106 C30 98 14 82 14 58 L14 23 Z" fill="#0c2340" />
              <path d="M26 62 A24 24 0 0 1 74 62" fill="none" stroke="#2ec4b6" strokeWidth="7" strokeLinecap="round" />
              <circle cx="67" cy="45" r="4" fill="#fff" />
              <circle cx="50" cy="62" r="3" fill="#fff" />
            </svg>
            <h2 className="sidebar-brand" style={{ fontSize: '28px' }}>SEBMS</h2>
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
              <span className="sidebar-icon">{item.icon.startsWith('/') ? <img src={item.icon} alt="" style={{ width: '22px', height: '22px', display: 'block' }} /> : item.icon}</span>
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
            <img src="/icons/nav/log-out-light.png" alt="" style={{ width: '22px', height: '22px', display: 'block' }} />
            <span className="sidebar-logout-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}