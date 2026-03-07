"""
src/generate_data.py
Generates realistic synthetic sensor windows for training.
All paths relative to project root (one level up from src/).
"""

import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

np.random.seed(42)

WINDOW_SEC = 30
ACCEL_HZ   = 10

CLASS_NAMES = {
    0: 'NORMAL',
    1: 'TRAFFIC_STOP',
    2: 'SPEED_BREAKER',
    3: 'CONFLICT',
    4: 'ESCALATING',
    5: 'ARGUMENT_ONLY',
    6: 'MUSIC_OR_CALL',
}

SAMPLES_PER_CLASS = {
    0: 900, 1: 450, 2: 350,
    3: 400, 4: 400, 5: 350, 6: 300,
}

AUDIO_CLASS_RANK = {
    'quiet': 0, 'normal': 1, 'conversation': 2,
    'loud': 3, 'very_loud': 4, 'argument': 5,
}


# ── Noise helpers ────────────────────────────────────────────

def _sensor_noise(sig, snr_db=25):
    pwr = np.mean(sig ** 2) + 1e-10
    noise = np.random.normal(0, np.sqrt(pwr / 10 ** (snr_db / 10)), len(sig))
    return sig + noise

def _temporal_jitter(t, sigma=2.5):
    return float(t + np.random.normal(0, sigma))

def _add_pothole(x, y, z, t_idx, severity='mild'):
    dur = np.random.randint(2, 5)
    end = min(t_idx + dur, len(z))
    amp = {'mild': 1.5, 'moderate': 2.5, 'severe': 4.0}[severity]
    z[t_idx:end] += np.random.uniform(amp * 0.7, amp, end - t_idx)
    y[t_idx:end] += np.random.uniform(0.3, 0.8, end - t_idx)
    return x, y, z

def _rain_contamination(db, classes, intensity='moderate'):
    lift = {'light': 5, 'moderate': 12, 'heavy': 22}[intensity]
    db = (db + lift + np.random.normal(0, 3, len(db))).clip(50, 98)
    rp = {'light': 0.10, 'moderate': 0.35, 'heavy': 0.60}[intensity]
    for i, c in enumerate(classes):
        if c in ('quiet', 'normal') and np.random.random() < rp:
            classes[i] = np.random.choice(['loud', 'very_loud'], p=[0.7, 0.3])
    return db, classes


# ── Signal builders ──────────────────────────────────────────

def _accel(n, speed_base, snr=22):
    x = np.abs(_sensor_noise(np.abs(np.random.normal(0.7, 0.5, n)).clip(0.05, 3.0), snr))
    y = np.abs(_sensor_noise(np.abs(np.random.normal(0.5, 0.35, n)).clip(0.05, 2.0), snr))
    z = np.random.normal(9.8, 0.3, n).clip(8.5, 10.8)
    s = np.random.normal(speed_base, 4, n).clip(0, 62)
    return x, y, z, s

def _audio(n, db_base, db_std, weights, rain_p=0.15):
    db  = _sensor_noise(np.random.normal(db_base, db_std, n).clip(50, 98), 30)
    cls = list(np.random.choice(
        ['quiet','normal','conversation','loud','very_loud'], size=n, p=weights))
    dur  = np.zeros(n)
    cvar = np.abs(np.random.normal(0.12, 0.08, n)).clip(0.0, 0.35)
    if np.random.random() < rain_p:
        inten = np.random.choice(['light','moderate'], p=[0.7, 0.3])
        db, cls = _rain_contamination(db, cls, inten)
        cvar += np.random.uniform(0.15, 0.35, n)
    return db, cls, dur, cvar

def _argument_audio(n, onset, sustained, base_db=85, rain_p=0.10):
    db  = np.random.normal(64, 8, n).clip(50, 82)
    cls = list(np.random.choice(
        ['normal','conversation','loud'], size=n, p=[0.25, 0.45, 0.30]))
    dur  = np.zeros(n)
    cvar = np.abs(np.random.normal(0.12, 0.07, n)).clip(0.0, 0.3)
    onset = max(0, int(onset))
    end   = min(onset + sustained, n)
    arg_db = np.random.normal(base_db, 6, end - onset)
    lull   = np.random.random(end - onset) < 0.15
    arg_db[lull] -= np.random.uniform(8, 18, lull.sum())
    db[onset:end] = arg_db.clip(72, 98)
    ac = np.random.choice(['argument','very_loud','loud'],
                           size=end-onset, p=[0.50, 0.32, 0.18])
    for i, idx in enumerate(range(onset, end)):
        cls[idx] = ac[i]
    dur[onset:end]  = np.random.uniform(10, 50, end - onset)
    cvar[onset:end] = np.abs(np.random.normal(0.70, 0.18, end-onset)).clip(0.35, 1.0)
    if np.random.random() < rain_p:
        db, cls = _rain_contamination(db, cls, 'light')
        cvar += np.random.uniform(0.05, 0.15, n)
    return db, cls, dur, cvar


# ── Feature extractor ────────────────────────────────────────

def _features(x, y, z, spd, db, cls, dur, cvar,
               label, brake_t_sec=None, audio_onset_sec=None):
    mag = np.sqrt(x**2 + y**2)
    cr  = np.array([AUDIO_CLASS_RANK.get(c, 1) for c in cls])
    n   = len(db)

    bi = min(int((brake_t_sec or 15) * ACCEL_HZ), len(spd) - 1)
    apeak = int(np.argmax(db))
    mpeak = np.argmax(mag) / ACCEL_HZ
    raw_lead = apeak - mpeak

    return {
        'motion_max':       float(mag.max()),
        'motion_mean':      float(mag.mean()),
        'motion_p95':       float(np.percentile(mag, 95)),
        'motion_std':       float(mag.std()),
        'brake_intensity':  float(y.max()),
        'lateral_max':      float(x.max()),
        'z_dev_max':        float(np.abs(z - 9.8).max()),
        'speed_mean':       float(spd.mean()),
        'speed_at_brake':   float(spd[bi]),
        'speed_drop':       float(spd.max() - spd[-10:].mean()),
        'spikes_above3':    int((mag > 3.0).sum()),
        'spikes_above5':    int((mag > 5.0).sum()),
        'audio_db_max':     float(db.max()),
        'audio_db_mean':    float(db.mean()),
        'audio_db_p90':     float(np.percentile(db, 90)),
        'audio_db_std':     float(db.std()),
        'audio_class_max':  int(cr.max()),
        'audio_class_mean': float(cr.mean()),
        'sustained_max':    float(dur.max()),
        'sustained_sum':    float(dur.sum()),
        'cadence_var_mean': float(np.array(cvar).mean()),
        'cadence_var_max':  float(np.array(cvar).max()),
        'argument_frac':    float((cr >= 5).sum() / n),
        'loud_frac':        float((cr >= 3).sum() / n),
        'audio_leads_motion': _temporal_jitter(raw_lead, 2.5),
        'audio_onset_sec':  _temporal_jitter(audio_onset_sec if audio_onset_sec is not None else float(apeak), 2.0),
        'brake_t_sec':      _temporal_jitter(brake_t_sec if brake_t_sec is not None else mpeak, 1.5),
        'is_low_speed':     int(spd.mean() < 20),
        'both_elevated':    int(float(np.percentile(mag, 95)) > 2.5 and float(np.percentile(db, 90)) > 78),
        'audio_only':       int(float(np.percentile(mag, 95)) < 2.0 and float(np.percentile(db, 90)) > 80),
        'situation_label':  label,
        'situation_name':   CLASS_NAMES[label],
    }


# ── Class generators ─────────────────────────────────────────

def _gen_normal(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(10, 55)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp)
        if np.random.random() < 0.30:
            x, y, z = _add_pothole(x, y, z, np.random.randint(5, na-10),
                                   np.random.choice(['mild','moderate'], p=[0.75, 0.25]))
        db, cls, dur, cv = _audio(WINDOW_SEC, 62, 7, [0.20,0.40,0.30,0.08,0.02])
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 0))
    return rows

def _gen_traffic_stop(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(28, 58)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp, snr=20)
        bt = np.random.uniform(14, 24)
        bi = int(bt * ACCEL_HZ)
        bd = np.random.randint(3, 9)
        bm = np.random.uniform(2.2, 4.8)
        y[bi:bi+bd] += np.random.uniform(bm*0.7, bm, bd)
        spd[bi:] = np.maximum(spd[bi:] - np.linspace(0, sp*0.75, na-bi), 0)
        w = [0.10,0.35,0.35,0.15,0.05] if np.random.random() < 0.20 else [0.25,0.50,0.20,0.04,0.01]
        db, cls, dur, cv = _audio(WINDOW_SEC, 60, 7, w)
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 1, brake_t_sec=bt))
    return rows

def _gen_speed_breaker(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(4, 22)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp)
        bt = np.random.randint(8*ACCEL_HZ, 22*ACCEL_HZ)
        bd = np.random.randint(2, 6)
        za = np.random.uniform(1.2, 3.5)
        z[bt:bt+bd] += np.random.uniform(za*0.6, za, bd)
        y[bt:bt+bd] += np.random.uniform(0.3, 1.2, bd)
        db, cls, dur, cv = _audio(WINDOW_SEC, 61, 7, [0.25,0.45,0.24,0.05,0.01], rain_p=0.15)
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 2))
    return rows

def _gen_conflict(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(22, 58)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp, snr=18)
        bt = np.random.uniform(13, 22)
        bi = int(bt * ACCEL_HZ)
        bd = np.random.randint(3, 9)
        bm = np.random.uniform(2.8, 5.2)
        y[bi:bi+bd] += np.random.uniform(bm*0.7, bm, bd)
        ao = np.clip(bt + np.random.uniform(-4, 4), 1, WINDOW_SEC-8)
        su = np.random.randint(8, 18)
        db, cls, dur, cv = _argument_audio(WINDOW_SEC, ao, su,
                                            np.random.uniform(82, 94))
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 3,
                               brake_t_sec=bt, audio_onset_sec=ao))
    return rows

def _gen_escalating(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(22, 55)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp, snr=18)
        ao = np.random.uniform(1, 10)
        su = np.random.randint(12, 22)
        bt = np.clip(ao + np.random.uniform(5, 22), 8, WINDOW_SEC-4)
        bi = int(bt * ACCEL_HZ)
        bd = np.random.randint(3, 8)
        bm = np.random.uniform(2.5, 4.8)
        y[bi:bi+bd] += np.random.uniform(bm*0.7, bm, bd)
        db, cls, dur, cv = _argument_audio(WINDOW_SEC, ao, su,
                                            np.random.uniform(80, 93))
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 4,
                               brake_t_sec=bt, audio_onset_sec=ao))
    return rows

def _gen_argument_only(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(0, 32)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp)
        if np.random.random() < 0.20:
            x, y, z = _add_pothole(x, y, z, np.random.randint(5, na-5), 'mild')
        ao = np.random.uniform(0, 8)
        su = np.random.randint(15, 28)
        db, cls, dur, cv = _argument_audio(WINDOW_SEC, ao, su,
                                            np.random.uniform(82, 92))
        rows.append(_features(x, y, z, spd, db, cls, dur, cv, 5,
                               audio_onset_sec=ao))
    return rows

def _gen_music_or_call(n):
    rows = []
    for _ in range(n):
        sp = np.random.uniform(10, 50)
        na = WINDOW_SEC * ACCEL_HZ
        x, y, z, spd = _accel(na, sp)
        db   = _sensor_noise(np.random.normal(79, 5, WINDOW_SEC).clip(65, 93), 28)
        cls  = list(np.random.choice(['loud','very_loud','conversation'],
                                      size=WINDOW_SEC, p=[0.45,0.28,0.27]))
        dur  = np.full(WINDOW_SEC, np.random.uniform(20, 60))
        cvar = np.abs(np.random.normal(0.09, 0.06, WINDOW_SEC)).clip(0.0, 0.25)
        if np.random.random() < 0.15:
            db, cls = _rain_contamination(db, cls, 'heavy')
            cvar += np.random.uniform(0.20, 0.45, WINDOW_SEC)
        rows.append(_features(x, y, z, spd, db, cls, dur, cvar, 6))
    return rows


# ── Main ─────────────────────────────────────────────────────

def generate():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out = DATA_DIR / "synthetic_windows.csv"

    print("Generating synthetic sensor windows...")
    gens = {0:_gen_normal, 1:_gen_traffic_stop, 2:_gen_speed_breaker,
            3:_gen_conflict, 4:_gen_escalating,
            5:_gen_argument_only, 6:_gen_music_or_call}

    rows = []
    for label, fn in gens.items():
        n = SAMPLES_PER_CLASS[label]
        rows.extend(fn(n))
        print(f"  [{CLASS_NAMES[label]:<22}] {n} windows")

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(out, index=False)
    print(f"\n  Saved → {out}  ({len(df)} windows, {out.stat().st_size//1024} KB)")
    return df


if __name__ == "__main__":
    generate()
