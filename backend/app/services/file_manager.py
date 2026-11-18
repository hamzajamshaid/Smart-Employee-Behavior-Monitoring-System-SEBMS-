import os
from datetime import datetime
from pathlib import Path

class FileManager:
    """Manages file storage for videos, audio, frames"""
    
    def __init__(self):
        # Use relative paths from backend root
        ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        self.videos_dir = os.path.join(ROOT, 'storage', 'videos')
        self.audio_dir = 'storage/audio'
        self.frames_dir = 'storage/frames'
        self.logs_dir = 'storage/logs'
        self._dirs_created = False
    
    def _ensure_directories(self):
        """Create directories if they don't exist (lazy)"""
        if self._dirs_created:
            return
        for directory in [self.videos_dir, self.audio_dir, self.frames_dir, self.logs_dir]:
            Path(directory).mkdir(parents=True, exist_ok=True)
        self._dirs_created = True
    
    def get_video_path(self, interaction_id: int) -> str:
        """Get path for interaction video"""
        self._ensure_directories()
        return os.path.join(self.videos_dir, f'{interaction_id}.webm')
    
    def get_audio_path(self, interaction_id: int) -> str:
        """Get path for interaction audio"""
        self._ensure_directories()
        return os.path.join(self.audio_dir, f'{interaction_id}.wav')
    
    def get_frames_dir(self, interaction_id: int) -> str:
        """Get directory for interaction frames"""
        self._ensure_directories()
        frames_path = os.path.join(self.frames_dir, str(interaction_id))
        Path(frames_path).mkdir(parents=True, exist_ok=True)
        return frames_path
    
    def video_exists(self, interaction_id: int) -> bool:
        """Check if video file exists"""
        return os.path.exists(self.get_video_path(interaction_id))
    
    def delete_video(self, interaction_id: int) -> bool:
        """Delete video file (privacy cleanup)"""
        path = self.get_video_path(interaction_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False
    
    def delete_audio(self, interaction_id: int) -> bool:
        """Delete audio file (privacy cleanup)"""
        path = self.get_audio_path(interaction_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False

_file_manager = None

def get_file_manager() -> FileManager:
    """Lazy singleton getter"""
    global _file_manager
    if _file_manager is None:
        _file_manager = FileManager()
    return _file_manager
