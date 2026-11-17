import { useNavigate } from 'react-router-dom'

const features = [
  { title: 'Batch behavior analysis', text: 'Presence, emotion, response time, and voice quality are analyzed in scheduled processing cycles.' },
  { title: 'Customer ticket management', text: 'Customers open tickets, chat with staff in real time, and mark issues resolved.' },
  { title: 'Automatic assignment', text: 'A new ticket goes to the active employee with the fewest open tickets.' },
  { title: 'Ticket quality scoring', text: 'Customer ratings and chat sentiment combine into a quality score, with flagged messages for review.' },
]

const steps = [
  { n: '01', title: 'Collect', text: 'Interactions and customer feedback are recorded as they happen.' },
  { n: '02', title: 'Process', text: 'Data is analyzed in scheduled batches so results stay consistent.' },
  { n: '03', title: 'Review', text: 'Admins review quality scores and flagged messages on the Tickets page.' },
]

const roles = [
  { role: 'Admin', text: 'Oversees ticket quality, flagged messages, and staff assignments.' },
  { role: 'Employee', text: 'Handles assigned tickets and chats with customers.' },
  { role: 'Customer', text: 'Opens tickets, chats with staff, and rates resolved issues.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const navy = '#0c2340'
  const teal = '#2ec4b6'
  const slate = '#3d5a80'
  const tint = '#e8f1f5'
  const border = '#cfe0ea'

  const btnPrimary = {
    padding: '12px 28px', borderRadius: '8px', border: 'none', background: navy,
    color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
  }
  const btnGhost = {
    padding: '12px 28px', borderRadius: '8px', border: `1px solid ${navy}`,
    background: 'transparent', color: navy, fontSize: '15px', fontWeight: '700', cursor: 'pointer',
  }
  const sectionTitle = { fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0', color: navy, textAlign: 'center' }
  const sectionSub = { fontSize: '16px', color: slate, margin: '0 auto 40px auto', maxWidth: '640px', textAlign: 'center', lineHeight: '1.6' }
  const card = { background: '#fff', border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 14px rgba(12,35,64,0.06)' }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: navy, background: '#fff' }}>
      <style>{`
        .landing-shield-wrap { width: 44px; perspective: 300px; flex-shrink: 0; }
        .landing-shield-flip { position: relative; width: 100%; transform-style: preserve-3d; animation: sebms-landing-flip 12s linear infinite; }
        .landing-shield-face { display: block; width: 100%; height: auto; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .landing-shield-back { position: absolute; top: 0; left: 0; transform: rotateY(180deg); }
        @keyframes sebms-landing-flip { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @media (prefers-reduced-motion: reduce) { .landing-shield-flip { animation: none; } }
      `}</style>

      <nav style={{ background: '#fff', borderBottom: `1px solid ${border}`, padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
          <div className="landing-shield-wrap">
            <div className="landing-shield-flip">
              <img className="landing-shield-face" src="/sebms-shield.png" alt="" />
              <img className="landing-shield-face landing-shield-back" src="/sebms-shield.png" alt="" aria-hidden="true" />
            </div>
          </div>
          <img src="/sebms-wordmark.png" alt="SEBMS" style={{ width: '170px', maxWidth: '100%', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => navigate('/about')} style={{ ...btnGhost, padding: '10px 24px', fontSize: '14px' }}>About</button><button onClick={() => navigate('/login')} style={{ ...btnPrimary, padding: '10px 24px', fontSize: '14px' }}>Login</button></div>
      </nav>

      <section style={{ background: `linear-gradient(180deg, ${tint} 0%, #fff 100%)`, padding: '96px 60px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '999px', background: '#fff', border: `1px solid ${border}`, color: slate, fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>
          Privacy-first performance monitoring
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1px', margin: '0 auto 20px auto', maxWidth: '900px', color: navy }}>
          Smart Employee Behavior Monitoring System
        </h1>
        <p style={{ fontSize: '18px', color: slate, lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 36px auto' }}>
          SEBMS analyzes customer service interactions in scheduled batches and turns them into clear, fair performance insights for admins, employees, and customers.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={btnPrimary}>Login to SEBMS</button>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} style={btnGhost}>See features</button>
        </div>
      </section>

      <section id="features" style={{ padding: '80px 60px', background: '#fff' }}>
        <h2 style={sectionTitle}>What SEBMS does</h2>
        <p style={sectionSub}>Built for customer service teams that want consistent measurement and transparent feedback.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          {features.map(f => (
            <div key={f.title} style={card}>
              <div style={{ width: '40px', height: '4px', background: teal, borderRadius: '2px', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px 0', color: navy }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: slate, lineHeight: '1.6', margin: 0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 60px', background: tint }}>
        <h2 style={sectionTitle}>How it works</h2>
        <p style={sectionSub}>Each cycle follows the same three steps, so every result can be traced back to its source.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          {steps.map(s => (
            <div key={s.n} style={{ ...card, background: '#fff' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: teal, marginBottom: '12px' }}>{s.n}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px 0', color: navy }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: slate, lineHeight: '1.6', margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 60px', background: '#fff' }}>
        <h2 style={sectionTitle}>Who uses SEBMS</h2>
        <p style={sectionSub}>Each role sees only what it needs.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          {roles.map(r => (
            <div key={r.role} style={card}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px 0', color: navy }}>{r.role}</h3>
              <p style={{ fontSize: '14px', color: slate, lineHeight: '1.6', margin: 0 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '72px 60px', background: navy, textAlign: 'center' }}>
        <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#fff', margin: '0 0 12px 0' }}>Ready to sign in?</h2>
        <p style={{ fontSize: '16px', color: '#cfe0ea', margin: '0 auto 28px auto', maxWidth: '560px', lineHeight: '1.6' }}>Use your role's login to access your dashboard.</p>
        <button onClick={() => navigate('/login')} style={{ ...btnPrimary, background: teal, color: navy }}>Go to login</button>
      </section>

      <footer style={{ padding: '28px 60px', background: '#fff', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: slate }}>SEBMS, Smart Employee Behavior Monitoring System</div>
        <div style={{ display: 'flex', gap: '20px' }}><button onClick={() => navigate('/about')} style={{ background: 'none', border: 'none', color: navy, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>About</button><button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: navy, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Login</button></div>
      </footer>
    </div>
  )
}
