import cv2
import pyaudio
import wave
import threading
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class VideoCapture:
    """Capture video from laptop camera"""
    
    def capture_video(self, output_path: str, duration_seconds: int = 10) -> dict:
        """
        Capture video from webcam
        
        Args:
            output_path: Path to save MP4 file
            duration_seconds: How long to record
        
        Returns:
            {'success': bool, 'file_path': str, 'frames': int, 'duration': float}
        """
        try:
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                logger.error("Cannot access camera")
                return {'success': False, 'error': 'Camera not accessible'}
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"📹 Recording video: {width}x{height} @ {fps}fps for {duration_seconds}s")
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            frame_count = 0
            start_time = datetime.utcnow()
            
            while True:
                ret, frame = cap.read()
                
                if not ret:
                    break
                
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed >= duration_seconds:
                    break
                
                out.write(frame)
                frame_count += 1
            
            cap.release()
            out.release()
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(f"✅ Video saved: {frame_count} frames, {duration:.2f}s")
            
            return {
                'success': True,
                'file_path': output_path,
                'frames': frame_count,
                'duration': round(duration, 2)
            }
        
        except Exception as e:
            logger.error(f"Video capture error: {str(e)}")
            return {'success': False, 'error': str(e)}

class AudioCapture:
    """Capture audio from laptop microphone"""
    
    def capture_audio(self, output_path: str, duration_seconds: int = 10) -> dict:
        """
        Capture audio from microphone
        
        Args:
            output_path: Path to save WAV file
            duration_seconds: How long to record
        
        Returns:
            {'success': bool, 'file_path': str, 'duration': float}
        """
        try:
            CHUNK = 1024
            FORMAT = pyaudio.paFloat32
            CHANNELS = 1
            RATE = 44100
            
            logger.info(f"🎤 Recording audio: {RATE}Hz, {CHANNELS}ch for {duration_seconds}s")
            
            p = pyaudio.PyAudio()
            stream = p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK
            )
            
            frames = []
            start_time = datetime.utcnow()
            
            while True:
                data = stream.read(CHUNK, exception_on_overflow=False)
                frames.append(data)
                
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed >= duration_seconds:
                    break
            
            stream.stop_stream()
            stream.close()
            p.terminate()
            
            with wave.open(output_path, 'wb') as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(p.get_sample_size(FORMAT))
                wf.setframerate(RATE)
                wf.writeframes(b''.join(frames))
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(f"✅ Audio saved: {len(frames)} chunks, {duration:.2f}s")
            
            return {
                'success': True,
                'file_path': output_path,
                'duration': round(duration, 2)
            }
        
        except Exception as e:
            logger.error(f"Audio capture error: {str(e)}")
            return {'success': False, 'error': str(e)}

