import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

const cardStyle = { 
  background: '#fff', 
  borderRadius: '10px', 
  padding: '24px', 
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
  border: '1px solid #e8e8e8' 
};

const btnStyle = (variant = 'primary', disabled = false) => ({
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
  fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s linear',
  background: variant === 'primary' ? '#0052cc' : '#e8e8e8',
  color: variant === 'primary' ? '#fff' : '#333',
  opacity: disabled ? 0.6 : 1
});

export default function SimulationCapture() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [duration, setDuration] = useState(10);
  const [interactionId, setInteractionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cameraAccess, setCameraAccess] = useState(false);

  const token = localStorage.getItem('token');
  const employeeId = localStorage.getItem('employee_id');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !employeeId) {
      navigate('/login');
    }
  }, [token, employeeId, navigate]);

  // Request camera/mic access
  const requestMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      streamRef.current = stream;
      
      // Show video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraAccess(true);
      setMessage('✅ Camera & Microphone access granted');
    } catch (error) {
      setMessage(`❌ Camera/Mic access denied: ${error.message}`);
      setCameraAccess(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        setMessage('❌ Stream not available. Request access first.');
        return;
      }

      setMessage('🔴 Recording...');
      setRecording(true);
      setCountdown(duration);

      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await sendToBackend(blob);
      };

      mediaRecorderRef.current.start();
      startedAtRef.current = new Date().toISOString();
      eventsRef.current = [];

      // Countdown timer
      let remaining = duration;
      timerRef.current = setInterval(() => {
        remaining--;
        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      setMessage(`❌ Recording error: ${error.message}`);
      setRecording(false);
    }
  };

  // Stop recording
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const eventsRef = useRef([]);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setMessage('⏸️ Recording stopped. Uploading to server...');
    }
  };

  // Send to backend
  const sendToBackend = async (blob) => {
    try {
      setLoading(true);

      // Create FormData with video blob
      const formData = new FormData();
      formData.append('video', blob, 'capture.webm');
      formData.append('duration_seconds', duration);
      formData.append('events', JSON.stringify(eventsRef.current));
      formData.append('recording_started_at', startedAtRef.current || '');

      // Call backend endpoint
      const response = await axios.post(
        `${API_BASE}/api/simulate/capture`,
        formData,
        {
          headers: { ...headers },
          timeout: 60000
        }
      );

      if (response.data.interaction_id) {
        setInteractionId(response.data.interaction_id);
        setMessage(`✅ Capture complete! Interaction ID: ${response.data.interaction_id}`);
      } else {
        setMessage('❌ Failed to create interaction');
      }
    } catch (error) {
      setMessage(`❌ Upload error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger batch processing
  const triggerBatch = async () => {
    try {
      setLoading(true);
      setMessage('📊 Triggering batch processing...');

      const response = await axios.post(
        `${API_BASE}/api/batch/trigger`,
        {},
        { headers }
      );

      if (response.data.task_id) {
        setMessage(`✅ Batch job queued! Task ID: ${response.data.task_id}`);
        // Redirect to dashboard after 2 seconds
        // Stay on this page: /dashboard is Admin-only and would redirect an employee to /
      }
    } catch (error) {
      setMessage(`❌ Batch error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
            Simulation Capture
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Record 10 seconds of video and audio for behavioral analysis
          </p>
        </div>

        {/* Video Preview */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>
            Camera Preview
          </h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              borderRadius: '8px',
              background: '#000',
              maxHeight: '400px',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Duration (seconds):
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={recording}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Recording Status */}
          {recording && (
            <div style={{
              background: '#ffe8e8',
              border: '1px solid #ff6b6b',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#d9480f'
            }}>
              🔴 Recording: {countdown}s remaining
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button
              onClick={requestMediaAccess}
              disabled={recording || cameraAccess}
              style={btnStyle('primary', recording || cameraAccess)}
            >
              {cameraAccess ? '✅ Access Granted' : '📹 Grant Camera Access'}
            </button>

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={!cameraAccess || loading}
              style={btnStyle(recording ? 'danger' : 'primary', !cameraAccess || loading)}
            >
              {recording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {recording && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button type="button" onClick={() => eventsRef.current.push({ type: 'arrival', at: new Date().toISOString() })}
              style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#00a86b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Customer arrived</button>
            <button type="button" onClick={() => eventsRef.current.push({ type: 'response', at: new Date().toISOString() })}
              style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#ff9500', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Employee responded</button>
          </div>
        )}
        {message && (
          <div style={{
            ...cardStyle,
            background: message.includes('❌') ? '#ffe8e8' : '#e8f5e9',
            border: `1px solid ${message.includes('❌') ? '#ff6b6b' : '#4caf50'}`,
            marginBottom: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: message.includes('❌') ? '#d9480f' : '#2e7d32' }}>
              {message}
            </p>
          </div>
        )}

        {/* Batch Processing Button */}
        {interactionId && (
          <div style={{ ...cardStyle }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>
              Ready for Analysis
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Interaction captured. Now trigger batch processing to analyze the video and audio.
            </p>
            <button
              onClick={triggerBatch}
              disabled={loading}
              style={btnStyle('primary', loading)}
            >
              {loading ? '⏳ Processing...' : '📊 Trigger Batch Analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

