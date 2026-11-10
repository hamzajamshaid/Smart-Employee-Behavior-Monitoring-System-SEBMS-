import json
import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

MODEL_ID = 'superb/wav2vec2-base-superb-er'
MIN_SPEECH_SECONDS = 3.0      # less speech than this: tone is not measured
MAX_SPEECH_SECONDS = 30.0     # longest voiced audio passed to the model
SUBPROCESS_TIMEOUT = 600      # first run downloads the model
SPEECH_RATIO_THRESHOLD = 0.3  # used only for the speech_detected flag

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_VOICE_PYTHON = os.path.join(_PROJECT_DIR, 'venv-voice', 'bin', 'python')

_CHILD_SCRIPT = r"""
import json, sys
import numpy as np
import soundfile as sf
import torch
from silero_vad import load_silero_vad, get_speech_timestamps
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification

MODEL_ID = 'superb/wav2vec2-base-superb-er'
MIN_SPEECH_SECONDS = 3.0
MAX_SPEECH_SECONDS = 30.0
POSITIVE_PREFIXES = ('neu', 'hap')


def emit(payload):
    print('RESULT:' + json.dumps(payload))
    sys.exit(0)


path = sys.argv[1]
try:
    data, sr = sf.read(path, dtype='float32')
except Exception as e:
    emit({'status': 'error', 'error': str(e)})
if data.ndim > 1:
    data = data.mean(axis=1)
if len(data) == 0:
    emit({'status': 'insufficient_audio', 'error': 'empty audio'})
if sr != 16000:
    emit({'status': 'error', 'error': f'expected 16 kHz audio, got {sr} Hz'})
duration = len(data) / sr

vad = load_silero_vad()
segs = get_speech_timestamps(torch.from_numpy(data), vad, sampling_rate=sr, return_seconds=True)
speech_seconds = sum(s['end'] - s['start'] for s in segs)
speech_ratio = speech_seconds / duration
base = {'duration_seconds': duration, 'speech_seconds': speech_seconds, 'speech_ratio': speech_ratio}

if speech_seconds < MIN_SPEECH_SECONDS:
    emit({**base, 'status': 'insufficient_speech',
          'error': f'{speech_seconds:.2f}s of speech < {MIN_SPEECH_SECONDS}s minimum'})

voiced = np.concatenate([data[int(s['start'] * sr):int(s['end'] * sr)] for s in segs])
voiced = voiced[: int(MAX_SPEECH_SECONDS * sr)]

extractor = Wav2Vec2FeatureExtractor.from_pretrained(MODEL_ID)
model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_ID).eval()
inputs = extractor(voiced, sampling_rate=sr, return_tensors='pt')
with torch.no_grad():
    probs = torch.softmax(model(**inputs).logits, dim=-1)[0].tolist()
dist = {model.config.id2label[i].lower(): round(p, 4) for i, p in enumerate(probs)}
tone = sum(p for k, p in dist.items() if k.startswith(POSITIVE_PREFIXES))
emit({**base, 'status': 'ok', 'tone_score': round(100 * tone, 2), 'emotion_distribution': dist})
"""


class VoiceAnalyzer:
    """
    Speech tone score (experimental).
    voice_score = share of the speech (silence excluded) that a pretrained speech-emotion
    model classifies as neutral or happy, 0-100. Angry and sad speech scores 0.
    Recordings with under MIN_SPEECH_SECONDS of speech are not measured (voice_score None).
    """

    def analyze_voice(self, audio_path: str) -> dict:
        if not os.path.exists(_VOICE_PYTHON):
            return self._result('error', error=f'voice interpreter missing: {_VOICE_PYTHON}')

        fd, script_path = tempfile.mkstemp(suffix='.py')
        with os.fdopen(fd, 'w') as f:
            f.write(_CHILD_SCRIPT)
        try:
            proc = subprocess.run([_VOICE_PYTHON, script_path, audio_path],
                                  capture_output=True, text=True, timeout=SUBPROCESS_TIMEOUT)
        except subprocess.TimeoutExpired:
            return self._result('error', error=f'voice analysis timed out after {SUBPROCESS_TIMEOUT}s')
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
            return self._result(payload['status'], duration=payload.get('duration_seconds'),
                                speech_ratio=payload.get('speech_ratio'), error=payload.get('error'))

        return self._result('ok', score=payload['tone_score'], duration=payload['duration_seconds'],
                            speech_ratio=payload['speech_ratio'],
                            distribution=payload['emotion_distribution'])

    @staticmethod
    def _result(status, score=None, duration=None, speech_ratio=None, distribution=None, error=None):
        return {
            'status': status,
            'voice_score': score,  # None = not measured; never 0 for missing data
            'speech_ratio': None if speech_ratio is None else round(speech_ratio, 4),
            'speech_detected': None if speech_ratio is None else speech_ratio > SPEECH_RATIO_THRESHOLD,
            'emotion_distribution': distribution,
            'duration_seconds': None if duration is None else round(duration, 2),
            'error': error,
            'model': MODEL_ID,
        }
