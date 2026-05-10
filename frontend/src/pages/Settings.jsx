import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Sliders } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const [settings, setSettings] = useState({
    companyName: 'Honda Breeze',
    timezone: 'UTC+5',
    scoringWeights: {
      presence: 20,
      faceEmotion: 25,
      responseTime: 25,
      customerFeedback: 20,
      voiceEmotion: 10
    },
    detectionThresholds: {
      presenceTarget: 90,
      responseTimeLimit: 15,
      emotionPositiveRatio: 70,
      feedbackMinimum: 3.5
    },
    alertSensitivity: 'medium',
    batchProcessingInterval: 24
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSettings();
  }, [token, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/settings`, { headers });
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/api/settings`, settings, { headers });
      alert('✅ Settings saved successfully');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const updateScoringWeight = (key, value) => {
    const newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setSettings(prev => ({
      ...prev,
      scoringWeights: { ...prev.scoringWeights, [key]: newValue }
    }));
  };

  const updateThreshold = (key, value) => {
    setSettings(prev => ({
      ...prev,
      detectionThresholds: { ...prev.detectionThresholds, [key]: parseFloat(value) || 0 }
    }));
  };

  const totalWeight = Object.values(settings.scoringWeights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };
  const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', color: '#1a1a1a', background: '#fff', transition: 'all 0.15s' };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Loading settings...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>⚙️ Settings</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>System configuration and scoring parameters</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* General Settings */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '20px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={20} />
            General Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#0052cc'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e8e8'}
              />
            </div>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.currentTarget.style.borderColor = '#0052cc'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e8e8'}
              >
                <option value="UTC+5">UTC+5 (Pakistan)</option>
                <option value="UTC+0">UTC+0 (GMT)</option>
                <option value="UTC-5">UTC-5 (EST)</option>
                <option value="UTC+1">UTC+1 (CET)</option>
                <option value="UTC+8">UTC+8 (CST)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Batch Processing Interval (hours)</label>
              <input
                type="number"
                value={settings.batchProcessingInterval}
                onChange={e => setSettings({ ...settings, batchProcessingInterval: parseInt(e.target.value) || 24 })}
                min="1"
                max="168"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#0052cc'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e8e8'}
              />
              <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>Data processed every {settings.batchProcessingInterval} hours</p>
            </div>
          </div>
        </div>

        {/* Scoring Weights */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '20px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} />
            Scoring Weights Configuration
          </h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Adjust the weight of each component in the unified score calculation (Total: <span style={{ fontWeight: '700', color: isWeightValid ? '#10b981' : '#ef4444' }}>{totalWeight}%</span>)</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {[
              { key: 'presence', label: 'Presence Score', description: 'Employee availability at service counter' },
              { key: 'faceEmotion', label: 'Face Emotion Score', description: 'Facial expression analysis (happiness, stress)' },
              { key: 'responseTime', label: 'Response Time Score', description: 'Time taken to respond to customer' },
              { key: 'customerFeedback', label: 'Customer Feedback Score', description: 'Direct customer ratings (1-5 stars)' },
              { key: 'voiceEmotion', label: 'Voice Emotion Score', description: 'Vocal tone and emotional delivery (optional)' }
            ].map(item => (
              <div key={item.key} style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#0052cc', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>{item.description}</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.scoringWeights[item.key]}
                  onChange={e => updateScoringWeight(item.key, e.target.value)}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e8e8e8', outline: 'none', cursor: 'pointer', accentColor: '#0052cc' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Weight</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.scoringWeights[item.key]}
                    onChange={e => updateScoringWeight(item.key, e.target.value)}
                    style={{ width: '60px', padding: '6px 8px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '12px', fontWeight: '700', color: '#0052cc', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc' }}>%</span>
                </div>
              </div>
            ))}
          </div>

          {!isWeightValid && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
              ⚠️ Total weight must equal 100%. Currently: {totalWeight}%
            </div>
          )}
        </div>

        {/* Detection Thresholds */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '20px', marginTop: 0 }}>Detection Thresholds</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Set minimum performance targets and detection limits</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {[
              { key: 'presenceTarget', label: 'Presence Target (%)', description: 'Minimum acceptable presence rate', min: '0', max: '100', suffix: '%' },
              { key: 'responseTimeLimit', label: 'Response Time Limit (seconds)', description: 'Maximum acceptable response time', min: '1', max: '60', suffix: 's' },
              { key: 'emotionPositiveRatio', label: 'Positive Emotion Ratio (%)', description: 'Target positive emotion percentage', min: '0', max: '100', suffix: '%' },
              { key: 'feedbackMinimum', label: 'Minimum Feedback Rating', description: 'Minimum acceptable customer rating', min: '1', max: '5', suffix: '★' }
            ].map(item => (
              <div key={item.key} style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e8e8e8' }}>
                <label style={{ ...labelStyle, marginBottom: '12px' }}>{item.label}</label>
                <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px 0' }}>{item.description}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={item.min}
                    max={item.max}
                    step="0.1"
                    value={settings.detectionThresholds[item.key]}
                    onChange={e => updateThreshold(item.key, e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', fontWeight: '700', color: '#0052cc' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', minWidth: '20px' }}>{item.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Sensitivity */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', marginBottom: '20px', marginTop: 0 }}>Alert Sensitivity</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Configure how aggressively the system triggers alerts</p>

          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { value: 'low', label: 'Low', desc: 'Only critical alerts' },
              { value: 'medium', label: 'Medium', desc: 'Standard alerts' },
              { value: 'high', label: 'High', desc: 'Detailed alerts' }
            ].map(level => (
              <button
                key={level.value}
                onClick={() => setSettings({ ...settings, alertSensitivity: level.value })}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: `2px solid ${settings.alertSensitivity === level.value ? '#0052cc' : '#e8e8e8'}`,
                  background: settings.alertSensitivity === level.value ? '#e8f0ff' : '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center'
                }}
                onMouseEnter={e => settings.alertSensitivity !== level.value && (e.currentTarget.style.borderColor = '#0052cc', e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => settings.alertSensitivity !== level.value && (e.currentTarget.style.borderColor = '#e8e8e8', e.currentTarget.style.background = '#fff')}
              >
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>{level.label}</p>
                <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>{level.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* System Information */}
        <div style={{ ...cardStyle, marginTop: '24px', background: '#e8f0ff', borderColor: '#d0e0ff' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0052cc', marginBottom: '12px', marginTop: 0 }}>System Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <p style={{ color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>API Base URL</p>
              <p style={{ color: '#0052cc', fontWeight: '700', margin: 0, wordBreak: 'break-all', fontSize: '12px' }}>{API_BASE}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Environment</p>
              <p style={{ color: '#10b981', fontWeight: '700', margin: 0 }}>Production</p>
            </div>
            <div>
              <p style={{ color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Last Updated</p>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Version</p>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>1.0.0</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={handleSaveSettings}
            disabled={!isWeightValid || saving}
            style={{
              padding: '12px 28px',
              background: isWeightValid && !saving ? 'linear-gradient(135deg, #2E4057 0%, #4a6fa5 100%)' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isWeightValid && !saving ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => isWeightValid && !saving && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 64, 87, 0.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}