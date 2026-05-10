import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'

export default function CustomerFeedback() {
  const { interactionId } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [interaction, setInteraction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch interaction details (optional - to show employee name)
    axios.get(`${API_BASE}/api/interactions/${interactionId}`)
      .then(res => {
        console.log('Interaction:', res.data)
        setInteraction(res.data)
      })
      .catch(err => {
        console.error('Failed to fetch interaction:', err)
        setError('Could not load interaction details')
      })
      .finally(() => setLoading(false))
  }, [interactionId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!rating) {
      setError('Please select a star rating')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await axios.post(`${API_BASE}/api/feedback`, {
        interaction_id: interactionId,
        rating: rating,
        comment: comment || null,
        created_at: new Date().toISOString()
      })

      console.log('Feedback submitted:', response.data)
      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/customer-dashboard')
      }, 3000)
    } catch (err) {
      console.error('Feedback submission error:', err)
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle = { 
    background: '#fff', 
    borderRadius: '10px', 
    padding: '24px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
    border: '1px solid #e8e8e8', 
    transition: 'all 0.2s linear' 
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f8fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: '0 0 8px 0' }}>Thank You!</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Your feedback has been successfully submitted. Your rating helps us improve our service!
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Redirecting to dashboard in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0052cc', margin: '0 0 8px 0' }}>Your Feedback Matters</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Help us improve by sharing your experience</p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', fontSize: '14px' }}>Loading interaction details...</p>
          </div>
        )}

        {/* Form */}
        {!loading && (
          <div style={cardStyle}>
            {/* Interaction Info */}
            {interaction && (
              <div style={{ background: '#e8f0ff', border: '1px solid #0052cc', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Employee</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0052cc', margin: 0 }}>
                  {interaction.employee_name || 'Service Representative'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Error Alert */}
              {error && (
                <div style={{ background: '#fee', border: '1px solid #fcc', borderLeft: '4px solid #ef4444', color: '#c00', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Star Rating */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#333', display: 'block', marginBottom: '12px' }}>
                  How would you rate this interaction?
                </label>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '36px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '36px',
                        transition: 'all 0.15s',
                        transform: (hoverRating || rating) >= star ? 'scale(1.2)' : 'scale(1)',
                        opacity: (hoverRating || rating) >= star ? 1 : 0.4,
                      }}
                      title={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      {(hoverRating || rating) >= star ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#0052cc', fontWeight: '600', textAlign: 'center', margin: '12px 0 0 0' }}>
                  {rating === 0 ? 'Click to rate' : `You rated ${rating} star${rating !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us what went well or what we can improve..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s',
                    color: '#1a1a1a'
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0052cc', e.target.style.boxShadow = '0 0 0 3px rgba(0,82,204,0.1)')}
                  onBlur={e => (e.target.style.borderColor = '#e0e0e0', e.target.style.boxShadow = 'none')}
                />
                <p style={{ fontSize: '11px', color: '#999', margin: '6px 0 0 0' }}>
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !rating}
                style={{
                  padding: '12px',
                  background: rating && !submitting ? '#10b981' : '#d0d0d0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: rating && !submitting ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '700',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (rating && !submitting) {
                    e.target.style.background = '#059669'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.background = rating && !submitting ? '#10b981' : '#d0d0d0'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                {submitting ? '⏳ Submitting...' : '✓ Submit Feedback'}
              </button>

              {/* Info Text */}
              <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', margin: '12px 0 0 0' }}>
                Your feedback is anonymous and helps us improve our service quality.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}