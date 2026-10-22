"""Word error rate for transcription clips.
Usage: python score_wer.py clip_map.csv
clip_map.csv columns: clip_id,interaction_id,audio_path
Reads references.csv, runs the transcriber, prints per-clip WER and mean (only for clips that have a reference)."""
import csv, os, re, sys, importlib.util, json

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.abspath(os.path.join(HERE, '..', '..'))

def normalize(t):
    t = re.sub(r'[\u064B-\u065F\u0670]', '', t or '')   # Arabic diacritics
    t = re.sub(r'[^\w\s]', ' ', t.lower())              # punctuation
    return t.split()

def wer(ref, hyp):
    r, h = normalize(ref), normalize(hyp)
    d = [[0]*(len(h)+1) for _ in range(len(r)+1)]
    for i in range(len(r)+1): d[i][0] = i
    for j in range(len(h)+1): d[0][j] = j
    for i in range(1, len(r)+1):
        for j in range(1, len(h)+1):
            cost = 0 if r[i-1] == h[j-1] else 1
            d[i][j] = min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+cost)
    return d[len(r)][len(h)] / max(len(r), 1)

def main(map_path):
    spec = importlib.util.spec_from_file_location('tr', os.path.join(BACKEND, 'app/services/transcriber.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    tr = m.Transcriber()
    refs = {r['clip_id']: r for r in csv.DictReader(open(os.path.join(HERE, 'references.csv'), encoding='utf-8'))}
    scores = []
    for row in csv.DictReader(open(map_path, encoding='utf-8')):
        ref = refs.get(row['clip_id'])
        if ref is None:
            print(f"{row['clip_id']}: no reference, skipped"); continue
        out = tr.transcribe(row['audio_path'])
        if out['status'] != 'ok':
            print(f"{row['clip_id']}: status={out['status']} ({out.get('error')})")
            scores.append(1.0); continue
        w = wer(ref['reference'], out['transcript'])
        scores.append(w)
        print(f"{row['clip_id']}\tWER={w:.2f}\tlang={out['language']}\tref={ref['reference']}\thyp={out['transcript']}")
    if scores:
        print(f"\nclips scored: {len(scores)}  mean WER: {sum(scores)/len(scores):.3f}")

if __name__ == '__main__':
    main(sys.argv[1])
