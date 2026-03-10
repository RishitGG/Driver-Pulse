"""
DrivePulse Backend — Batch CSV processing.
Loads trained stress + earnings models, runs inference on uploaded CSV data.
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

STRESS_MODEL_DIR = ROOT / "drivepulse_stress_model" / "model"

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


# ── Earnings model ────────────────────────────────────────────

EARNINGS_MODEL_DIR = ROOT / "earnings" / "earnings" / "model"

EARNINGS_FEATURES = [
    "elapsed_hours", "current_velocity", "velocity_delta",
    "trips_completed", "trip_rate", "hour_of_day",
    "is_morning_rush", "is_lunch_rush",
    "velocity_last_1", "velocity_last_2", "velocity_last_3",
    "rolling_velocity_3", "rolling_velocity_5", "goal_pressure",
]

_earnings_clf = None


def _load_earnings_model():
    global _earnings_clf
    if _earnings_clf is not None:
        return True
    try:
        _earnings_clf = joblib.load(EARNINGS_MODEL_DIR / "rf_model.pkl")
        print(f"[batch] Earnings model loaded")
        return True
    except Exception as e:
        print(f"[batch] Earnings model load failed: {e}")
        return False


def predict_earnings_row(row: dict) -> dict:
    """Run earnings prediction on a single row dict."""
    if not _load_earnings_model():
        return {"predicted_velocity": None, "error": "Model not loaded"}

    x = np.array(
        [float(row.get(f, 0.0)) for f in EARNINGS_FEATURES], dtype=np.float32
    ).reshape(1, -1)
    predicted = float(_earnings_clf.predict(x)[0])
    predicted = max(0, round(predicted, 2))

    target_velocity = float(row.get("target_velocity", 200))
    current_velocity = float(row.get("current_velocity", 0))
    target_earnings = float(row.get("target_earnings", 1800))
    current_earnings = float(row.get("cumulative_earnings", 0))
    elapsed = float(row.get("elapsed_hours", 0))
    remaining_earnings = max(0, target_earnings - current_earnings)

    if predicted > 0:
        hours_needed = remaining_earnings / predicted
    else:
        hours_needed = None

    if predicted >= target_velocity * 1.1:
        forecast = "ahead"
    elif predicted >= target_velocity * 0.9:
        forecast = "on_track"
    else:
        forecast = "at_risk"

    return {
        "predicted_velocity": round(predicted, 2),
        "target_velocity": target_velocity,
        "current_velocity": current_velocity,
        "forecast_status": forecast,
        "remaining_earnings": round(remaining_earnings, 2),
        "hours_to_target": round(hours_needed, 2) if hours_needed else None,
        "pct_target": round(min(100, (current_earnings / max(target_earnings, 1)) * 100), 1),
    }


# ── Feature engineering for earnings (from raw trip CSV) ──────

def engineer_earnings_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a raw trip-level DataFrame and engineers the 14 features
    needed for the earnings model. Columns expected:
      driver_id, timestamp, cumulative_earnings, elapsed_hours,
      current_velocity, target_velocity, velocity_delta,
      trips_completed, target_earnings
    """
    df = df.copy()

    # Parse timestamp → hour info
    if "timestamp" in df.columns:
        ts = pd.to_datetime(df["timestamp"], errors="coerce")
        df["hour_of_day"] = ts.dt.hour.fillna(12).astype(int)
    elif "hour_of_day" not in df.columns:
        df["hour_of_day"] = 12

    df["is_morning_rush"] = df["hour_of_day"].between(7, 9).astype(int)
    df["is_lunch_rush"] = df["hour_of_day"].between(12, 14).astype(int)

    # trip_rate
    df["elapsed_hours"] = pd.to_numeric(df.get("elapsed_hours", 1), errors="coerce").fillna(1)
    df["trips_completed"] = pd.to_numeric(df.get("trips_completed", 0), errors="coerce").fillna(0)
    df["trip_rate"] = df["trips_completed"] / df["elapsed_hours"].replace(0, 1)

    # Velocity lags + rolling
    df["current_velocity"] = pd.to_numeric(df.get("current_velocity", 0), errors="coerce").fillna(0).clip(0, 600)
    df["velocity_delta"] = pd.to_numeric(df.get("velocity_delta", 0), errors="coerce").fillna(0)
    df["target_velocity"] = pd.to_numeric(df.get("target_velocity", 200), errors="coerce").fillna(200)

    df = df.sort_values(["driver_id", "hour_of_day"] if "driver_id" in df.columns else ["hour_of_day"])
    grp = "driver_id" if "driver_id" in df.columns else None

    if grp:
        df["velocity_last_1"] = df.groupby(grp)["current_velocity"].shift(1)
        df["velocity_last_2"] = df.groupby(grp)["current_velocity"].shift(2)
        df["velocity_last_3"] = df.groupby(grp)["current_velocity"].shift(3)
        df["rolling_velocity_3"] = df.groupby(grp)["current_velocity"].transform(
            lambda s: s.rolling(3, min_periods=1).mean()
        )
        df["rolling_velocity_5"] = df.groupby(grp)["current_velocity"].transform(
            lambda s: s.rolling(5, min_periods=1).mean()
        )
    else:
        df["velocity_last_1"] = df["current_velocity"].shift(1)
        df["velocity_last_2"] = df["current_velocity"].shift(2)
        df["velocity_last_3"] = df["current_velocity"].shift(3)
        df["rolling_velocity_3"] = df["current_velocity"].rolling(3, min_periods=1).mean()
        df["rolling_velocity_5"] = df["current_velocity"].rolling(5, min_periods=1).mean()

    df["goal_pressure"] = df["target_velocity"] - df["current_velocity"]

    # Fill NaNs from shifting
    df = df.bfill().ffill().fillna(0)

    return df


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


def process_earnings_csv(csv_content: str) -> dict:
    """Process a CSV of earnings/trip data. Returns per-row velocity predictions + summary."""
    _load_earnings_model()

    df = pd.read_csv(io.StringIO(csv_content))

    if df.empty:
        return {"error": "CSV is empty", "results": [], "summary": {}}

    row_count = len(df)
    row_limit_warning = None
    if BATCH_ROW_SOFT_LIMIT and row_count > BATCH_ROW_SOFT_LIMIT:
        row_limit_warning = (
            f"Processed {row_count} rows; consider chunking to {BATCH_ROW_SOFT_LIMIT} rows per upload for large workloads."
        )

    # Fill defaults for missing columns
    for col, default in [
        ("driver_id", "driver-001"),
        ("target_velocity", 200),
        ("velocity_delta", 0),
        ("target_earnings", 1800),
        ("cumulative_earnings", 0),
    ]:
        if col not in df.columns:
            df[col] = default

    df = engineer_earnings_features(df)

    results = []
    total_predicted = 0

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        pred = predict_earnings_row(row_dict)
        pred["row_index"] = int(i)
        for k in ("driver_id", "timestamp", "trip_id", "hour_of_day"):
            if k in row_dict:
                pred[k] = row_dict[k]
                if isinstance(pred[k], float) and not math.isnan(pred[k]):
                    pred[k] = int(pred[k]) if k == "hour_of_day" else pred[k]
                elif isinstance(pred[k], float) and math.isnan(pred[k]):
                    pred[k] = None

        pred["cumulative_earnings"] = round(float(row_dict.get("cumulative_earnings", 0)), 2)
        pred["elapsed_hours"] = round(float(row_dict.get("elapsed_hours", 0)), 2)

        results.append(pred)
        if pred["predicted_velocity"] is not None:
            total_predicted += pred["predicted_velocity"]

    total = len(results)
    avg_velocity = round(total_predicted / max(total, 1), 2)

    forecast_counts = {"ahead": 0, "on_track": 0, "at_risk": 0}
    for r in results:
        forecast_counts[r.get("forecast_status", "on_track")] += 1

    summary = {
        "total_entries": total,
        "avg_predicted_velocity": avg_velocity,
        "forecast_counts": forecast_counts,
        "best_velocity": max((r["predicted_velocity"] for r in results if r["predicted_velocity"]), default=0),
        "worst_velocity": min((r["predicted_velocity"] for r in results if r["predicted_velocity"]), default=0),
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


def earnings_csv_template() -> str:
    """Return a CSV template string for earnings upload."""
    header = "driver_id,timestamp,cumulative_earnings,elapsed_hours,current_velocity,target_velocity,velocity_delta,trips_completed,target_earnings"
    row1 = "driver-001,08:00:00,0,0.5,0,200,0,0,1800"
    row2 = "driver-001,09:00:00,185,1.5,185,200,-15,2,1800"
    row3 = "driver-001,10:00:00,420,2.5,210,200,10,4,1800"
    return header + "\n" + row1 + "\n" + row2 + "\n" + row3 + "\n"
