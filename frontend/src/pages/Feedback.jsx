import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

const btnStyle = (active) => ({ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${active ? '#0052cc' : '#e8e8e8'}`, background: active ? '#0052cc' : '#fff', color: active ? '#fff' : '#0052cc', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', transition: 'all 0.15s' });
const cardStyle = { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8', transition: 'all 0.2s linear' };

export default function Feedback() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [feedbackList, setFeedbackList] = useState([]);
  const [filterRating, setFilterRating] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };
  const getRatingColor = (rating) => rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444';
  const filteredFeedback = filterRating === 'all' ? feedbackList : feedbackList.filter(f => f.rating === parseInt(filterRating));
  const avgRating = feedbackList.length > 0 ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1) : 0;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${API_BASE}/api/feedback`, { headers }).then(res => setFeedbackList(res.data || [])).catch(err => console.error('Failed to fetch feedback:', err));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#e8f0ff', borderBottom: '2px solid #0052cc', padding: '16px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: 0, lineHeight: '1.1' }}>⭐ Feedback</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Customer reviews and ratings</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0' }}>Average Rating</p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: getRatingColor(avgRating), margin: 0 }}>{avgRating}★</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 30px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterRating('all')} style={btnStyle(filterRating === 'all')}>All ({feedbackList.length})</button>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = feedbackList.filter(f => f.rating === rating).length;
            return <button key={rating} onClick={() => setFilterRating(rating.toString())} style={btnStyle(filterRating === rating.toString())}>{rating}★ ({count})</button>;
          })}
        </div>

        {/* Feedback List */}
        <div style={cardStyle}>
          {filteredFeedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>No feedback found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFeedback.map(feedback => (
                <div key={feedback.id} style={{ padding: '16px', border: `2px solid ${getRatingColor(feedback.rating)}`, background: getRatingColor(feedback.rating) + '05', borderRadius: '8px' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)', e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>{feedback.customer_name || 'Anonymous'}</h4>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>for {feedback.employee_name || 'Unknown'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} color={getRatingColor(feedback.rating)} fill={i < feedback.rating ? getRatingColor(feedback.rating) : '#e0e0e0'} />)}
                      <span style={{ fontSize: '13px', fontWeight: '700', color: getRatingColor(feedback.rating), marginLeft: '4px' }}>{feedback.rating}.0</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#333', margin: '12px 0', lineHeight: '1.6', fontStyle: 'italic' }}>"{feedback.comment || feedback.message || 'No comment'}"</p>
                  <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{feedback.date ? new Date(feedback.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}