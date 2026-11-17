import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const card = { background: '#fff', borderRadius: '10px', border: '1px solid #cfe0ea', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
const videoStyle = { width: '100%', aspectRatio: '4 / 3', background: '#0c2340', borderRadius: '8px', objectFit: 'cover' };

export default function MeetingRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const myRole = sessionStorage.getItem('role') || 'Customer';
  const peerRole = myRole === 'Employee' ? 'Customer' : 'Employee';
  const token = sessionStorage.getItem('token');

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('waiting');
  const [peerConnected, setPeerConnected] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const base = `${API_BASE}/api/meetings/${appointmentId}`;
    const isEmployee = myRole === 'Employee';

    let cancelled = false;
    let started = false;
    let pc = null;
    let stream = null;
    let lastId = 0;
    let pendingIce = [];
    let statusTimer = null;
    let pollTimer = null;
    let presenceTimer = null;

    const send = (kind, payload) =>
      axios.post(`${base}/signal`, { kind, payload }, { headers }).catch(() => {});

    const flushIce = async () => {
      while (pendingIce.length && pc && pc.remoteDescription) {
        const c = pendingIce.shift();
        await pc.addIceCandidate(c).catch(() => {});
      }
    };

    const makePeer = () => {
      if (pc) pc.close();
      pendingIce = [];
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.onicecandidate = e => { if (e.candidate) send('ice', e.candidate.toJSON()); };
      pc.ontrack = e => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
        setPeerConnected(true);
      };
      pc.onconnectionstatechange = () => {
        if (!pc) return;
        setConnection(pc.connectionState);
        if (pc.connectionState === 'connected') setPeerConnected(true);
      };
    };

    const startOffer = async () => {
      makePeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send('offer', { type: offer.type, sdp: offer.sdp });
    };

    const handleSignal = async (s) => {
      if (s.kind === 'presence') {
        // Customer announces presence; the employee starts the connection
        if (isEmployee && (!pc || ['failed', 'closed'].includes(pc.connectionState))) {
          await startOffer();
        }
      } else if (s.kind === 'offer') {
        makePeer();
        await pc.setRemoteDescription(s.payload);
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send('answer', { type: answer.type, sdp: answer.sdp });
      } else if (s.kind === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(s.payload);
          await flushIce();
        }
      } else if (s.kind === 'ice') {
        if (pc && pc.remoteDescription) await pc.addIceCandidate(s.payload).catch(() => {});
        else pendingIce.push(s.payload);
      }
    };

    const poll = async () => {
      try {
        const res = await axios.get(`${base}/signals`, { headers, params: { after: lastId } });
        for (const s of res.data.signals) {
          lastId = s.id;
          await handleSignal(s);
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
          setError(err.response.data.error || 'Meeting window has ended');
          clearInterval(pollTimer);
          clearInterval(presenceTimer);
        }
      }
    };

    const begin = async () => {
      started = true;
      clearInterval(statusTimer);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        setError('Camera or microphone access was denied. The site must use HTTPS to allow it.');
        started = false;
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      if (localRef.current) localRef.current.srcObject = stream;
      pollTimer = setInterval(poll, 1000);
      if (!isEmployee) {
        send('presence', {});
        presenceTimer = setInterval(() => {
          if (!pc || pc.connectionState !== 'connected') send('presence', {});
        }, 3000);
      }
    };

    const checkStatus = async () => {
      try {
        const res = await axios.get(`${base}/status`, { headers });
        if (cancelled) return;
        setStatus(res.data);
        if (res.data.can_join && !started) await begin();
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load this meeting');
      }
    };

    checkStatus();
    statusTimer = setInterval(checkStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(statusTimer);
      clearInterval(pollTimer);
      clearInterval(presenceTimer);
      if (pc) pc.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [appointmentId, myRole, token]);

  const leave = () => {
    navigate(myRole === 'Employee' ? '/employee-appointments' : '/appointments');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0c2340', margin: 0 }}>Appointment meeting</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
            Connection: {connection}
          </p>
        </div>
        <button
          onClick={leave}
          style={{ padding: '10px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
        >
          Leave meeting
        </button>
      </div>

      {error && (
        <div style={{ ...card, borderLeft: '4px solid #ef4444', color: '#991b1b', marginBottom: '16px' }}>{error}</div>
      )}
      {!error && status && !status.can_join && (
        <div style={{ ...card, borderLeft: '4px solid #f59e0b', color: '#333', marginBottom: '16px' }}>{status.reason}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0c2340', margin: '0 0 8px 0' }}>You ({myRole})</p>
          <video ref={localRef} autoPlay playsInline muted style={videoStyle} />
        </div>
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0c2340', margin: '0 0 8px 0' }}>
            {peerRole}{status ? `: ${peerRole === 'Employee' ? status.employee_name : status.customer_name}` : ''}
          </p>
          <video ref={remoteRef} autoPlay playsInline style={videoStyle} />
          {!peerConnected && (
            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>Waiting for the {peerRole.toLowerCase()} to join</p>
          )}
        </div>
      </div>
    </div>
  );
}
