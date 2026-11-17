import shutil
import subprocess


def get_clip_seconds(path):
    """Real length of a saved clip in seconds, read with ffprobe. None if unavailable."""
    if not path:
        return None
    ffprobe = shutil.which('ffprobe')
    if not ffprobe:
        return None
    try:
        r = subprocess.run(
            [ffprobe, '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', path],
            capture_output=True, text=True, timeout=20)
        if r.returncode != 0 or not r.stdout.strip():
            return None
        return round(float(r.stdout.strip()), 2)
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None
