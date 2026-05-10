import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAlerts();
  }, [token, navigate]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/alerts`, { headers });
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await axios.put(`${API_BASE}/api/alerts/${alertId}/resolve`, {}, { headers });
      alert('✅ Alert resolved');
      fetchAlerts();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed to resolve alert'));
    }
  };

  const typeColor = (type) => {
    const colors = {
      'Low Score': '#ef4444',
      'Absence': '#f59e0b',
      'High Response Time': '#eab308',
      'Negative Feedback': '#a855f7',
      'Low Presence': '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  const filteredAlerts = filterType === 'all' 
    ? alerts 
    : alerts.filter(a => a.alert_type === filterType);

  const alertTypes = ['Low Score', 'Absence', 'High Response Time', 'Negative Feedback', 'Low Presence'];
  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>🚨 Alerts</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Active: {alerts.length}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{ padding: '8px 16px', background: filterType === 'all' ? '#0052cc' : '#fff', color: filterType === 'all' ? '#fff' : '#0052cc', border: `1px solid ${filterType === 'all' ? '#0052cc' : '#e8e8e8'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' }}
            onMouseEnter={e => filterType !== 'all' && (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => filterType !== 'all' && (e.currentTarget.style.background = '#fff')}
          >
            All ({alerts.length})
          </button>
          {alertTypes.map(type => {
            const count = alerts.filter(a => a.alert_type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{ padding: '8px 16px', background: filterType === type ? typeColor(type) : '#fff', color: filterType === type ? '#fff' : typeColor(type), border: `1px solid ${filterType === type ? typeColor(type) : '#e8e8e8'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' }}
                onMouseEnter={e => filterType !== type && (e.currentTarget.style.background = typeColor(type) + '10')}
                onMouseLeave={e => filterType !== type && (e.currentTarget.style.background = '#fff')}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>

        {/* Alerts List */}
        <div style={cardStyle}>
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>No alerts found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    padding: '16px',
                    background: typeColor(alert.alert_type) + '10',
                    border: `2px solid ${typeColor(alert.alert_type)}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={20} color={typeColor(alert.alert_type)} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>
                        {alert.employee_name}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#333', margin: '4px 0 0 0' }}>
                        {alert.message}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                        {new Date(alert.triggered_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '6px 12px', background: typeColor(alert.alert_type) + '20', color: typeColor(alert.alert_type), borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {alert.alert_type}
                    </span>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      style={{ padding: '8px 16px', background: typeColor(alert.alert_type), color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = `0 4px 12px ${typeColor(alert.alert_type)}40`)}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
                    >
                      <Check size={14} />
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}