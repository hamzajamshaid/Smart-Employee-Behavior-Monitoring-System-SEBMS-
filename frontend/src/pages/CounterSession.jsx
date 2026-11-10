import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import API_BASE from '../config';
import useFacePresence from '../hooks/useFacePresence';

const ABSENT_HOLD_MS = 10000;
const POLL_MS = 1000;
const LIVE_CHUNK_MS = 12000;
const FRAME_MS = 2000;

export default function CounterSession() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(null);
  const eventsRef = useRef([]);
  const absentSinceRef = useRef(null);
  const recordingRef = useRef(false);

  const [status, setStatus] = useState('Waiting for a customer');
  const [recording, setRecording] = useState(false);
  const [responded, setResponded] = useState(false);
  const [interactionId, setInteractionId] = useState(null);
  const [sensor, setSensor] = useState({ present: false, since: null });
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const [emotion, setEmotion] = useState(null);
  const { present: employeePresent, error: faceError } = useFacePresence(videoRef);
  const frameBusyRef = useRef(false);
  const liveRecRef = useRef(null);
  const liveActiveRef = useRef(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => setStatus('Camera or microphone error: ' + err.message));
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const upload = async (blob) => {
    const startedAt = startedAtRef.current;
    const seconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
    const formData = new FormData();
    formData.append('video', blob, 'capture.webm');
    formData.append('duration_seconds', seconds);
    formData.append('events', JSON.stringify(eventsRef.current));
    formData.append('recording_started_at', startedAt || '');
    try {
      const res = await axios.post(`${API_BASE}/api/simulate/capture`, formData, { headers, timeout: 60000 });
      if (res.data.interaction_id) {
        setInteractionId(res.data.interaction_id);
        setStatus('Session saved. Ask the customer to scan the QR code.');
      } else {
        setStatus('Upload finished but no session ID came back.');
      }
    } catch (e) {
      setStatus('Upload error: ' + (e.response?.data?.error || e.message));
    }
  };

  const uploadLiveChunk = async (blob) => {
    if (blob.size < 1000) return;
    const id = `${Date.now()}-${Math.random()}`;
    const at = new Date().toLocaleTimeString();
    setTranscriptLines((prev) => [...prev, { id, at, pending: true, startedMs: Date.now() }]);
    const formData = new FormData();
    formData.append('audio', blob, 'chunk.webm');
    try {
      const res = await axios.post(`${API_BASE}/api/sensor/transcribe-chunk`, formData, { headers, timeout: 240000 });
      setTranscriptLines((prev) => (res.data.text
        ? prev.map((l) => (l.id === id ? { ...l, pending: false, text: res.data.text } : l))
        : prev.filter((l) => l.id !== id)));
    } catch (e) {
      setTranscriptLines((prev) => prev.map((l) => (l.id === id ? { ...l, pending: false, text: 'This part could not be transcribed.' } : l)));
    }
  };

  const startLiveChunk = () => {
    if (!liveActiveRef.current || !streamRef.current) return;
    const chunkRec = new MediaRecorder(new MediaStream(streamRef.current.getAudioTracks()), { mimeType: 'audio/webm' });
    const parts = [];
    chunkRec.ondataavailable = (e) => parts.push(e.data);
    chunkRec.onstop = () => {
      uploadLiveChunk(new Blob(parts, { type: 'audio/webm' }));
      startLiveChunk();
    };
    chunkRec.start();
    liveRecRef.current = chunkRec;
    setTimeout(() => { if (chunkRec.state === 'recording') chunkRec.stop(); }, LIVE_CHUNK_MS);
  };

  const startRecording = () => {
    if (recordingRef.current) return;
    if (!streamRef.current) {
      setStatus('Camera not ready. Allow camera and microphone access, then reload.');
      return;
    }
    chunksRef.current = [];
    const startedAt = new Date().toISOString();
    startedAtRef.current = startedAt;
    eventsRef.current = [{ type: 'arrival', at: startedAt }];
    const rec = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    rec.ondataavailable = (e) => chunksRef.current.push(e.data);
    rec.onstop = () => upload(new Blob(chunksRef.current, { type: 'video/webm' }));
    rec.start();
    recorderRef.current = rec;
    liveActiveRef.current = true;
    setTranscriptLines([]);
    startLiveChunk();
    recordingRef.current = true;
    setRecording(true);
    setResponded(false);
    setInteractionId(null);
    setStatus('Customer detected. Recording...');
  };

  const markResponded = () => {
    if (!recordingRef.current || responded) return;
    eventsRef.current.push({ type: 'response', at: new Date().toISOString() });
    setResponded(true);
    setStatus('Employee responded. Recording...');
  };

  // Auto-detect the employee's first spoken word from the same microphone stream.
  // Measures background noise for 1.5 s, then records a response once speech stays
  // above the threshold for 300 ms. The "Employee responded" button remains a fallback.
  useEffect(() => {
    if (!recording || responded || !streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createMediaStreamSource(new MediaStream(audioTracks));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const armedAt = Date.now();
    let noiseFloor = Infinity;
    let calibSum = 0;
    let calibCount = 0;
    let loudSince = null;

    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);

      if (Date.now() - armedAt < 1500) {
        noiseFloor = Math.min(noiseFloor, rms);
        setStatus(`Calibrating microphone... level ${rms.toFixed(3)}`);
        return;
      }

      const threshold = Math.min(0.05, Math.max(0.006, noiseFloor * 2));
      setStatus(`Listening... level ${rms.toFixed(3)} / threshold ${threshold.toFixed(3)}`);
      if (rms > threshold) {
        if (loudSince === null) loudSince = Date.now();
        if (Date.now() - loudSince >= 300) {
          const respondedAt = Date.now();
          eventsRef.current.push({ type: 'response', at: new Date(respondedAt).toISOString(), source: 'speech' });
          const arrivalMs = new Date(eventsRef.current[0].at).getTime();
          setResponded(true);
          setStatus(`Response detected at ${((respondedAt - arrivalMs) / 1000).toFixed(1)} seconds`);
        }
      } else {
        loudSince = null;
      }
    }, 100);

    return () => {
      clearInterval(timer);
      ctx.close();
    };
  }, [recording, responded]);

  const stopRecording = () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setStatus('Customer left. Saving...');
    liveActiveRef.current = false;
    if (liveRecRef.current && liveRecRef.current.state === 'recording') liveRecRef.current.stop();
    recorderRef.current.stop();
  };

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sensor/state`, { headers });
        setSensor({ present: !!res.data.is_present, since: res.data.since });
        if (res.data.is_present) {
          absentSinceRef.current = null;
          startRecording();
        } else if (recordingRef.current) {
          if (!absentSinceRef.current) absentSinceRef.current = Date.now();
          if (Date.now() - absentSinceRef.current >= ABSENT_HOLD_MS) {
            absentSinceRef.current = null;
            stopRecording();
          }
        }
      } catch (e) {
        setStatus('Sensor check failed: ' + e.message);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const feedbackUrl = interactionId ? `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/feedback/${interactionId}` : null;

  const pill = (bg) => ({ background: bg, color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 });
  const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h2>Counter session</h2>
      <div style={{ background: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        Notice: this counter records audio and video during your visit to improve service. Recordings are used only for service analysis.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block' }} />
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
              <span style={pill('#dc2626')}>● LIVE</span>
              <span style={pill(employeePresent ? '#16a34a' : '#6b7280')}>{faceError ? 'FACE CHECK OFF' : employeePresent ? 'EMPLOYEE PRESENT' : 'EMPLOYEE ABSENT'}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(17,24,39,0.8)', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 14 }}>
              {emotion === null
                ? 'Facial sentiment: processed after the session'
                : emotion.face
                  ? `Facial sentiment: ${cap(emotion.label)} · Positive ${emotion.positive_pct}%`
                  : 'Facial sentiment: no face detected'}
            </div>
          </div>
          <p style={{ fontWeight: 600 }}>{recording ? '🔴 ' : ''}{status}</p>
          {recording && (
            <button
              type="button"
              onClick={markResponded}
              disabled={responded}
              style={{ display: 'none', padding: '10px 16px', borderRadius: 6, border: 'none', background: responded ? '#999' : '#ff9500', color: '#fff', fontWeight: 600, cursor: responded ? 'not-allowed' : 'pointer', marginBottom: 16 }}
            >
              {responded ? 'Response recorded' : 'Employee responded'}
            </button>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: sensor.present ? '#16a34a' : '#9ca3af' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>{sensor.present ? 'Customer present' : 'No customer'}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{sensor.since ? `Last sensor event ${new Date(sensor.since).toLocaleTimeString()}` : 'Waiting for sensor'}</div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: recording ? '#fee2e2' : '#f3f4f6', color: recording ? '#b91c1c' : '#6b7280' }}>{recording ? 'REC' : 'Standby'}</span>
          </div>
          <div style={{ padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>Live transcript</div>
            {transcriptLines.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280' }}>{recording ? 'Listening for speech...' : 'Transcript appears here during a session.'}</div>
        ) : transcriptLines.map((l) => (
          <div key={l.id} style={{ fontSize: 14, color: '#111827', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 12, marginRight: 8 }}>{l.at}</span>
            {l.pending ? (
              <span style={{ color: '#6b7280' }}>
                Transcribing... {Math.round((Date.now() - l.startedMs) / 1000)}s of about 60s
                <span style={{ display: 'block', height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 4 }}>
                  <span style={{ display: 'block', height: 4, width: `${Math.min(100, (Date.now() - l.startedMs) / 600)}%`, background: '#2563eb', borderRadius: 2 }} />
                </span>
              </span>
            ) : l.text}
          </div>
        ))}
          </div>
          {feedbackUrl && (
            <div style={{ padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb' }}>
              <p style={{ fontWeight: 700, color: '#111827', marginTop: 0 }}>Scan to give feedback</p>
              <QRCodeCanvas value={feedbackUrl} size={200} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
