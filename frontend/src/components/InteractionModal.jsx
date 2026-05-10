export default function InteractionModal({ interaction, onClose }) {
  if (!interaction) return null

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
      zIndex: 1000
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