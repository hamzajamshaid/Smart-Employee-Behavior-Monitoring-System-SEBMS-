"""Local wording for interaction notes, using the Qwen2.5-0.5B model.

Runs the model in a separate process (venv-llm), so the web server
cannot crash from it. Results are cached in logs/note_cache.json.
If anything fails, the original plain notes are returned unchanged.
"""
import json
import os
import subprocess

_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
_LLM_PYTHON = os.path.join(_PROJECT_DIR, 'venv-llm', 'bin', 'python')
_MODEL_DIR = os.path.join(_PROJECT_DIR, 'backend', 'ml_models', 'qwen2.5-0.5b-instruct')
_CACHE_PATH = os.path.join(_PROJECT_DIR, 'logs', 'note_cache.json')
_TIMEOUT_SECONDS = 60
_MAX_LENGTH = 300

_CHILD = r'''
import json, sys
from transformers import AutoModelForCausalLM, AutoTokenizer
path = sys.argv[1]
notes = json.loads(sys.stdin.read())
tok = AutoTokenizer.from_pretrained(path)
model = AutoModelForCausalLM.from_pretrained(path, dtype="float32")
out = {}
for note in notes:
    msgs = [
        {"role": "system", "content": "Rewrite the facts as one short, polite sentence for a manager. Add no new facts."},
        {"role": "user", "content": "Facts: " + note},
    ]
    ids = tok(tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True), return_tensors="pt")
    gen = model.generate(**ids, max_new_tokens=40, do_sample=False)
    out[note] = tok.decode(gen[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()
print("RESULT:" + json.dumps(out))
'''


def _load_cache():
    try:
        with open(_CACHE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _save_cache(cache):
    os.makedirs(os.path.dirname(_CACHE_PATH), exist_ok=True)
    tmp = _CACHE_PATH + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    os.replace(tmp, _CACHE_PATH)


def _run_model(notes):
    proc = subprocess.run(
        [_LLM_PYTHON, '-c', _CHILD, _MODEL_DIR],
        input=json.dumps(notes), capture_output=True, text=True, timeout=_TIMEOUT_SECONDS,
    )
    for line in proc.stdout.splitlines():
        if line.startswith('RESULT:'):
            return json.loads(line[len('RESULT:'):])
    return {}


def get_polished(notes):
    """notes: list of plain note strings. Returns {plain_note: polished_note}.
    Never raises. Falls back to the plain note when wording is unavailable."""
    result = {note: note for note in notes}
    try:
        cache = _load_cache()
        missing = [n for n in set(notes) if n not in cache]
        if missing and os.path.exists(_LLM_PYTHON) and os.path.isdir(_MODEL_DIR):
            produced = _run_model(missing)
            for note, text in produced.items():
                if isinstance(text, str) and 0 < len(text) <= _MAX_LENGTH:
                    cache[note] = text
            _save_cache(cache)
        for note in notes:
            if cache.get(note):
                result[note] = cache[note]
    except Exception:
        pass
    return result


import threading

_pending = set()
_pending_lock = threading.Lock()


def get_cached(notes):
    """Instant. Returns saved wording, or the plain note if none is saved yet."""
    cache = _load_cache()
    return {n: (cache.get(n) or n) for n in notes}


def queue_missing(notes):
    """Starts model wording in the background. Never blocks the caller."""
    cache = _load_cache()
    with _pending_lock:
        todo = [n for n in set(notes) if n not in cache and n not in _pending]
        if not todo:
            return
        _pending.update(todo)

    def _worker():
        try:
            get_polished(todo)
        finally:
            with _pending_lock:
                _pending.difference_update(todo)

    threading.Thread(target=_worker, daemon=True).start()
