"""
src/hal.py
Hardware Abstraction Layer + Calibration.
Normalises sensor readings across phone models and mounting positions.
"""

import numpy as np
import json
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Optional

ROOT     = Path(__file__).resolve().parent.parent
CAL_FILE = ROOT / "calibration" / "device_profile.json"


@dataclass
class DeviceProfile:
    # Accelerometer
    gravity_axis:           str   = 'z'
    gravity_sign:           float = 1.0
    accel_scale:            float = 1.0
    accel_x_offset:         float = 0.0
    accel_y_offset:         float = 0.0
    accel_z_offset:         float = 9.8
    sampling_rate_hz:       float = 10.0
    # Audio (AGC)
    mic_gain_db:            float = 0.0
    ambient_floor_db:       float = 52.0
    road_noise_floor_db:    float = 62.0
    # Road vibration baseline
    vibration_baseline_mag: float = 1.2
    vibration_baseline_std: float = 0.4
    # Status
    phase1_complete:        bool  = False
    phase2_complete:        bool  = False
    calibration_confidence: float = 0.0
    has_gyroscope:          bool  = True


def phase1_agc(audio_db: np.ndarray, profile: DeviceProfile) -> DeviceProfile:
    """
    30-second stationary cabin calibration.
    Uses 10th percentile as true quiet floor.
    Target = 52 dB (real dataset quiet baseline).
    No audio content used — only dB envelope.
    """
    if len(audio_db) < 10:
        print("[HAL] Phase 1 skipped — not enough readings")
        return profile
    observed = float(np.percentile(audio_db, 10))
    profile.mic_gain_db      = 52.0 - observed
    profile.ambient_floor_db = observed
    profile.phase1_complete  = True
    print(f"[HAL] Phase 1 AGC: floor={observed:.1f} dB  "
          f"correction={profile.mic_gain_db:+.1f} dB")
    return profile


def phase2_road_baseline(x: np.ndarray, y: np.ndarray,
                          z: np.ndarray, speed: np.ndarray,
                          profile: DeviceProfile) -> DeviceProfile:
    """
    Calibrate on first 2 minutes of driving at >20 km/h.
    Detects: gravity axis, scale factor, road vibration baseline.
    """
    mask = speed > 20.0
    if mask.sum() < 20:
        print("[HAL] Phase 2 skipped — need 20+ readings at >20 km/h")
        return profile

    xc, yc, zc = x[mask], y[mask], z[mask]
    means = {'x': abs(xc.mean()), 'y': abs(yc.mean()), 'z': abs(zc.mean())}
    g_axis = max(means, key=means.get)
    g_val  = {'x': xc.mean(), 'y': yc.mean(), 'z': zc.mean()}[g_axis]
    scale  = 9.81 / abs(g_val) if abs(g_val) > 0 else 1.0

    mag_xy = np.sqrt(xc**2 + yc**2)
    profile.gravity_axis             = g_axis
    profile.gravity_sign             = float(np.sign(g_val))
    profile.accel_scale              = float(scale)
    profile.vibration_baseline_mag   = float(mag_xy.mean())
    profile.vibration_baseline_std   = float(mag_xy.std())
    profile.road_noise_floor_db      = profile.ambient_floor_db + 8.0
    profile.phase2_complete          = True
    profile.calibration_confidence   = _confidence(profile)
    print(f"[HAL] Phase 2 road: axis={g_axis}  scale={scale:.3f}  "
          f"vib={profile.vibration_baseline_mag:.3f}  "
          f"confidence={profile.calibration_confidence:.0%}")
    return profile


def normalise_accel(x: float, y: float, z: float,
                     p: DeviceProfile) -> tuple:
    x = (x * p.accel_scale) - p.accel_x_offset
    y = (y * p.accel_scale) - p.accel_y_offset
    z = (z * p.accel_scale) - p.accel_z_offset
    mag = np.sqrt(x**2 + y**2)
    if mag > 0 and p.vibration_baseline_mag > 0:
        net = max(mag - p.vibration_baseline_mag, 0)
        x = x * (net / mag)
        y = y * (net / mag)
    return float(x), float(y), float(z)


def normalise_audio(raw_db: float, p: DeviceProfile) -> float:
    """Returns net cabin audio above ambient (dB). No content used."""
    return float(max((raw_db + p.mic_gain_db) - p.road_noise_floor_db, 0))


def update_drift(quiet_db: np.ndarray, cruise_mag: np.ndarray,
                  p: DeviceProfile, alpha=0.15) -> DeviceProfile:
    """EMA drift correction every 10 minutes."""
    if len(quiet_db) >= 5:
        p.ambient_floor_db = (
            (1 - alpha) * p.ambient_floor_db +
            alpha * float(np.percentile(quiet_db, 10))
        )
    if len(cruise_mag) >= 10:
        p.vibration_baseline_mag = (
            (1 - alpha) * p.vibration_baseline_mag +
            alpha * float(np.percentile(cruise_mag, 25))
        )
    return p


def save(p: DeviceProfile, path: Path = CAL_FILE):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(asdict(p), indent=2))
    print(f"[HAL] Profile saved → {path}")


def load(path: Path = CAL_FILE) -> DeviceProfile:
    if path.exists():
        return DeviceProfile(**json.loads(path.read_text()))
    return DeviceProfile()


def _confidence(p: DeviceProfile) -> float:
    return min(
        (0.4 if p.phase1_complete else 0) +
        (0.4 if p.phase2_complete else 0) +
        (0.1 if p.vibration_baseline_mag > 0 else 0) +
        (0.1 if abs(p.mic_gain_db) < 20 else 0),
        1.0
    )


if __name__ == "__main__":
    np.random.seed(42)
    print("HAL Calibration Demo\n" + "=" * 40)
    p = load()

    # Phase 1: stationary cabin (simulated hot mic +6 dB)
    quiet = np.random.normal(58, 3, 30).clip(50, 70)
    p = phase1_agc(quiet, p)

    # Phase 2: first 2 min at cruise speed
    n = 200
    speed = np.random.uniform(25, 45, n)
    x = np.abs(np.random.normal(0.7, 0.3, n))
    y = np.abs(np.random.normal(0.5, 0.25, n))
    z = np.random.normal(9.8, 0.2, n)
    p = phase2_road_baseline(x, y, z, speed, p)

    save(p)
    print(f"\nNormalisation demo:")
    nx, ny, nz = normalise_accel(3.2, 1.8, 9.7, p)
    print(f"  Accel raw=(3.2, 1.8, 9.7)  →  norm=({nx:.3f}, {ny:.3f}, {nz:.3f})")
    print(f"  Audio raw=88.0 dB  →  net={normalise_audio(88.0, p):.1f} dB above ambient")
