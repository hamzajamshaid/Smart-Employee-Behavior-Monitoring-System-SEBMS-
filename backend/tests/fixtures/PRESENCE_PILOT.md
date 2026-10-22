# Presence detector pilot (Phase 7, step 7)

Detector: MediaPipe face detection, sampled every 5th frame, confidence threshold 0.5.
Rule: is_present = presence_score >= 70.

| Set | Clips | Labels | Agreement | Label timing |
|---|---|---|---|---|
| Set 1 | 1157 to 1167 (11) | 5 IN, 6 OUT | 11 of 11 | Partly set after first comparison (1162 changed, then confirmed from frame) |
| Set 2 | 1168 to 1180 (13) | 6 IN, 7 OUT | 13 of 13 | From memory after recording |

Combined: 24 of 24 agreement, one participant, one room, one camera.

Limitations:
- Labels not written before recording, so the test is not blind.
- Scores are only 0.0 or 100.0 on these clips, so the threshold is not tested on intermediate values.
- The 95% interval on 24 of 24 is roughly 86% to 100%, and applies only to these conditions.
- Not a validation of accuracy for other people, lighting, or rooms.
