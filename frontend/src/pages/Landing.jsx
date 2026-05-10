import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      {/* Navigation */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
          <div style={{ width: '36px', height: '36px', background: '#0052cc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '18px' }}>S</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0052cc', letterSpacing: '-0.5px' }}>SEBMS</div>
        </div>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 24px', borderRadius: '6px', border: '1px solid #0052cc', background: '#0052cc', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.15s linear' }} onMouseEnter={e => { e.target.style.background = '#003d99'; e.target.style.borderColor = '#003d99' }} onMouseLeave={e => { e.target.style.background = '#0052cc'; e.target.style.borderColor = '#0052cc' }}>
          Login
        </button>
      </nav>
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f6ff 100%)', padding: '100px 60px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '800', color: '#0052cc', margin: '0 0 16px 0', lineHeight: '1.2', letterSpacing: '-1px' }}>Smart Employee Behavior Monitoring System</h1>
        <p style={{ fontSize: '18px', color: '#555', margin: '0', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>Comprehensive batch-based monitoring and AI-powered analysis of employee performance. Analyze presence, emotion, response time, voice quality, and customer feedback through periodic processing cycles.</p>
      </section>
      {/* Key Metrics */}
      <section style={{ background: '#ffffff', padding: '60px 60px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { label: 'Performance Metrics', value: '5', desc: 'Unified Score Components' },
            { label: 'Batch Processing', value: 'Scheduled', desc: 'Daily/Weekly Analysis' },
            { label: 'Data Models', value: '14+', desc: 'Relational Database' },
            { label: 'AI Analysis', value: 'Advanced', desc: 'Computer Vision & NLP' }
          ].map((metric, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: '0 0 8px 0' }}>{metric.value}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>{metric.label}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{metric.desc}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Overview Section */}
      <section style={{ background: '#f8fafc', padding: '80px 60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 40px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>System Overview</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#0052cc', margin: '0 0 16px 0' }}>What SEBMS Does</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
              <p style={{ margin: '0 0 16px 0' }}>SEBMS is an intelligent employee behavior monitoring system designed for customer service environments. It processes interaction data in scheduled batches and provides comprehensive insights.</p>
              <p style={{ margin: '0 0 16px 0' }}><strong style={{ color: '#0052cc' }}>Batch Processing Workflow:</strong></p>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
                <li style={{ margin: '6px 0' }}>📹 Collect video/audio from interactions</li>
                <li style={{ margin: '6px 0' }}>📦 Process in scheduled batch cycles</li>
                <li style={{ margin: '6px 0' }}>😊 Analyze emotion, presence, response time</li>
                <li style={{ margin: '6px 0' }}>🎙️ Voice tone and sentiment analysis</li>
                <li style={{ margin: '6px 0' }}>⭐ Aggregate customer feedback and ratings</li>
              </ul>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '2px solid #d0e0ff', borderRadius: '8px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0052cc', margin: '0 0 24px 0', textAlign: 'center' }}>Scoring Components (Unified Score)</h3>
            {[
              { name: 'Presence Score', emoji: '👁️', desc: 'Face detection at counter', weight: '20%' },
              { name: 'Emotion Score', emoji: '😊', desc: 'Positive sentiment ratio', weight: '25%' },
              { name: 'Response Score', emoji: '⏰', desc: 'Speed of response (≤15s)', weight: '20%' },
              { name: 'Feedback Score', emoji: '⭐', desc: 'Customer rating (1-5 stars)', weight: '20%' },
              { name: 'Voice Score', emoji: '🎙️', desc: 'Tone & sentiment analysis', weight: '15%' }
            ].map((component, i) => (
              <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: i < 4 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{component.emoji}</span>
                    <span style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>{component.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', background: '#e8f0ff', padding: '2px 8px', borderRadius: '4px' }}>{component.weight}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>{component.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* System Architecture Section */}
      <section style={{ background: '#ffffff', padding: '80px 60px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>System Architecture</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Layer 1 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ background: '#f0f6ff', border: '1px solid #d0e0ff', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Layer 1: Presentation</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { icon: '🎨', title: 'Admin Portal', desc: 'Dashboard, Reports, Alerts' },
                  { icon: '👤', title: 'Employee Portal', desc: 'Performance Tracking' },
                  { icon: '📱', title: 'Customer Portal', desc: 'Tickets, Feedback' }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0052cc', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '20px', color: '#0052cc', margin: '0 0 30px 0' }}>↓</div>
          {/* Layer 2 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ background: '#e8f0ff', border: '1px solid #b5d4f4', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Layer 2: API & Business Logic</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { icon: '⚙️', title: 'Flask REST API', desc: '25+ Endpoints, JWT Auth' },
                  { icon: '📊', title: 'Score Engine', desc: '5-Component Algorithm' },
                  { icon: '🚨', title: 'Alert System', desc: 'Real-time Notifications' }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #d0e0ff', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0052cc', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '20px', color: '#0052cc', margin: '0 0 30px 0' }}>↓</div>
          {/* Layer 3 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ background: '#f0f6ff', border: '1px solid #d0e0ff', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Layer 3: AI Processing</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { icon: '😊', title: 'Emotion', desc: 'DeepFace' },
                  { icon: '👁️', title: 'Presence', desc: 'OpenCV' },
                  { icon: '🎙️', title: 'Voice', desc: 'Audio Model' },
                  { icon: '⏰', title: 'Response', desc: 'Tracking' }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#0052cc', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '20px', color: '#0052cc', margin: '0 0 30px 0' }}>↓</div>
          {/* Layer 4 */}
          <div>
            <div style={{ background: '#e8f0ff', border: '1px solid #b5d4f4', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Layer 4: Data Storage</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { icon: '🎥', title: 'Interactions', desc: '5 fields' },
                  { icon: '📊', title: 'Scores', desc: '8 fields' },
                  { icon: '👥', title: 'Employees', desc: '8 fields' },
                  { icon: '🚨', title: 'Alerts', desc: '6 fields' }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #d0e0ff', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0052cc', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Batch Processing Flow */}
      <section style={{ background: '#f8fafc', padding: '80px 60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>Batch Processing Data Flow</h2>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '50px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px', textAlign: 'center' }}>Phase 1: Data Collection (Continuous)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {[
                { icon: '📹', title: 'Video Recording', desc: 'Capture interactions at counters' },
                { icon: '🎤', title: 'Audio Capture', desc: 'Record conversation dialogue' },
                { icon: '⏱️', title: 'Timestamps', desc: 'Log interaction timing' },
                { icon: '👤', title: 'Employee ID', desc: 'Associate with staff member' },
                { icon: '⭐', title: 'QR Feedback', desc: 'Collect customer ratings' }
              ].map((item, i) => (
                <div key={i} style={{ background: '#f0f6ff', border: '1px solid #d0e0ff', borderRadius: '8px', padding: '20px', textAlign: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,204,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{item.icon}</div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0052cc', margin: '0 0 4px 0' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0', lineHeight: '1.4' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '28px', color: '#0052cc', margin: '0 0 50px 0', fontWeight: '300' }}>↓</div>
          <div style={{ marginBottom: '50px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px', textAlign: 'center' }}>Phase 2: Scheduled Batch Processing</div>
            <div style={{ background: '#fff4e6', border: '2px solid #ff9500', borderRadius: '8px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#ff9500', margin: '0' }}>⏰ Processing Cycles: Daily, Weekly, or Custom Schedule</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {[
                { icon: '😊', title: 'Emotion Analysis', tech: 'Batch Job' },
                { icon: '👁️', title: 'Face Detection', tech: 'CV Pipeline' },
                { icon: '⏰', title: 'Response Time', tech: 'Aggregation' },
                { icon: '🎙️', title: 'Voice Analysis', tech: 'Audio Batch' },
                { icon: '💬', title: 'Sentiment', tech: 'NLP Batch' },
                { icon: '📊', title: 'Data Merge', tech: 'ETL Process' }
              ].map((item, i) => (
                <div key={i} style={{ background: '#e8f0ff', border: '1px solid #b5d4f4', borderRadius: '8px', padding: '16px', textAlign: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,204,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>{item.icon}</div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#0052cc', margin: '0 0 3px 0' }}>{item.title}</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0' }}>{item.tech}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '28px', color: '#0052cc', margin: '0 0 50px 0', fontWeight: '300' }}>↓</div>
          <div style={{ marginBottom: '50px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px', textAlign: 'center' }}>Phase 3: Results Stored in Database</div>
            <div style={{ background: '#e8f0ff', border: '2px solid #0052cc', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { table: 'Interactions', fields: 5, desc: 'Recorded sessions' },
                  { table: 'Behavioral Scores', fields: 8, desc: 'Component scores' },
                  { table: 'Employees', fields: 8, desc: 'Staff information' },
                  { table: 'Alerts', fields: 6, desc: 'Triggered conditions' }
                ].map((db, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #d0e0ff', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0052cc', marginBottom: '4px' }}>{db.table}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{db.fields} fields</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{db.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '28px', color: '#0052cc', margin: '0 0 50px 0', fontWeight: '300' }}>↓</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px', textAlign: 'center' }}>Phase 4: Dashboard & Reports (Updated After Batch)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { icon: '📊', title: 'Performance Dashboard', users: 'Admin', features: ['Updated Reports', 'Trend Analysis', 'Top Performers'] },
                { icon: '🚨', title: 'Batch-Based Alerts', users: 'Admin', features: ['Triggered Alerts', 'Anomalies', 'Drill-down'] },
                { icon: '📈', title: 'Analytics Reports', users: 'Admin', features: ['Period Reports', 'Comparisons', 'Export'] },
                { icon: '🎯', title: 'Insights & Actions', users: 'Teams', features: ['Recommendations', 'Training', 'Coaching'] }
              ].map((item, i) => (
                <div key={i} style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: '8px', padding: '20px', textAlign: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{item.icon}</div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', margin: '0 0 4px 0' }}>{item.title}</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px 0' }}>{item.users}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {item.features.map((f, idx) => (
                      <span key={idx} style={{ fontSize: '10px', background: '#e0f5e9', color: '#10b981', padding: '2px 6px', borderRadius: '3px' }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section style={{ background: '#f8fafc', padding: '80px 60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>Batch Processing Workflow</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          {[
            { num: '01', title: 'Collect', desc: 'Videos, audio, and timestamps collected continuously at counters throughout the day' },
            { num: '02', title: 'Batch Process', desc: 'Scheduled batch jobs run daily/weekly to process all collected interaction data' },
            { num: '03', title: 'Calculate', desc: 'Compute presence, emotion, response, feedback, and voice scores for each interaction' },
            { num: '04', title: 'Report', desc: 'Generate dashboards, alerts, and reports. Update admin console with insights' }
          ].map((step, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: '0 0 12px 0' }}>{step.num}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>{step.title}</h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '0', lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Features */}
      <section style={{ background: '#ffffff', padding: '80px 60px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>Core Features</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: '📊', title: 'Batch Dashboard', items: ['Period-based views', 'Historical trends', 'Top performers', 'Export reports'] },
            { icon: '🤖', title: 'AI-Powered Scoring', items: ['5-component algo', 'Batch calculation', 'Behavioral trends', 'Anomaly detection'] },
            { icon: '🎫', title: 'Ticket Management', items: ['Issue tracking', 'Priority assign', 'Status workflow', 'Resolution notes'] },
            { icon: '📦', title: 'Batch Processing', items: ['Scheduled jobs', 'Bulk analysis', 'Data ETL', 'Result storage'] },
            { icon: '🚨', title: 'Smart Alerts', items: ['Batch triggers', 'Low scores', 'Absences', 'Drill-down'] },
            { icon: '😊', title: 'Emotion Detection', items: ['Facial analysis', 'Batch trends', 'Sentiment track', 'Insights'] }
          ].map((feature, idx) => (
            <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>{feature.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {feature.items.map((item, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#666', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#0052cc', fontWeight: '700' }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {/* Technology Stack */}
      <section style={{ background: '#f8fafc', padding: '80px 60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>Technology Stack</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { title: 'Frontend', icon: '🎨', items: ['React 18', 'Vite', 'React Router', 'Recharts', 'Axios'] },
            { title: 'Backend', icon: '⚙️', items: ['Flask 2.3', 'SQLAlchemy ORM', 'JWT Auth', 'RESTful API', 'CORS'] },
            { title: 'Database', icon: '💾', items: ['MySQL 8.0', 'Relational DB', 'Encrypted Storage', 'Backups', 'Indexes'] },
            { title: 'Batch & AI', icon: '🧠', items: ['Batch Jobs', 'Computer Vision', 'Emotion Detection', 'Voice Analysis', 'NLP'] }
          ].map((stack, idx) => (
            <div key={idx} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>{stack.icon}</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0052cc', margin: '0' }}>{stack.title}</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stack.items.map((item, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#555', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#0052cc', fontWeight: '700', fontSize: '14px' }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {/* Database Models */}
      <section style={{ background: '#ffffff', padding: '80px 60px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 60px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>Database Schema</h2>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {[
              { name: 'User Management', tables: [
                  { table: 'Employee', icon: '👥', fields: ['id', 'name', 'counter_id', 'status', 'hire_date'] },
                  { table: 'Customer', icon: '👤', fields: ['id', 'full_name', 'phone', 'email', 'is_active'] }
                ]
              },
              { name: 'Batch Processing Records', tables: [
                  { table: 'Interaction', icon: '🎥', fields: ['id', 'employee_id', 'start_time', 'end_time', 'video_path'] },
                  { table: 'BehavioralScore', icon: '📊', fields: ['id', 'employee_id', 'components', 'unified_score', 'date'] }
                ]
              },
              { name: 'Analysis Results', tables: [
                  { table: 'EmotionRecord', icon: '😊', fields: ['id', 'interaction_id', 'emotion_score', 'dominant_emotion'] },
                  { table: 'VoiceRecord', icon: '🎙️', fields: ['id', 'interaction_id', 'voice_score', 'tone_analysis'] }
                ]
              },
              { name: 'Support Systems', tables: [
                  { table: 'Ticket', icon: '🎫', fields: ['id', 'customer_id', 'employee_id', 'priority', 'status'] },
                  { table: 'Appointment', icon: '📅', fields: ['id', 'customer_id', 'employee_id', 'date', 'status'] }
                ]
              }
            ].map((group, groupIdx) => (
              <div key={groupIdx} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0052cc', margin: '0 0 16px 0' }}>{group.name}</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {group.tables.map((db, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #d0e0ff', borderRadius: '6px', padding: '12px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{db.icon}</span>
                        <span style={{ fontWeight: '700', color: '#1a1a1a', fontSize: '13px' }}>{db.table}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {db.fields.map((field, idx) => (
                          <span key={idx} style={{ fontSize: '11px', background: '#e8f0ff', color: '#0052cc', padding: '2px 6px', borderRadius: '3px', fontWeight: '500' }}>{field}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer style={{ background: '#1a2332', color: '#fff', padding: '50px 60px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>Smart Employee Behavior Monitoring System</h3>
            <p style={{ fontSize: '13px', margin: '0', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>SEBMS is an intelligent batch-processing monitoring system for customer service environments. It analyzes employee-customer interactions through scheduled processing cycles and provides comprehensive insights for performance optimization and staff development.</p>
          </div>
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', margin: '0', color: 'rgba(255,255,255,0.7)' }}>© 2026 All Rights Reserved</p>
            <p style={{ fontSize: '12px', margin: '0', color: 'rgba(255,255,255,0.7)' }}>Department of Computer Science • NUML, Islamabad</p>
          </div>
        </div>
      </footer>
    </div>
  )
}