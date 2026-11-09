import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
const API_BASE = ''

export default function ScoreBreakdownModal({ interactionId, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API_BASE}/api/scores/${interactionId}/breakdown`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Could not load breakdown'))
  }, [interactionId])

  const th = { textAlign: 'left', padding: '8px', fontSize: '12px', color: '#0052cc', borderBottom: '2px solid #0052cc' }
  const td = { padding: '8px', fontSize: '13px', color: '#333', borderBottom: '1px solid #eee' }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: 'min(760px, 100%)', boxSizing: 'border-box', margin: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#0052cc', fontSize: '18px' }}>Unified score breakdown · session #{interactionId}</h3>
          <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid #0052cc', background: '#fff', color: '#0052cc', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
        {error && <p style={{ color: '#C0392B' }}>{error}</p>}
        {!data && !error && <p>Loading…</p>}
        {data && (
          <>
            <p style={{ fontSize: '13px', color: '#555', marginTop: 0 }}>
              Unified score: <strong>{data.unified_score ?? '—'}</strong> · status: {data.score_status}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Component', 'Score', 'Configured weight', 'Share of unified', 'Points'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.components.map(c => (
                  <tr key={c.key}>
                    <td style={td}>{c.label}</td>
                    <td style={td}>{c.status === 'used' ? c.score : '—'}</td>
                    <td style={td}>{data.configured_weights_pct[c.key]}%</td>
                    <td style={td}>{c.status === 'used' ? `${c.weight_pct}%` : 'Not measured'}</td>
                    <td style={td}>{c.status === 'used' ? c.points : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '12px', color: '#777', marginBottom: 0 }}>
              Shares are re-scaled over the components that were measured, so they add up to 100%. Points add up to the unified score.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
