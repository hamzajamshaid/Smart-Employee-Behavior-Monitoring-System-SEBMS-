"""Generate synthetic control inputs for regression checks.
Outputs go to tests/fixtures/generated/ (git-ignored). Run from backend/ with the main venv."""
import os
import cv2
import numpy as np
import soundfile as sf

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated')


def make_blank_video(path):
    """45 frames (3 s at 15 fps) of flat grey: no person, should score as absent."""
    w = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*'mp4v'), 15, (640, 480))
    frame = np.full((480, 640, 3), 128, dtype=np.uint8)
    for _ in range(45):
        w.write(frame)
    w.release()


def make_silence(path, seconds=6, sr=16000):
    sf.write(path, np.zeros(int(seconds * sr), dtype=np.float32), sr)


def make_noise(path, seconds=8, sr=16000, amp=0.1, seed=0):
    """White noise (the earlier test used pink noise, so results are not identical)."""
    rng = np.random.default_rng(seed)
    x = np.clip(amp * rng.standard_normal(int(seconds * sr)), -1, 1).astype(np.float32)
    sf.write(path, x, sr)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    make_blank_video(os.path.join(OUT, 'blank_control.mp4'))
    make_silence(os.path.join(OUT, 'silence_control.wav'))
    make_noise(os.path.join(OUT, 'noise_control.wav'))
    print('generated:', sorted(os.listdir(OUT)))
