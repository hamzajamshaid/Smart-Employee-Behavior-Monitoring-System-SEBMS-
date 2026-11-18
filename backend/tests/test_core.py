import sys, os, importlib.util
HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, os.path.join(HERE, 'transcription'))
from score_wer import wer
from app.pipelines.behavioral_processor import _fuse

def test_wer_exact():
    assert wer("how are you", "how are you") == 0

def test_wer_one_missing_word():
    assert abs(wer("how are you", "how are") - 1/3) < 1e-9

def test_fuse_single_signal_not_scored():
    assert _fuse({'presence': 100}) is None

def test_fuse_weighted_average():
    # presence 0.20 and emotion 0.25, renormalised over the two signals
    assert abs(_fuse({'presence': 100, 'emotion': 50}) - (20 + 12.5) / 0.45) < 0.01
