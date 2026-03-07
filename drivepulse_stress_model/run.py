"""
run.py  —  DrivePulse Stress Detection
Single entry point. Run from the project root directory.

Usage:
    python run.py              # full pipeline (generate → train → demo)
    python run.py --generate   # only generate data
    python run.py --train      # only train (needs data)
    python run.py --demo       # only run inference demo (needs model)
    python run.py --calibrate  # only run HAL calibration demo
"""

import sys
import argparse
from pathlib import Path

# Make src/ importable
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))


def step_generate():
    print("\n" + "─" * 50)
    print("STEP 1 — Generate Synthetic Data")
    print("─" * 50)
    from generate_data import generate
    generate()


def step_calibrate():
    print("\n" + "─" * 50)
    print("STEP 2 — HAL Calibration Demo")
    print("─" * 50)
    import numpy as np
    import hal
    np.random.seed(42)

    p = hal.load()
    quiet = np.random.normal(58, 3, 30).clip(50, 70)
    p = hal.phase1_agc(quiet, p)

    n = 200
    speed = np.random.uniform(25, 45, n)
    x = np.abs(np.random.normal(0.7, 0.3, n))
    y = np.abs(np.random.normal(0.5, 0.25, n))
    z = np.random.normal(9.8, 0.2, n)
    p = hal.phase2_road_baseline(x, y, z, speed, p)
    hal.save(p)

    nx, ny, nz = hal.normalise_accel(3.2, 1.8, 9.7, p)
    net_db = hal.normalise_audio(88.0, p)
    print(f"\n  Accel (3.2, 1.8, 9.7) → ({nx:.3f}, {ny:.3f}, {nz:.3f})")
    print(f"  Audio 88.0 dB → {net_db:.1f} dB net above ambient")


def step_train():
    print("\n" + "─" * 50)
    print("STEP 3 — Train & Evaluate")
    print("─" * 50)
    from train import run
    run()


def step_demo():
    print("\n" + "─" * 50)
    print("STEP 4 — Inference Demo")
    print("─" * 50)
    from inference import InferenceEngine, DEMO_CASES
    engine = InferenceEngine()
    print()
    for desc, feats in DEMO_CASES:
        r = engine.predict(feats)
        notify = "→ NOTIFY" if r['should_notify'] else ""
        safety = "🚨 SAFETY" if r['is_safety_critical'] else ""
        fb     = "[FALLBACK]" if r['fallback_used'] else ""
        print(f"  {r['emoji']}  {r['situation_name']:<22} "
              f"conf={r['confidence']:.2f} ({r['confidence_label']:<6}) "
              f"{r['inference_ms']:.1f}ms  {fb} {notify} {safety}")
        print(f"       {desc}")
        print(f"       {r['driver_message']}\n")


def main():
    parser = argparse.ArgumentParser(description="DrivePulse Stress Detection")
    parser.add_argument("--generate",  action="store_true", help="Generate synthetic data only")
    parser.add_argument("--calibrate", action="store_true", help="Run HAL calibration demo only")
    parser.add_argument("--train",     action="store_true", help="Train model only")
    parser.add_argument("--demo",      action="store_true", help="Run inference demo only")
    args = parser.parse_args()

    any_flag = args.generate or args.calibrate or args.train or args.demo

    if args.generate:
        step_generate()
    elif args.calibrate:
        step_calibrate()
    elif args.train:
        step_train()
    elif args.demo:
        step_demo()
    else:
        # Full pipeline
        print("=" * 50)
        print("DrivePulse — Full Pipeline")
        print("=" * 50)
        step_generate()
        step_calibrate()
        step_train()
        step_demo()
        print("\n" + "=" * 50)
        print("Pipeline complete.")
        print("Model saved in:  model/")
        print("Data saved in:   data/")
        print("=" * 50)


if __name__ == "__main__":
    main()
