import json
import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

MIN_DURATION_SECONDS = 5.0
SPEECH_RATIO_THRESHOLD = 0.3  # experimental; to be validated in Phase 8

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_VOICE_PYTHON = os.path.join(_PROJECT_DIR, 'venv-voice', 'bin', 'python')

_CHILD_SCRIPT = r'''
import json, sys
import soundfile as sf
import torch
from silero_vad import load_silero_vad, get_speech_timestamps

path = sys.argv[1]
try:
    data, sr = sf.read(path, dtype='float32')
except Exception as e:
    print('RESULT:' + json.dumps({'status': 'error', 'error': str(e)}))
    sys.exit(0)
if data.ndim > 1:
    data = data.mean(axis=1)
if len(data) == 0:
    print('RESULT:' + json.dumps({'status': 'insufficient_audio', 'error': 'empty audio'}))
    sys.exit(0)
duration = len(data) / sr
model = load_silero_vad()
segs = get_speech_timestamps(torch.from_numpy(data), model, sampling_rate=sr, return_seconds=True)
speech = sum(s['end'] - s['start'] for s in segs)
print('RESULT:' + json.dumps({'status': 'ok', 'duration_seconds': duration, 'speech_seconds': speech}))
'''


class VoiceAnalyzer:
    """
    Speech-presence ratio via Silero VAD (EXPERIMENTAL).
    voice_score is the percentage of audio that contains detected speech.
    It is NOT a measure of politeness, sentiment, or service quality.
    """

    def analyze_voice(self, audio_path: str) -> dict:
        if not os.path.exists(_VOICE_PYTHON):
            return self._result('error', error=f'voice interpreter missing: {_VOICE_PYTHON}')

        fd, script_path = tempfile.mkstemp(suffix='.py')
        with os.fdopen(fd, 'w') as f:
            f.write(_CHILD_SCRIPT)
        try:
            proc = subprocess.run([_VOICE_PYTHON, script_path, audio_path],
                                  capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            return self._result('error', error='voice analysis timed out after 120s')
        finally:
            os.unlink(script_path)

        if proc.returncode != 0:
            tail = (proc.stderr or '').strip().splitlines()[-5:]
            return self._result('error', error='\n'.join(tail) or f'exit code {proc.returncode}')

        payload = None
        for line in reversed(proc.stdout.splitlines()):
            if line.startswith('RESULT:'):
                payload = json.loads(line[len('RESULT:'):])
                break
        if payload is None:
            return self._result('error', error='no RESULT line in child output')

        if payload['status'] != 'ok':
            return self._result(payload['status'], error=payload.get('error'))

        duration = payload['duration_seconds']
        if duration < MIN_DURATION_SECONDS:
            return self._result('insufficient_audio', duration=duration,
                                error=f'{duration:.2f}s < {MIN_DURATION_SECONDS}s minimum')

        ratio = payload['speech_seconds'] / duration
        return self._result('ok', score=round(ratio * 100, 2), duration=duration,
                            speech_detected=ratio > SPEECH_RATIO_THRESHOLD)

    @staticmethod
    def _result(status, score=None, duration=None, speech_detected=None, error=None):
        return {
            'status': status,
            'voice_score': score,  # None = not measured; never 0 for missing data
            'speech_detected': speech_detected,
            'duration_seconds': None if duration is None else round(duration, 2),
            'error': error,
            'experimental': True,
        }
