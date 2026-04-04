"""
DriveIntel Backend — Batch CSV processing.
Loads trained stress models and runs inference on uploaded CSV data.
"""

import io
import csv
import json
import math
import numpy as np
import joblib
import pandas as pd
from pathlib import Path
from typing import Optional

from .config import BATCH_ROW_SOFT_LIMIT

ROOT = Path(__file__).resolve().parent.parent.parent  # project root (Driver-Pulse/)

# ── Stress model ──────────────────────────────────────────────

STRESS_MODEL_DIR = ROOT / "driveintel_stress_model" / "model"

STRESS_SITUATIONS = {
    0: {"name": "NORMAL", "emoji": "✅", "severity": "low"},
    1: {"name": "TRAFFIC_STOP", "emoji": "🚦", "severity": "low"},
    2: {"name": "SPEED_BREAKER", "emoji": "⚠️", "severity": "medium"},
    3: {"name": "CONFLICT", "emoji": "😠", "severity": "high"},
    4: {"name": "ESCALATING", "emoji": "🔴", "severity": "high"},
    5: {"name": "ARGUMENT_ONLY", "emoji": "🗣️", "severity": "medium"},
    6: {"name": "MUSIC_OR_CALL", "emoji": "🎵", "severity": "low"},
}

NOTIFY_ON = {3, 4, 5}
SAFETY_ON = {3, 4}

_stress_clf = None
_stress_mean = None
_stress_std = None
_stress_feats = None


def _load_stress_model():
    global _stress_clf, _stress_mean, _stress_std, _stress_feats
    if _stress_clf is not None:
        return True
    try:
        _stress_clf = joblib.load(STRESS_MODEL_DIR / "rf_model.pkl")
        _stress_mean = np.load(STRESS_MODEL_DIR / "baseline_mean.npy")
        _stress_std = np.load(STRESS_MODEL_DIR / "baseline_std.npy")
        _stress_feats = json.loads(
            (STRESS_MODEL_DIR / "feature_contract.json").read_text()
        )["features"]
        print(f"[batch] Stress model loaded ({len(_stress_feats)} features)")
        return True
    except Exception as e:
        print(f"[batch] Stress model load failed: {e}")
        return False


def predict_stress_row(row: dict) -> dict:
    """Run stress prediction on a single row dict."""
    if not _load_stress_model():
        return _stress_fallback(row)

    x = np.array(
        [float(row.get(f, 0.0)) for f in _stress_feats], dtype=np.float32
    ).reshape(1, -1)
    xn = (x - _stress_mean) / _stress_std
    pred = int(_stress_clf.predict(xn)[0])
    proba = _stress_clf.predict_proba(xn)[0]
    conf = float(proba[pred])

    if conf < 0.50:
        pred, conf = 0, conf

    sit = STRESS_SITUATIONS[pred]
    conf_label = "high" if conf >= 0.75 else ("medium" if conf >= 0.50 else "low")

    # Top 3 feature importance (simple absolute deviation approach)
    deviations = []
    for i, f in enumerate(_stress_feats):
        val = float(row.get(f, 0.0))
        mean_val = float(_stress_mean[i]) if i < len(_stress_mean) else 0
        std_val = float(_stress_std[i]) if i < len(_stress_std) else 1
        z = abs((val - mean_val) / max(std_val, 1e-6))
        deviations.append({"feature": f, "z_score": round(z, 3), "value": round(val, 3)})
    deviations.sort(key=lambda d: d["z_score"], reverse=True)
    top3 = deviations[:3]

    return {
        "situation_id": pred,
        "situation_name": sit["name"],
        "emoji": sit["emoji"],
        "severity": sit["severity"],
        "confidence": round(conf, 3),
        "confidence_level": conf_label,
        "should_notify": pred in NOTIFY_ON and conf_label != "low",
        "is_safety_critical": pred in SAFETY_ON and conf_label == "high",
        "top_features": top3,
        "all_probabilities": {
            STRESS_SITUATIONS[i]["name"]: round(float(proba[i]), 4)
            for i in range(len(proba))
        },
    }


def _stress_fallback(row: dict) -> dict:
    """Rule-based fallback when model files are missing."""
    motion = float(row.get("motion_p95", 0))
    audio = float(row.get("audio_db_p90", 50))
    speed = float(row.get("speed_mean", 30))
    lead = float(row.get("audio_leads_motion", 0))

    if motion > 3.5 and audio > 80:
        pred, conf = (4, 0.60) if lead < -5 else (3, 0.65)
    elif motion > 3.5 and speed < 20:
        pred, conf = 2, 0.70
    elif motion > 3.5:
        pred, conf = 1, 0.65
    elif audio > 80:
        pred, conf = 5, 0.60
    else:
        pred, conf = 0, 0.90

    sit = STRESS_SITUATIONS[pred]
    return {
        "situation_id": pred,
        "situation_name": sit["name"],
        "emoji": sit["emoji"],
        "severity": sit["severity"],
        "confidence": round(conf, 3),
        "confidence_level": "medium",
        "should_notify": pred in NOTIFY_ON,
        "is_safety_critical": pred in SAFETY_ON,
        "top_features": [],
        "all_probabilities": {},
    }



# ── Batch processing ──────────────────────────────────────────

def process_stress_csv(csv_content: str) -> dict:
    """Process a CSV of sensor windows. Returns per-row predictions + summary."""
    _load_stress_model()

    reader = csv.DictReader(io.StringIO(csv_content))
    rows = list(reader)

    if not rows:
        return {"error": "CSV is empty", "results": [], "summary": {}}

    row_count = len(rows)
    row_limit_warning = None
    if BATCH_ROW_SOFT_LIMIT and row_count > BATCH_ROW_SOFT_LIMIT:
        row_limit_warning = (
            f"Processed {row_count} rows; consider chunking to {BATCH_ROW_SOFT_LIMIT} rows per upload for large workloads."
        )
    results = []
    severity_counts = {"low": 0, "medium": 0, "high": 0}
    situation_counts = {}

    for i, row in enumerate(rows):
        # Add constant features
        row["motion_std"] = 0.3
        row["z_dev_max"] = 0.5
        row["spikes_above3"] = 0
        row["spikes_above5"] = 0
        row["audio_class_max"] = 2.0
        row["audio_class_mean"] = 1.0
        row["sustained_max"] = 10.0
        row["sustained_sum"] = 50.0
        row["cadence_var_max"] = 0.6
        row["audio_leads_motion"] = 0.0
        row["audio_onset_sec"] = 0.0
        row["brake_t_sec"] = 0.0
        row["is_low_speed"] = 0
        row["both_elevated"] = 0
        row["audio_only"] = 0
        pred = predict_stress_row(row)
        pred["row_index"] = i
        # Carry through any extra columns (trip_id, timestamp, etc.)
        for k in ("trip_id", "window_id", "timestamp", "start_time", "driver_id"):
            if k in row:
                pred[k] = row[k]

        results.append(pred)
        severity_counts[pred["severity"]] = severity_counts.get(pred["severity"], 0) + 1
        situation_counts[pred["situation_name"]] = situation_counts.get(pred["situation_name"], 0) + 1

    total = len(results)
    avg_confidence = round(sum(r["confidence"] for r in results) / total, 3)
    notify_count = sum(1 for r in results if r["should_notify"])
    safety_count = sum(1 for r in results if r["is_safety_critical"])

    summary = {
        "total_windows": total,
        "severity_counts": severity_counts,
        "situation_counts": situation_counts,
        "avg_confidence": avg_confidence,
        "notifications_triggered": notify_count,
        "safety_critical_count": safety_count,
        "stress_score": round(
            (severity_counts.get("high", 0) * 5 + severity_counts.get("medium", 0) * 3)
            / max(total, 1),
            2,
        ),
    }
    if row_limit_warning:
        summary["row_limit_warning"] = row_limit_warning

    return {
        "results": results,
        "summary": summary,
    }


# ── Template generators ──────────────────────────────────────

def stress_csv_template() -> str:
    """Return a CSV template string with headers + 2 sample rows."""
    feats = [
        "motion_max", "motion_mean", "motion_p95", "brake_intensity", "lateral_max",
        "speed_mean", "speed_at_brake", "speed_drop",
        "audio_db_max", "audio_db_mean", "audio_db_p90", "audio_db_std",
        "cadence_var_mean", "argument_frac", "loud_frac",
    ]
    header = "trip_id,timestamp," + ",".join(feats)
    row1 = "trip-001,08:15:00,1.2,0.6,1.1,0.8,0.5,35,35,5,68,62,67,4,0.1,0.15"
    row2 = "trip-002,09:30:00,5.1,1.8,4.8,4.9,2.1,40,40,25,94,82,91,8,0.72,0.95"
    return header + "\n" + row1 + "\n" + row2 + "\n"
