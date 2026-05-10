// MainLayout.jsx (src/components/MainLayout.jsx)
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function MainLayout() {
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