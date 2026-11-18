"""Transcript sentiment (EXPERIMENTAL). One label per interaction.
Runs in venv-voice. Score: 100 * (P(positive) + 0.5 * P(neutral)); 50 = neutral."""
import json
import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

MIN_WORDS = 3                 # shorter transcripts are not scored
MAX_TOKENS = 512              # long transcripts are truncated
TIMEOUT_SECONDS = 600
LABELS = ['negative', 'neutral', 'positive']   # must match training order

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_VOICE_PYTHON = os.path.join(_PROJECT_DIR, 'venv-voice', 'bin', 'python')
MODEL_DIR = os.path.join(_BACKEND_DIR, 'ml_models', 'sentiment_xlmr')

_CHILD_SCRIPT = r'''
import json, sys, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
model_dir, in_path = sys.argv[1], sys.argv[2]
with open(in_path, encoding='utf-8') as f:
    text = f.read()
tok = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir).eval()
enc = tok(text, truncation=True, max_length=%d, return_tensors='pt')
with torch.no_grad():
    probs = torch.softmax(model(**enc).logits, dim=-1)[0].tolist()
print('RESULT:' + json.dumps({'probs': probs}))
''' % MAX_TOKENS


def _base(status, error=None):
    return {'status': status, 'sentiment_score': None, 'label': None,
            'probs': None, 'error': error, 'experimental': True}


def analyze_sentiment(transcript):
    """Returns sentiment_score=None unless the status is 'ok' (never 0 for missing data)."""
    text = (transcript or '').strip()
    if len(text.split()) < MIN_WORDS:
        return _base('insufficient_text')
    if not os.path.isdir(MODEL_DIR):
        return _base('error', f'model missing: {MODEL_DIR}')
    if not os.path.exists(_VOICE_PYTHON):
        return _base('error', f'voice interpreter missing: {_VOICE_PYTHON}')

    fd, in_path = tempfile.mkstemp(suffix='.txt')
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(text)
    fd2, script_path = tempfile.mkstemp(suffix='.py')
    with os.fdopen(fd2, 'w', encoding='utf-8') as f:
        f.write(_CHILD_SCRIPT)
    try:
        proc = subprocess.run([_VOICE_PYTHON, script_path, MODEL_DIR, in_path],
                              capture_output=True, text=True, timeout=TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        return _base('error', f'timed out after {TIMEOUT_SECONDS}s')
    finally:
        os.unlink(in_path)
        os.unlink(script_path)

    if proc.returncode != 0:
        tail = (proc.stderr or '').strip().splitlines()[-5:]
        return _base('error', '\n'.join(tail) or f'exit code {proc.returncode}')

    payload = None
    for line in reversed(proc.stdout.splitlines()):
        if line.startswith('RESULT:'):
            payload = json.loads(line[len('RESULT:'):])
            break
    if payload is None:
        return _base('error', 'no RESULT line in child output')

    probs = dict(zip(LABELS, payload['probs']))
    score = round(100 * (probs['positive'] + 0.5 * probs['neutral']), 2)
    return {'status': 'ok', 'sentiment_score': score,
            'label': max(probs, key=probs.get),
            'probs': {k: round(v, 4) for k, v in probs.items()},
            'error': None, 'experimental': True}
