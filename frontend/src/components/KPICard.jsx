export default function KPICard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderTop: `4px solid ${color}`
    }}>
      <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color, marginBottom: '4px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#aaa' }}>{sub}</p>
    </div>
  )
}