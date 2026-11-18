import logging
import subprocess
import sys

def _describe_exit(returncode):
    if returncode < 0:
        return f'subprocess killed by signal {-returncode}'
    return f'subprocess exited with code {returncode}'
import json
import os
import tempfile

logger = logging.getLogger(__name__)

class MLExecutor:
    """Execute ML analysis in subprocess to avoid Mac M1 segfault"""
    
    def _run_child(self, interpreter, script, label):
        if not os.path.exists(interpreter):
            return {'ok': False, 'data': None, 'error': f'{label}: interpreter not found at {interpreter}'}
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(script)
            script_path = f.name
        try:
            proc = subprocess.run([interpreter, script_path], capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            return {'ok': False, 'data': None, 'error': f'{label}: timed out after 120s'}
        finally:
            os.unlink(script_path)
        if proc.returncode != 0:
            tail = (proc.stderr or '').strip().splitlines()[-15:]
            msg = '\n'.join(tail) or _describe_exit(proc.returncode)
            return {'ok': False, 'data': None, 'error': f'{label}: {msg}', 'returncode': proc.returncode}
        for line in reversed(proc.stdout.splitlines()):
            if line.startswith('RESULT:'):
                try:
                    return {'ok': True, 'data': json.loads(line[len('RESULT:'):]), 'error': None}
                except json.JSONDecodeError as e:
                    return {'ok': False, 'data': None, 'error': f'{label}: bad JSON ({e})'}
        return {'ok': False, 'data': None, 'error': f'{label}: no RESULT line in output'}

    def analyze_video_subprocess(self, video_path: str) -> dict:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        project_dir = os.path.dirname(backend_dir)
        presence_py = os.path.join(project_dir, 'venv-presence', 'bin', 'python')
        emotion_py = os.path.join(project_dir, 'venv', 'bin', 'python')
        pd_path = os.path.join(backend_dir, 'app', 'services', 'presence_detector.py')
        ea_path = os.path.join(backend_dir, 'app', 'services', 'emotion_analyzer.py')
        vp = json.dumps(video_path)

        presence_script = (
            "import json, importlib.util\n"
            "spec = importlib.util.spec_from_file_location('pd', " + json.dumps(pd_path) + ")\n"
            "m = importlib.util.module_from_spec(spec)\n"
            "spec.loader.exec_module(m)\n"
            "r = m.PresenceDetector().detect_presence(" + vp + ")\n"
            "print('RESULT:' + json.dumps(r, default=str))\n"
        )
        p = self._run_child(presence_py, presence_script, 'presence')
        allowed = p['data'].get('face_frames') if p['ok'] and p['data'] else None
        AF = repr(allowed)
        emotion_script = (
            "import json, importlib.util\n"
            "spec = importlib.util.spec_from_file_location('ea', " + json.dumps(ea_path) + ")\n"
            "m = importlib.util.module_from_spec(spec)\n"
            "spec.loader.exec_module(m)\n"
            "r = m.EmotionAnalyzer().analyze_emotions(" + vp + ", allowed_frames=" + AF + ")\n"
            "print('RESULT:' + json.dumps(r, default=str))\n"
        )

        if p['ok'] and p['data'].get('presence_score') is not None:
            presence = {'status': 'ok', 'presence_score': float(p['data']['presence_score']),
                        'is_present': p['data'].get('is_present')}
        else:
            presence = {'status': 'error', 'presence_score': None, 'is_present': None,
                        'error': (p['data'] or {}).get('error') or p['error'] or 'no presence_score in result'}

        e = self._run_child(emotion_py, emotion_script, 'emotion')
        if e['ok']:
            emotion = dict(e['data'])
        else:
            emotion = {'status': 'error', 'emotion_score': None, 'error': e['error']}

        return {
            'success': presence['status'] == 'ok' and emotion.get('status') == 'ok',
            'presence': presence,
            'emotion': emotion,
            'presence_score': presence['presence_score'],
            'emotion_score': emotion.get('emotion_score'),
        }

    def analyze_audio_subprocess(self, audio_path: str) -> dict:
        """
        Run voice analysis in subprocess
        
        Returns:
            {'voice_score': float, 'success': bool}
        """
        try:
            script = f"""
import sys
sys.path.insert(0, '{os.path.dirname(os.path.dirname(os.path.dirname(__file__)))}')
import json
from app.services.voice_analyzer import VoiceAnalyzer

try:
    voice = VoiceAnalyzer().analyze_voice('{audio_path}')
    result = {{
        'voice_score': voice.get('voice_score', 0),
        'success': True
    }}
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({{'success': False, 'error': str(e)}}))
"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(script)
                script_path = f.name
            
            try:
                result = subprocess.run(
                    [sys.executable, script_path],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if result.returncode == 0:
                    output = json.loads(result.stdout)
                    logger.info(f"✅ Voice analysis: voice_score={output.get('voice_score')}")
                    return output
                else:
                    logger.error(f"Voice subprocess error: {result.stderr}")
                    return {'success': False, 'error': result.stderr.strip() or _describe_exit(result.returncode), 'returncode': result.returncode}
            
            finally:
                os.unlink(script_path)
        
        except Exception as e:
            logger.error(f"Voice execution error: {str(e)}")
            return {'success': False, 'error': str(e), 'voice_score': 0}

