import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import API_BASE from '../config';

const ABSENT_HOLD_MS = 10000;
const POLL_MS = 1000;

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

  const stopRecording = () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setStatus('Customer left. Saving...');
    recorderRef.current.stop();
  };

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sensor/state`, { headers });
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h2>Counter session</h2>
      <div style={{ background: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        Notice: this counter records audio and video during your visit to improve service. Recordings are used only for service analysis.
      </div>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8, background: '#000' }} />
      <p style={{ fontWeight: 600 }}>{recording ? '🔴 ' : ''}{status}</p>
      {recording && (
        <button
          type="button"
          onClick={markResponded}
          disabled={responded}
          style={{ padding: '10px 16px', borderRadius: 6, border: 'none', background: responded ? '#999' : '#ff9500', color: '#fff', fontWeight: 600, cursor: responded ? 'not-allowed' : 'pointer', marginBottom: 16 }}
        >
          {responded ? 'Response recorded' : 'Employee responded'}
        </button>
      )}
      {feedbackUrl && (
        <div>
          <p>Scan to give feedback:</p>
          <QRCodeCanvas value={feedbackUrl} size={200} />
        </div>
      )}
    </div>
  );
}
