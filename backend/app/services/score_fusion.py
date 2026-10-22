import logging
from app.config import SCORE_WEIGHTS

logger = logging.getLogger(__name__)

class ScoreFusion:
    """Fuse individual behavioral scores into unified score"""
    
    def fuse_scores(self, scores: dict) -> dict:
        """
        Combine presence, emotion, response, feedback, voice into unified score
        
        Args:
            scores: {
                'presence_score': 0-100,
                'emotion_score': 0-100,
                'response_score': 0-100,
                'feedback_score': 0-100,
                'voice_score': 0-100
            }
        
        Returns:
            {
                'unified_score': 0-100,
                'component_scores': dict,
                'weights': dict
            }
        """
        try:
            # Ensure all scores present, default to 0
            presence = scores.get('presence_score', 0)
            emotion = scores.get('emotion_score', 0)
            response = scores.get('response_score', 0)
            feedback = scores.get('feedback_score', 0)
            voice = scores.get('voice_score', 0)
            
            # Apply weights
            unified = (
                presence * SCORE_WEIGHTS['presence'] +
                emotion * SCORE_WEIGHTS['emotion'] +
                response * SCORE_WEIGHTS['response'] +
                feedback * SCORE_WEIGHTS['feedback'] +
                voice * SCORE_WEIGHTS['voice']
            )
            
            return {
                'unified_score': round(unified, 2),
                'component_scores': {
                    'presence': round(presence, 2),
                    'emotion': round(emotion, 2),
                    'response': round(response, 2),
                    'feedback': round(feedback, 2),
                    'voice': round(voice, 2)
                },
                'weights': SCORE_WEIGHTS
            }
        
        except Exception as e:
            logger.error(f"Score fusion error: {str(e)}")
            return {
                'unified_score': 0,
                'component_scores': {},
                'weights': SCORE_WEIGHTS
            }

