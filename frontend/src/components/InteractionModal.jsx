import { useState } from 'react'

export default function InteractionModal({ interaction, onClose }) {
  const [showTranscript, setShowTranscript] = useState(!!interaction?.openTranscript)
  if (!interaction) return null

  const text = interaction.transcript || ''
  const flags = (interaction.red_flags || []).map(w => w.toLowerCase())
  const clean = t => t.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '').toLowerCase()

  if (interaction.openTranscript) {
    const tokens = text.split(/(\s+)/)
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E4057' }}>Transcript{interaction.transcript_language ? ` (${interaction.transcript_language})` : ''}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa' }}>×</button>
          </div>
          {text ? (
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#1a1a1a' }}>
              {tokens.map((tok, i) => flags.includes(clean(tok))
                ? <mark key={i} style={{ background: '#fecaca', color: '#b91c1c', fontWeight: 700, borderRadius: '3px', padding: '0 2px' }}>{tok}</mark>
                : <span key={i}>{tok}</span>)}
            </p>
          ) : (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No transcript for this session.</p>
          )}
          {flags.length > 0 && <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '12px' }}>Red-flag words found: {flags.length}</p>}
          <button onClick={onClose} style={{ width: '100%', padding: '12px', marginTop: '20px', background: '#2E4057', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E4057' }}>Interaction Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Employee</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#2E4057' }}>{interaction.employee_name}</p>
          </div>

          <div>
            <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Time</p>
            <p style={{ fontSize: '14px', color: '#555' }}>{interaction.start_time}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Presence</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: interaction.present ? '#27AE60' : '#C0392B' }}>
                {interaction.present ? '✓ Present' : '✗ Absent'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Emotion</p>
              <p style={{ fontSize: '14px', color: '#555' }}>{interaction.emotion ? `${Math.round(interaction.emotion)}%` : '—'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Voice</p>
              <p style={{ fontSize: '14px', color: '#555' }}>{interaction.voice ? `${Math.round(interaction.voice)}%` : '—'}</p>
              <button type="button" onClick={() => setShowTranscript(s => !s)} style={{ marginTop: '6px', background: 'none', border: '1px solid #2E4057', color: '#2E4057', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                {showTranscript ? 'Hide transcript' : 'View transcript'}
              </button>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Response Time</p>
              <p style={{ fontSize: '14px', color: '#555' }}>{interaction.response ? `${interaction.response}s` : '—'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Customer Rating</p>
              <p style={{ fontSize: '14px', color: '#555' }}>{interaction.feedback ? `${interaction.feedback}★` : '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Duration</p>
              <p style={{ fontSize: '14px', color: '#555' }}>{interaction.end_time ? '5 min' : '—'}</p>
            </div>
          </div>
        </div>

        {showTranscript && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#F7F9FC', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px' }}>Transcript{interaction.transcript_language ? ` (${interaction.transcript_language})` : ''}</p>
            {text ? (
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#1a1a1a' }}>
                {text.split(/(\s+)/).map((tok, i) => flags.includes(clean(tok))
                  ? <mark key={i} style={{ background: '#fecaca', color: '#b91c1c', fontWeight: 700, borderRadius: '3px', padding: '0 2px' }}>{tok}</mark>
                  : <span key={i}>{tok}</span>)}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280' }}>No transcript for this session.</p>
            )}
            {flags.length > 0 && <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '8px' }}>Red-flag words found: {flags.length}</p>}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            background: '#2E4057',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}