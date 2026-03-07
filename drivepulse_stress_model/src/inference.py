"""
src/inference.py
On-device inference engine. Loads once, predicts per 30s window.
Falls back to rule-based logic if model files are missing.
"""

import numpy as np
import json
import time
import joblib
from pathlib import Path

ROOT      = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "model"

SITUATIONS = {
    0: ('NORMAL',              '😊', 'Smooth trip — nothing to flag'),
    1: ('TRAFFIC_STOP',        '🛑', 'Traffic stop — normal braking'),
    2: ('SPEED_BREAKER',       '🚧', 'Speed breaker — slow road ahead'),
    3: ('CONFLICT',            '🚨', 'Hard brake + loud cabin at the same time'),
    4: ('ESCALATING_CONFLICT', '🚨', 'Loud cabin came before sudden braking'),
    5: ('ARGUMENT_ONLY',       '⚠️',  'Cabin got loud — check on passengers'),
    6: ('MUSIC_OR_CALL',       '🎵', 'Music or phone call — not an incident'),
}

NOTIFY_ON   = {3, 4, 5}
SAFETY_ON   = {3, 4}
CONF_HIGH   = 0.75
CONF_MEDIUM = 0.50


class InferenceEngine:

    def __init__(self):
        self._clf   = None
        self._mean  = None
        self._std   = None
        self._feats = None
        self._ok    = False
        self._load()

    def _load(self):
        try:
            self._clf  = joblib.load(MODEL_DIR / "rf_model.pkl")
            self._mean = np.load(MODEL_DIR / "baseline_mean.npy")
            self._std  = np.load(MODEL_DIR / "baseline_std.npy")
            self._feats = json.loads(
                (MODEL_DIR / "feature_contract.json").read_text())["features"]
            self._ok = True
            print(f"[inference] Model loaded ({len(self._feats)} features)")
        except Exception as e:
            print(f"[inference] Model not found ({e}) — using rule-based fallback")

    def predict(self, features: dict) -> dict:
        t0 = time.perf_counter()
        if self._ok:
            return self._ml(features, t0)
        return self._rules(features, t0)

    def _ml(self, features, t0):
        x = np.array([features.get(f, 0.0) for f in self._feats],
                      dtype=np.float32).reshape(1, -1)
        xn = (x - self._mean) / self._std
        pred  = int(self._clf.predict(xn)[0])
        proba = self._clf.predict_proba(xn)[0]
        conf  = float(proba[pred])
        ms    = (time.perf_counter() - t0) * 1000

        if conf < CONF_MEDIUM:
            pred, conf = 0, conf        # low confidence → don't alert

        clabel = 'HIGH' if conf >= CONF_HIGH else ('MEDIUM' if conf >= CONF_MEDIUM else 'LOW')
        name, emoji, msg = SITUATIONS[pred]

        return {
            'situation_id':       pred,
            'situation_name':     name,
            'emoji':              emoji,
            'driver_message':     msg,
            'confidence':         round(conf, 3),
            'confidence_label':   clabel,
            'should_notify':      pred in NOTIFY_ON and clabel != 'LOW',
            'is_safety_critical': pred in SAFETY_ON and clabel == 'HIGH',
            'inference_ms':       round(ms, 2),
            'fallback_used':      False,
            'motion_score':       int(min(features.get('motion_p95', 0) / 6.0 * 100, 100)),
            'audio_score':        int(min(features.get('audio_db_p90', 50) / 98.0 * 100, 100)),
        }

    def _rules(self, features, t0):
        motion = features.get('motion_p95', 0)
        audio  = features.get('audio_db_p90', 50)
        speed  = features.get('speed_mean', 30)
        lead   = features.get('audio_leads_motion', 0)

        if motion > 3.5 and audio > 80:
            pred, conf = (4, 0.6) if lead < -5 else (3, 0.65)
        elif motion > 3.5 and speed < 20:
            pred, conf = 2, 0.70
        elif motion > 3.5:
            pred, conf = 1, 0.65
        elif audio > 80:
            pred, conf = 5, 0.60
        else:
            pred, conf = 0, 0.90

        name, emoji, msg = SITUATIONS[pred]
        return {
            'situation_id':       pred,
            'situation_name':     name,
            'emoji':              emoji,
            'driver_message':     msg,
            'confidence':         conf,
            'confidence_label':   'MEDIUM',
            'should_notify':      pred in NOTIFY_ON,
            'is_safety_critical': pred in SAFETY_ON,
            'inference_ms':       round((time.perf_counter() - t0) * 1000, 2),
            'fallback_used':      True,
            'motion_score':       int(min(features.get('motion_p95', 0) / 6.0 * 100, 100)),
            'audio_score':        int(min(features.get('audio_db_p90', 50) / 98.0 * 100, 100)),
        }


# ── Demo ─────────────────────────────────────────────────────

DEMO_CASES = [
    ("Normal driving", dict(
        motion_max=1.2, motion_mean=0.6, motion_p95=1.1, motion_std=0.3,
        brake_intensity=0.8, lateral_max=0.5, z_dev_max=0.2,
        speed_mean=35, speed_at_brake=35, speed_drop=5,
        spikes_above3=0, spikes_above5=0,
        audio_db_max=68, audio_db_mean=62, audio_db_p90=67, audio_db_std=4,
        audio_class_max=2, audio_class_mean=1.2, sustained_max=0, sustained_sum=0,
        cadence_var_mean=0.1, cadence_var_max=0.15,
        argument_frac=0.0, loud_frac=0.05,
        audio_leads_motion=0, audio_onset_sec=15, brake_t_sec=15,
        is_low_speed=0, both_elevated=0, audio_only=0)),

    ("Hard brake, quiet cabin → TRAFFIC_STOP", dict(
        motion_max=4.5, motion_mean=1.2, motion_p95=4.1, motion_std=1.1,
        brake_intensity=4.2, lateral_max=0.8, z_dev_max=0.3,
        speed_mean=45, speed_at_brake=45, speed_drop=28,
        spikes_above3=3, spikes_above5=1,
        audio_db_max=72, audio_db_mean=63, audio_db_p90=70, audio_db_std=5,
        audio_class_max=2, audio_class_mean=1.3, sustained_max=0, sustained_sum=0,
        cadence_var_mean=0.12, cadence_var_max=0.18,
        argument_frac=0.0, loud_frac=0.02,
        audio_leads_motion=8, audio_onset_sec=5, brake_t_sec=20,
        is_low_speed=0, both_elevated=0, audio_only=0)),

    ("Brake + loud cabin → CONFLICT", dict(
        motion_max=5.1, motion_mean=1.8, motion_p95=4.8, motion_std=1.4,
        brake_intensity=4.9, lateral_max=2.1, z_dev_max=0.4,
        speed_mean=40, speed_at_brake=40, speed_drop=25,
        spikes_above3=4, spikes_above5=2,
        audio_db_max=94, audio_db_mean=82, audio_db_p90=91, audio_db_std=8,
        audio_class_max=5, audio_class_mean=3.8,
        sustained_max=45, sustained_sum=180,
        cadence_var_mean=0.72, cadence_var_max=0.95,
        argument_frac=0.55, loud_frac=0.82,
        audio_leads_motion=-1.5, audio_onset_sec=12, brake_t_sec=14,
        is_low_speed=0, both_elevated=1, audio_only=0)),

    ("Audio 12s before brake → ESCALATING", dict(
        motion_max=4.2, motion_mean=1.4, motion_p95=3.9, motion_std=1.1,
        brake_intensity=3.8, lateral_max=1.2, z_dev_max=0.3,
        speed_mean=38, speed_at_brake=38, speed_drop=20,
        spikes_above3=2, spikes_above5=1,
        audio_db_max=91, audio_db_mean=80, audio_db_p90=88, audio_db_std=7,
        audio_class_max=5, audio_class_mean=3.5,
        sustained_max=60, sustained_sum=240,
        cadence_var_mean=0.68, cadence_var_max=0.88,
        argument_frac=0.48, loud_frac=0.75,
        audio_leads_motion=-12, audio_onset_sec=3, brake_t_sec=15,
        is_low_speed=0, both_elevated=1, audio_only=0)),

    ("Steady loud, periodic → MUSIC", dict(
        motion_max=1.3, motion_mean=0.7, motion_p95=1.1, motion_std=0.25,
        brake_intensity=0.7, lateral_max=0.5, z_dev_max=0.2,
        speed_mean=32, speed_at_brake=32, speed_drop=2,
        spikes_above3=0, spikes_above5=0,
        audio_db_max=88, audio_db_mean=80, audio_db_p90=85, audio_db_std=3,
        audio_class_max=4, audio_class_mean=3.2,
        sustained_max=30, sustained_sum=900,
        cadence_var_mean=0.07, cadence_var_max=0.11,
        argument_frac=0.0, loud_frac=0.95,
        audio_leads_motion=20, audio_onset_sec=0, brake_t_sec=20,
        is_low_speed=0, both_elevated=0, audio_only=0)),
]


if __name__ == "__main__":
    print("Inference Demo\n" + "=" * 55)
    engine = InferenceEngine()
    print()
    for desc, feats in DEMO_CASES:
        r = engine.predict(feats)
        notify = "→ NOTIFY" if r['should_notify'] else ""
        safety = "🚨 SAFETY" if r['is_safety_critical'] else ""
        fb = "[FALLBACK]" if r['fallback_used'] else ""
        print(f"  {r['emoji']} {r['situation_name']:<22} "
              f"conf={r['confidence']:.2f} ({r['confidence_label']:<6}) "
              f"{r['inference_ms']:.1f}ms  {fb} {notify} {safety}")
        print(f"     {desc}")
        print(f"     → {r['driver_message']}\n")
