"""
src/train.py
Train the stress detection model and evaluate with honest metrics.
"""

import numpy as np
import pandas as pd
import json
import time
import joblib
import warnings
import tempfile
import os
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, accuracy_score, roc_auc_score,
)

warnings.filterwarnings("ignore")

ROOT      = Path(__file__).resolve().parent.parent
DATA_DIR  = ROOT / "data"
MODEL_DIR = ROOT / "model"

FEATURE_COLS = [
    'motion_max','motion_mean','motion_p95','motion_std',
    'brake_intensity','lateral_max','z_dev_max',
    'speed_mean','speed_at_brake','speed_drop',
    'spikes_above3','spikes_above5',
    'audio_db_max','audio_db_mean','audio_db_p90','audio_db_std',
    'audio_class_max','audio_class_mean',
    'sustained_max','sustained_sum',
    'cadence_var_mean','cadence_var_max',
    'argument_frac','loud_frac',
    'audio_leads_motion','audio_onset_sec','brake_t_sec',
    'is_low_speed','both_elevated','audio_only',
]

CLASS_NAMES = {
    0:'NORMAL', 1:'TRAFFIC_STOP', 2:'SPEED_BREAKER',
    3:'CONFLICT', 4:'ESCALATING', 5:'ARGUMENT_ONLY', 6:'MUSIC_OR_CALL',
}

CLASS_WEIGHTS = {0:1.0, 1:1.2, 2:1.0, 3:3.0, 4:3.0, 5:2.0, 6:1.0}


def load_data():
    path = DATA_DIR / "synthetic_windows.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"Data not found at {path}\n"
            "Run:  python src/generate_data.py  first."
        )
    df = pd.read_csv(path)
    X  = df[FEATURE_COLS].values.astype(np.float32)
    y  = df['situation_label'].values.astype(int)
    print(f"Loaded {len(df)} windows, {X.shape[1]} features")
    return X, y


def split(X, y):
    X_tmp, X_test, y_tmp, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(
        X_tmp, y_tmp, test_size=0.176, stratify=y_tmp, random_state=42)
    print(f"Split → train={len(X_train)}  val={len(X_val)}  test={len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


def baseline(X_train):
    return X_train.mean(0), X_train.std(0) + 1e-8


def norm(X, mean, std):
    return (X - mean) / std


def cross_validate(X, y, mean, std):
    print("\n5-Fold Cross-Validation:")
    clf = RandomForestClassifier(
        n_estimators=150, max_depth=12, min_samples_leaf=4,
        class_weight=CLASS_WEIGHTS, random_state=42, n_jobs=-1)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(clf, norm(X, mean, std), y,
                              cv=skf, scoring='f1_macro', n_jobs=-1)
    print(f"  F1 macro: {scores.mean():.3f} ± {scores.std():.3f}")
    return scores.mean()


def train(X_train, y_train):
    clf = RandomForestClassifier(
        n_estimators=200, max_depth=14, min_samples_leaf=4,
        max_features='sqrt', class_weight=CLASS_WEIGHTS,
        random_state=42, n_jobs=-1)
    print("\nTraining Random Forest (200 trees)...")
    t0 = time.time()
    clf.fit(X_train, y_train)
    print(f"  Done in {time.time()-t0:.1f}s")
    cal = CalibratedClassifierCV(clf, cv=3, method='sigmoid')
    cal.fit(X_train, y_train)
    print("  Probability calibration done (Platt scaling)")
    return clf, cal


def evaluate(clf, X_val, y_val, X_test, y_test):
    names = [CLASS_NAMES[i] for i in range(7)]

    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)

    for label, X, y in [("Validation", X_val, y_val), ("Test (held-out)", X_test, y_test)]:
        yp = clf.predict(X)
        print(f"\n── {label} ─────────────────────────────")
        print(f"  Accuracy : {accuracy_score(y, yp):.3f}")
        print(f"  F1 macro : {f1_score(y, yp, average='macro'):.3f}")
        print()
        print(classification_report(y, yp, target_names=names, digits=3))

    # Confusion matrix on test
    yp = clf.predict(X_test)
    cm = confusion_matrix(y_test, yp)
    short = [n[:10] for n in names]
    print("── Confusion Matrix (Test) ──────────────────────")
    print(f"{'':>14s}" + "".join(f"{s:>13s}" for s in short))
    for i, row in enumerate(cm):
        print(f"  {short[i]:>12s}" + "".join(f"{v:>13d}" for v in row))

    # Safety-critical breakdown
    print("\n── Safety-Critical Classes ──────────────────────")
    for ci, cn in [(3,'CONFLICT'), (4,'ESCALATING')]:
        prec = precision_score(y_test==ci, yp==ci)
        rec  = recall_score(y_test==ci, yp==ci)
        f1   = f1_score(y_test==ci, yp==ci)
        fp   = int(((yp==ci) & (y_test!=ci)).sum())
        fn   = int(((yp!=ci) & (y_test==ci)).sum())
        print(f"\n  {cn}:")
        print(f"    Precision : {prec:.3f}  ({prec:.1%} of alerts were real)")
        print(f"    Recall    : {rec:.3f}  ({rec:.1%} of incidents caught)")
        print(f"    F1        : {f1:.3f}")
        print(f"    FP={fp}  FN={fn}")

    # Misclassification analysis
    errors = [(CLASS_NAMES[yt], CLASS_NAMES[yp_]) for yt, yp_ in zip(y_test, yp) if yt != yp_]
    if errors:
        from collections import Counter
        print("\n── Misclassifications (true → predicted) ────────")
        for (a, b), c in Counter(errors).most_common():
            tag = "⚠ safety" if (a in ('CONFLICT','ESCALATING') or b in ('CONFLICT','ESCALATING')) else "expected"
            print(f"  {a:<22} → {b:<22}  ×{c}  [{tag}]")

    # Inference speed
    print("\n── Inference Speed ──────────────────────────────")
    s = X_test[:1]
    t0 = time.perf_counter()
    for _ in range(500):
        clf.predict(s)
    ms = (time.perf_counter() - t0) / 500 * 1000
    print(f"  Python (interpreted): {ms:.1f}ms per window")
    print(f"  Android ONNX (est.):  ~{max(ms/20, 0.5):.1f}ms per window")
    print(f"  Budget: 30,000ms window  →  {'✓ viable' if ms < 100 else 'needs ONNX export'}")

    # Model size
    with tempfile.NamedTemporaryFile(suffix='.pkl', delete=False) as tmp:
        joblib.dump(clf, tmp.name, compress=3)
        tmp.close()  # Close before unlinking (Windows fix)
        kb = os.path.getsize(tmp.name) / 1024
        os.unlink(tmp.name)
    print(f"\n── Model Size ───────────────────────────────────")
    print(f"  {kb:.0f} KB  ({'✓ edge viable' if kb < 500 else 'consider pruning'})")

    # Feature importance
    print("\n── Top 10 Features ──────────────────────────────")
    imp = pd.Series(clf.feature_importances_, index=FEATURE_COLS)
    for feat, sc in imp.sort_values(ascending=False).head(10).items():
        print(f"  {feat:<25} {sc:.4f}  {'█' * int(sc * 150)}")


def export(clf, cal, mean, std):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_DIR / "rf_model.pkl",         compress=3)
    joblib.dump(cal, MODEL_DIR / "calibrated_model.pkl", compress=3)
    np.save(MODEL_DIR / "baseline_mean.npy", mean)
    np.save(MODEL_DIR / "baseline_std.npy",  std)
    contract = {
        "features":      FEATURE_COLS,
        "n_features":    len(FEATURE_COLS),
        "classes":       CLASS_NAMES,
        "window_sec":    30,
        "version":       "1.0",
        "privacy_note":  "All features are acoustic/kinematic aggregates. No audio content stored.",
    }
    (MODEL_DIR / "feature_contract.json").write_text(json.dumps(contract, indent=2))
    print(f"\nModel exported → {MODEL_DIR}/")
    for f in sorted(MODEL_DIR.iterdir()):
        print(f"  {f.name:<35} {f.stat().st_size//1024:>5} KB")


def run():
    print("=" * 60)
    print("DrivePulse — Stress Detection Training")
    print("=" * 60 + "\n")

    X, y           = load_data()
    Xtr, Xv, Xte, ytr, yv, yte = split(X, y)
    mean, std      = baseline(Xtr)
    cv_f1          = cross_validate(X, y, mean, std)
    clf, cal       = train(norm(Xtr, mean, std), ytr)

    evaluate(clf, norm(Xv, mean, std), yv, norm(Xte, mean, std), yte)
    export(clf, cal, mean, std)

    print(f"\n{'='*60}")
    print(f"Done. CV F1 macro: {cv_f1:.3f}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run()
