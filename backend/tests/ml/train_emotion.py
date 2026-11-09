import os
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")  # must be set before TF/DeepFace import
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import argparse, csv
import numpy as np

LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.abspath(os.path.join(HERE, '..', '..'))
CSV = os.path.join(BACKEND, 'ml_data', 'fer2013', 'fer2013.csv')
MODEL_DIR = os.path.join(BACKEND, 'ml_models')
FINETUNED = os.path.join(MODEL_DIR, 'emotion_finetuned.h5')

def load(usage):
    X, y = [], []
    with open(CSV, newline='') as f:
        for row in csv.DictReader(f):
            if row['Usage'] != usage:
                continue
            X.append(np.array(row['pixels'].split(), dtype=np.float32).reshape(48, 48))
            y.append(int(row['emotion']))
    return np.stack(X)[..., None] / 255.0, np.array(y)

def build_pretrained():
    from deepface import DeepFace
    try:
        m = DeepFace.build_model("Emotion")
    except TypeError:
        m = DeepFace.build_model(task="facial_attribute", model_name="Emotion")
    return getattr(m, 'model', m)

def metrics(y, p, n=7):
    cm = np.zeros((n, n), dtype=int)
    for t, q in zip(y, p):
        cm[t, q] += 1
    acc = (y == p).mean()
    f1s = []
    for c in range(n):
        tp = cm[c, c]; fp = cm[:, c].sum() - tp; fn = cm[c, :].sum() - tp
        f1s.append(0.0 if tp == 0 else 2 * tp / (2 * tp + fp + fn))
    return acc, float(np.mean(f1s)), cm

def report(name, model, X, y):
    p = model.predict(X, batch_size=256, verbose=0).argmax(1)
    acc, f1, cm = metrics(y, p)
    print(f"\n{name}: n={len(y)} accuracy={acc:.3f} macro_F1={f1:.3f}")
    print("per-class recall:", {LABELS[i]: round(cm[i, i] / max(cm[i].sum(), 1), 3) for i in range(7)})
    print("confusion matrix (rows=true, cols=pred), order:", LABELS)
    print(cm)
    return acc, f1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', choices=['baseline', 'finetune'], required=True)
    ap.add_argument('--epochs', type=int, default=10)
    a = ap.parse_args()
    import tensorflow as tf
    model = build_pretrained()
    Xv, yv = load('PublicTest')
    if a.mode == 'baseline':
        Xt, yt = load('PrivateTest')
        report("pretrained DeepFace emotion, PrivateTest", model, Xt, yt)
        return
    Xtr, ytr = load('Training')
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-4),
                  loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    os.makedirs(MODEL_DIR, exist_ok=True)
    ckpt = tf.keras.callbacks.ModelCheckpoint(FINETUNED, monitor='val_accuracy',
                                              save_best_only=True, verbose=0)
    model.fit(Xtr, ytr, validation_data=(Xv, yv), epochs=a.epochs, batch_size=64,
              callbacks=[ckpt], verbose=2)
    print(f"\nbest checkpoint saved to {FINETUNED}")
    best = tf.keras.models.load_model(FINETUNED, compile=False)
    report("fine-tuned, PublicTest (validation, used for selection)", best, Xv, yv)

if __name__ == '__main__':
    main()
