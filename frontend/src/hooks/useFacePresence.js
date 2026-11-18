import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const CHECK_MS = 500;
const ABSENT_HOLD_MS = 10000;

export default function useFacePresence(videoRef) {
  const [present, setPresent] = useState(false);
  const [error, setError] = useState(null);
  const lastSeenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let detector = null;
    let timer = null;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'VIDEO',
        });
        if (cancelled) { detector.close(); return; }
        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          const result = detector.detectForVideo(video, performance.now());
          if (result.detections.length > 0) {
            lastSeenRef.current = Date.now();
            setPresent(true);
          } else if (Date.now() - lastSeenRef.current >= ABSENT_HOLD_MS) {
            setPresent(false);
          }
        }, CHECK_MS);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (detector) detector.close();
    };
  }, [videoRef]);

  return { present, error };
}
