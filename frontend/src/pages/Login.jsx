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

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', res.data.role || role);

      // Store role-specific data
      if (role === 'Admin') {
        sessionStorage.setItem('user', JSON.stringify({ name: res.data.username || username, role: 'Admin' }));
      } else if (role === 'Employee') {
        sessionStorage.setItem('employee_id', res.data.employee_id);
        sessionStorage.setItem('name', res.data.name);
      } else if (role === 'Customer') {
        sessionStorage.setItem('customer_id', res.data.customer_id);
        sessionStorage.setItem('name', res.data.name);
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
      background: 'linear-gradient(135deg, #e8f1f5 0%, #dde8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '48px 40px',
        boxShadow: '0 8px 32px rgba(12,35,64,0.15)',
        maxWidth: '450px',
        width: '100%',
        border: '1px solid #e8e8e8'
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/sebms-logo.png" alt="SEBMS" style={{ width: '260px', maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto 12px' }} />
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
              onFocus={e => (e.currentTarget.style.borderColor = '#2ec4b6', e.currentTarget.style.background = '#fff')}
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
              onFocus={e => (e.currentTarget.style.borderColor = '#2ec4b6', e.currentTarget.style.background = '#fff')}
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
                { role: 'Admin', username: 'admin' },
                { role: 'Employee', username: 'EMP001' },
                { role: 'Customer', username: '03001234567' }
              ].map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setRole(item.role);
                    setUsername(item.username);
                    setError('');
                  }}
                  style={{
                    padding: '10px 12px',
                    border: `2px solid ${role === item.role ? '#0c2340' : '#e8e8e8'}`,
                    background: role === item.role ? '#0c2340' : '#fff',
                    color: role === item.role ? '#fff' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: role === item.role ? '700' : '600',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => role !== item.role && (e.currentTarget.style.borderColor = '#2ec4b6', e.currentTarget.style.background = '#e8f1f5')}
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
              background: loading || !username || !password ? '#d1d5db' : 'linear-gradient(135deg, #0c2340 0%, #13315c 100%)',
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
            onMouseEnter={e => !loading && username && password && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(12,35,64,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {role === 'Customer' && (
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#3d5a80' }}>
            New customer?{' '}
            <button
              type="button"
              onClick={() => navigate('/customer-register')}
              style={{ background: 'none', border: 'none', color: '#13315c', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Create an account
            </button>
          </p>
        )}

        {/* Demo Credentials */}
        <div style={{
          marginTop: '24px',
          padding: '14px',
          background: '#e8f1f5',
          borderRadius: '8px',
          border: '1px solid #cfe0ea',
          fontSize: '12px',
          color: '#0c2340'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '700' }}>Demo usernames (ask your administrator for passwords):</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>👤 <strong>Admin:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>admin</code></div>
            <div>👨‍💼 <strong>Employee:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>EMP001</code></div>
            <div>👤 <strong>Customer:</strong> <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>03001234567</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}