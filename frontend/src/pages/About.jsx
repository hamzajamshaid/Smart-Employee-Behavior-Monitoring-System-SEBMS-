import { useNavigate } from 'react-router-dom'

const navy = '#0c2340'
const teal = '#2ec4b6'
const slate = '#3d5a80'
const tint = '#e8f1f5'
const border = '#cfe0ea'
const pale = '#9bb3c7'

const card = { background: '#fff', border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 14px rgba(12,35,64,0.06)' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }
const h2 = { fontSize: '30px', fontWeight: '800', color: navy, margin: '0 0 12px 0', textAlign: 'center' }
const lead = { fontSize: '16px', color: slate, lineHeight: '1.7', maxWidth: '760px', margin: '0 auto 36px auto', textAlign: 'center' }
const h3 = { fontSize: '18px', fontWeight: '700', color: navy, margin: '0 0 12px 0' }
const item = { fontSize: '14px', color: slate, lineHeight: '1.7', margin: '0 0 10px 0' }
const note = { fontSize: '12px', color: slate, lineHeight: '1.6', margin: '12px 0 0 0' }
const pad = { padding: '72px 60px' }

const signals = [
  'Presence: MediaPipe detects whether the employee is at the counter.',
  'Facial emotion: a fine-tuned ResNet50 classifies facial expressions into negative, neutral, and positive groups.',
  'Response time: derived from the timestamps of an HC-SR04 ultrasonic sensor connected to an Arduino, which logs each interaction.',
  'Customer feedback: customers rate the service through a QR code linked form.',
  'Voice sentiment: a fine-tuned XLM-RoBERTa model scores the sentiment of transcribed speech in Urdu and English.',
]

const twoScores = [
  'Performance score (project report): a configurable formula combines the five signals above into a score from 0 to 100.',
  'Ticket quality score (web app): calculated when a customer resolves and rates a ticket. Customer rating counts for 60% and chat score for 40%. The chat score drops by a fixed penalty for each flagged message.',
]

const flagging = [
  'Flagging rule: a chat message is flagged when its negative probability reaches 0.8.',
  'Short messages: messages under 3 words are skipped, because there is too little text to judge.',
]

const results = [
  { label: 'Presence detection', value: '90%' },
  { label: 'Feedback linkage', value: '100%' },
  { label: 'Emotion model (test accuracy)', value: '80.4%' },
  { label: 'Sentiment model (after cleaning)', value: '80.4%' },
]

const stack = [
  'Frontend: React with Vite, styled with a navy and teal theme.',
  'Backend: Flask API with JWT sign-in and role checks for Admin, Employee, and Customer.',
  'Database: MySQL, storing users, tickets, messages, and analysis results.',
  'Background analysis: ticket analysis runs in a separate thread, and its progress is saved for the admin page.',
  'On-premise: employee video and audio are processed on the premises and never sent to an external service.',
]

function BarChart({ labels, series, label }) {
  const W = 640, H = 320, padL = 56, padR = 16, padT = 16, padB = 56
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const groupW = plotW / labels.length
  const barW = Math.min(44, (groupW * 0.8) / series.length)
  const y = v => padT + plotH - v * plotH
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={label}>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e1ebf1" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={slate}>{Math.round(t * 100)}%</text>
          </g>
        ))}
        {labels.map((lab, i) => {
          const gx = padL + i * groupW + (groupW - barW * series.length) / 2
          return (
            <g key={lab}>
              {series.map((s, j) => {
                const v = s.values[i]
                const x = gx + j * barW
                return (
                  <g key={s.name}>
                    <rect x={x + 2} y={y(v)} width={barW - 4} height={plotH * v} rx="3" fill={s.color} />
                    <text x={x + barW / 2} y={y(v) - 6} textAnchor="middle" fontSize="10" fill={navy}>{(v * 100).toFixed(1)}</text>
                  </g>
                )
              })}
              <text x={padL + i * groupW + groupW / 2} y={H - padB + 22} textAnchor="middle" fontSize="12" fill={navy}>{lab}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
        {series.map(s => (
          <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: slate }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, display: 'inline-block' }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()
  const classes = ['Negative', 'Neutral', 'Positive']
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: navy, background: '#fff' }}>
      <nav style={{ background: '#fff', borderBottom: `1px solid ${border}`, padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: navy, cursor: 'pointer' }} onClick={() => navigate('/')}>SEBMS</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: '6px', border: `1px solid ${navy}`, background: 'transparent', color: navy, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Home</button>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: navy, color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Login</button>
        </div>
      </nav>

      <section style={{ ...pad, background: `linear-gradient(180deg, ${tint} 0%, #fff 100%)`, textAlign: 'center', paddingBottom: '56px' }}>
        <h1 style={{ fontSize: '46px', fontWeight: '800', letterSpacing: '-1px', margin: '0 0 16px 0', color: navy }}>About SEBMS</h1>
        <p style={lead}>
          SEBMS is an on-premise, privacy-first system for monitoring customer service performance. It was developed for a customer service counter at an auto dealership in Multan, Pakistan, and it combines sensor data, computer vision, customer feedback, and speech sentiment into a single performance view.
        </p>
      </section>

      <section style={pad}>
        <h2 style={h2}>What it measures</h2>
        <p style={lead}>Five signals are collected for each interaction, as described in the project report.</p>
        <div style={grid}>
          <div style={card}>
            <h3 style={h3}>Five signals</h3>
            {signals.map(t => <p key={t} style={item}>{t}</p>)}
          </div>
          <div style={card}>
            <h3 style={h3}>Two different scores</h3>
            {twoScores.map(t => <p key={t} style={item}>{t}</p>)}
          </div>
        </div>
      </section>

      <section style={{ ...pad, background: tint }}>
        <h2 style={h2}>Models and results</h2>
        <p style={lead}>All figures are from held-out test sets. Each model was fine-tuned from pretrained weights.</p>
        <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '28px' }}>
          {results.map(r => (
            <div key={r.label} style={{ ...card, textAlign: 'center', borderTop: `4px solid ${teal}` }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: navy }}>{r.value}</div>
              <div style={{ fontSize: '13px', color: slate, marginTop: '6px' }}>{r.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))' }}>
          <div style={card}>
            <h3 style={h3}>Emotion models: accuracy and macro-F1</h3>
            <BarChart
              label="Emotion model accuracy and macro-F1"
              labels={['Accuracy', 'Macro-F1']}
              series={[
                { name: 'ResNet50', color: navy, values: [0.8037, 0.7678] },
                { name: 'ConvNeXt-Tiny', color: teal, values: [0.7955, 0.76] },
                { name: 'EfficientNet-B0', color: pale, values: [0.786, 0.7475] },
              ]}
            />
            <p style={note}>FER2013 test set, surprise removed, three emotion groups.</p>
          </div>
          <div style={card}>
            <h3 style={h3}>Emotion models: recall per class</h3>
            <BarChart
              label="Emotion model recall per class"
              labels={classes}
              series={[
                { name: 'ResNet50', color: navy, values: [0.885, 0.551, 0.829] },
                { name: 'ConvNeXt-Tiny', color: teal, values: [0.86, 0.543, 0.852] },
                { name: 'EfficientNet-B0', color: pale, values: [0.853, 0.516, 0.851] },
              ]}
            />
            <p style={note}>Neutral is the hardest class for every emotion model.</p>
          </div>
          <div style={card}>
            <h3 style={h3}>Sentiment model: precision, recall, F1</h3>
            <BarChart
              label="Sentiment model precision, recall and F1 per class"
              labels={classes}
              series={[
                { name: 'Precision', color: navy, values: [0.830, 0.831, 0.817] },
                { name: 'Recall', color: teal, values: [0.844, 0.798, 0.838] },
                { name: 'F1', color: pale, values: [0.837, 0.814, 0.828] },
              ]}
            />
            <p style={note}>Calculated from the test confusion matrix before near-duplicate removal. Overall accuracy and macro-F1 are both 82.6%.</p>
          </div>
          <div style={card}>
            <h3 style={h3}>Sentiment model: accuracy by language</h3>
            <BarChart
              label="Sentiment model accuracy by language after cleaning"
              labels={['English', 'Urdu', 'All']}
              series={[
                { name: 'Accuracy (after cleaning)', color: teal, values: [0.74, 0.901, 0.804] },
              ]}
            />
            <p style={note}>Test rows with a near-copy in the training data were removed before scoring.</p>
          </div>
        </div>

        <div style={{ ...grid, gridTemplateColumns: 'minmax(260px, 1fr)', marginTop: '20px' }}>
          <div style={card}>
            <h3 style={h3}>How chat flagging works</h3>
            {flagging.map(t => <p key={t} style={item}>{t}</p>)}
          </div>
        </div>
      </section>

      <section style={pad}>
        <h2 style={h2}>Scoring and architecture</h2>
        <p style={lead}>The system is split into a web frontend, an API, a database, and a background analysis step.</p>
        <div style={grid}>
          <div style={card}>
            <h3 style={h3}>Ticket quality score</h3>
            <p style={item}>Calculated when a customer resolves and rates a ticket. Customer rating counts for 60% and chat score for 40%.</p>
            <p style={item}>The chat score drops by a fixed penalty for each flagged message.</p>
          </div>
          <div style={card}>
            <h3 style={h3}>Architecture</h3>
            {stack.map(t => <p key={t} style={item}>{t}</p>)}
          </div>
        </div>
      </section>

      <section style={{ ...pad, background: navy, textAlign: 'center' }}>
        <h2 style={{ ...h2, color: '#fff' }}>Sign in to get started</h2>
        <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: teal, color: navy, fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}>Go to login</button>
      </section>

      <footer style={{ padding: '28px 60px', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: slate }}>SEBMS, Smart Employee Behavior Monitoring System</div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: navy, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Home</button>
      </footer>
    </div>
  )
}
