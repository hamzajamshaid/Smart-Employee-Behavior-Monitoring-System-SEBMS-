import json
import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

MODEL_SIZE = 'base'           # recorded with every result; Phase 8 may compare sizes
MIN_DURATION_SECONDS = 1.0
TRANSCRIBE_TIMEOUT_SECONDS = 600  # first run downloads the model

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_VOICE_PYTHON = os.path.join(_PROJECT_DIR, 'venv-voice', 'bin', 'python')

_CHILD_SCRIPT = r'''
import json, sys
import soundfile as sf
from faster_whisper import WhisperModel

path, model_size = sys.argv[1], sys.argv[2]
language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
data, sr = sf.read(path, dtype='float32')
if data.ndim > 1:
    data = data.mean(axis=1)
duration = len(data) / sr
if sr != 16000:
    print('RESULT:' + json.dumps({'status': 'error', 'error': f'expected 16000 Hz, got {sr}'}))
    sys.exit(0)
if duration < 1.0:
    print('RESULT:' + json.dumps({'status': 'insufficient_audio', 'duration_seconds': duration,
                                  'error': 'shorter than 1 second'}))
    sys.exit(0)
model = WhisperModel(model_size, device='cpu', compute_type='int8')
segments, info = model.transcribe(data, beam_size=5, vad_filter=False, language=language)
text = ' '.join(seg.text.strip() for seg in segments).strip()
print('RESULT:' + json.dumps({
    'status': 'ok' if text else 'no_speech_recognized',
    'transcript': text or None,
    'language': info.language,
    'language_probability': round(float(info.language_probability), 3),
    'duration_seconds': round(duration, 2),
}))
'''


class Transcriber:
    """Speech-to-text with faster-whisper (EXPERIMENTAL).
    Runs in venv-voice. Returns transcript=None with a status when nothing usable was produced."""

    def transcribe(self, audio_path: str, model_size=None, language=None) -> dict:
        size = model_size or MODEL_SIZE
        base = {'model': f'faster-whisper-{size}', 'transcript': None,
                'language': None, 'language_probability': None,
                'duration_seconds': None, 'experimental': True}

        if not os.path.exists(audio_path):
            return {**base, 'status': 'no_audio_file', 'error': audio_path}
        if not os.path.exists(_VOICE_PYTHON):
            return {**base, 'status': 'error', 'error': f'voice interpreter missing: {_VOICE_PYTHON}'}

        fd, script_path = tempfile.mkstemp(suffix='.py')
        with os.fdopen(fd, 'w') as f:
            f.write(_CHILD_SCRIPT)
        try:
            proc = subprocess.run([_VOICE_PYTHON, script_path, audio_path, size, language or ''],
                                  capture_output=True, text=True,
                                  timeout=TRANSCRIBE_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            return {**base, 'status': 'error', 'error': f'timed out after {TRANSCRIBE_TIMEOUT_SECONDS}s'}
        finally:
            os.unlink(script_path)

        if proc.returncode != 0:
            tail = (proc.stderr or '').strip().splitlines()[-5:]
            return {**base, 'status': 'error', 'error': '\n'.join(tail) or f'exit code {proc.returncode}'}

        payload = None
        for line in reversed(proc.stdout.splitlines()):
            if line.startswith('RESULT:'):
                payload = json.loads(line[len('RESULT:'):])
                break
        if payload is None:
            return {**base, 'status': 'error', 'error': 'no RESULT line in child output'}

        return {**base, **payload, 'error': payload.get('error')}
