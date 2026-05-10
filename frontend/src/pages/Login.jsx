import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      if (role === 'Admin') {
        endpoint = `${API_BASE}/auth/login`;
        payload = { username, password };
      } else if (role === 'Employee') {
        endpoint = `${API_BASE}/api/auth/employee-login`;
        payload = { employee_code: username, password };
      } else if (role === 'Customer') {
        endpoint = `${API_BASE}/api/auth/customer-login`;
        payload = { phone: username, password };
      }

      console.log('🔐 Login Attempt:', { endpoint, payload });

      const res = await axios.post(endpoint, payload);

      console.log('✅ Login Success:', res.data);

      // Store token
      const token = res.data.token || res.data.access_token;
      if (!token) {
        throw new Error('No token in response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', res.data.role || role);

      // Store role-specific data
      if (role === 'Admin') {
        localStorage.setItem('user', JSON.stringify({ name: res.data.username || username, role: 'Admin' }));
      } else if (role === 'Employee') {
        localStorage.setItem('employee_id', res.data.employee_id);
        localStorage.setItem('name', res.data.name);
      } else if (role === 'Customer') {
        localStorage.setItem('customer_id', res.data.customer_id);
        localStorage.setItem('name', res.data.name);
      }

      // Redirect based on role
      if (role === 'Admin') {
        navigate('/dashboard');
      } else if (role === 'Employee') {
        navigate('/employee-dashboard');
      } else if (role === 'Customer') {
        navigate('/customer-dashboard');
      }
    } catch (err) {
      console.error('❌ Login Error:', {
        status: err.response?.status,
        message: err.response?.statusText,
        response: err.response?.data,
        error: err.message
      });

      let errorMsg = 'Login failed. Please try again.';

      if (err.response?.status === 401) {
        errorMsg = 'Invalid credentials. Please check your username and password.';
      } else if (err.response?.status === 400) {
        errorMsg = err.response?.data?.error || 'Invalid request. Please check your input.';
      } else if (err.response?.status === 404) {
        errorMsg = 'User not found. Please verify your credentials.';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message === 'Network Error' || err.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot connect to server. Is the backend running?';
      } else if (err.message.includes('No token')) {
        errorMsg = 'Server error: No token received. Please contact support.';
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f0ff 0%, #dbeafe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '48px 40px',
        boxShadow: '0 8px 32px rgba(0,82,204,0.15)',
        maxWidth: '450px',
        width: '100%',
        border: '1px solid #e8e8e8'
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0052cc 0%, #003d99 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(0,82,204,0.2)'
          }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>S</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0052cc', margin: '0 0 4px' }}>SEBMS</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Smart Employee Behavior Monitoring</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username/Email Field */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#333', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>
              {role === 'Admin' ? 'Username' : role === 'Employee' ? 'Employee Code' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={role === 'Admin' ? 'Enter username' : role === 'Employee' ? 'e.g., EMP001' : '03001234567'}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1a1a1a',
                background: '#f9fafb',
                boxSizing: 'border-box',
                transition: 'all 0.15s'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#0052cc', e.currentTarget.style.background = '#fff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8', e.currentTarget.style.background = '#f9fafb')}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#333', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1a1a1a',
                background: '#f9fafb',
                boxSizing: 'border-box',
                transition: 'all 0.15s'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#0052cc', e.currentTarget.style.background = '#fff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8', e.currentTarget.style.background = '#f9fafb')}
              required
            />
          </div>

          {/* Login As Buttons */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#333', textTransform: 'uppercase', marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>
              Login As
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { role: 'Admin', username: 'admin', password: 'admin123' },
                { role: 'Employee', username: 'EMP001', password: 'password' },
                { role: 'Customer', username: '03001234567', password: 'password' }
              ].map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setRole(item.role);
                    setUsername(item.username);
                    setPassword(item.password);
                    setError('');
                  }}
                  style={{
                    padding: '10px 12px',
                    border: `2px solid ${role === item.role ? '#0052cc' : '#e8e8e8'}`,
                    background: role === item.role ? '#0052cc' : '#fff',
                    color: role === item.role ? '#fff' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: role === item.role ? '700' : '600',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => role !== item.role && (e.currentTarget.style.borderColor = '#0052cc', e.currentTarget.style.background = '#e8f0ff')}
                  onMouseLeave={e => role !== item.role && (e.currentTarget.style.borderColor = '#e8e8e8', e.currentTarget.style.background = '#fff')}
                >
                  {item.role}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#dc2626',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '16px', marginTop: '-2px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              padding: '12px 16px',
              background: loading || !username || !password ? '#d1d5db' : 'linear-gradient(135deg, #0052cc 0%, #003d99 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
            onMouseEnter={e => !loading && username && password && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,82,204,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            <span>🔐</span>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: '24px',
          padding: '14px',
          background: '#e8f0ff',
          borderRadius: '8px',
          border: '1px solid #d0e0ff',
          fontSize: '12px',
          color: '#0052cc'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '700' }}>Demo Credentials:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>👤 <strong>Admin:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>admin</code> / <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>admin123</code></div>
            <div>👨‍💼 <strong>Employee:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>EMP001</code> / <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>password</code></div>
            <div>👤 <strong>Customer:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>03001234567</code> / <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>password</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}