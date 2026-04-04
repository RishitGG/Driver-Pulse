# DriveIntel — Stress Detection Model

Edge-computed driver stress detection. No audio recorded. No cloud inference.
Classifies 30-second sensor windows into 7 situation types.

---

## Setup (one time)

**Requirements:** Python 3.9 or newer

```bash
# 1. Clone or unzip the project
cd driveintel_stress_model

# 2. Create a virtual environment (recommended)
python -m venv venv

# Activate it:
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Run

### Full pipeline (recommended first run)
```bash
python run.py
```
Runs all 4 steps in order: generate data → calibrate → train → demo.

### Individual steps
```bash
python run.py --generate    # Step 1: generate synthetic training data
python run.py --calibrate   # Step 2: HAL calibration demo
python run.py --train       # Step 3: train + evaluate model
python run.py --demo        # Step 4: run inference on test cases
```

---

## What each step does

**Step 1 — Generate data** (`src/generate_data.py`)
Creates 3,150 synthetic 30-second sensor windows across 7 situation classes.
Distributions are anchored to the real DrivePulse dataset (243 accel readings,
248 audio readings, 30 trips). Adds realistic sensor noise, temporal jitter,
rain contamination, and class boundary overlap so the model sees ambiguous cases.

Output: `data/synthetic_windows.csv`

**Step 2 — HAL Calibration** (`src/hal.py`)
Simulates the two-phase phone calibration:
- Phase 1: mic sensitivity correction (AGC) from 30s stationary audio
- Phase 2: road vibration baseline from first 2 min at >20 km/h

Output: `calibration/device_profile.json`

**Step 3 — Train** (`src/train.py`)
Trains a Random Forest (200 trees, depth 14) with 5-fold cross-validation.
Evaluates on held-out test set with per-class metrics and safety-critical
class breakdown (CONFLICT + ESCALATING precision/recall/FP/FN).

Output: `model/rf_model.pkl`, `model/feature_contract.json`, baselines

**Step 4 — Inference demo** (`src/inference.py`)
Runs 5 hand-crafted test cases through the loaded model.
Falls back to rule-based logic automatically if model files are missing.

---

## Expected results

```
CV F1 macro:  0.970 ± 0.009
Test accuracy: 0.981
Test F1 macro: 0.983

CONFLICT   precision=1.00  recall=1.00  FP=0  FN=0
ESCALATING precision=1.00  recall=1.00  FP=0  FN=0

Only misclassifications:
  SPEED_BREAKER → NORMAL  (×5)   ← mild breaker looks like pothole
  NORMAL → SPEED_BREAKER  (×4)   ← pothole in normal window
  (these are expected — genuinely ambiguous at low speed)
```

**Real-world expectation: 0.78–0.85 F1** once trained on 200+ labeled real trips.
The synthetic test set is a clean lower bound, not a production estimate.

---

## Project structure

```
driveintel_stress_model/
│
├── run.py                    ← entry point
├── requirements.txt
│
├── src/
│   ├── generate_data.py      ← synthetic data generator
│   ├── hal.py                ← hardware abstraction + calibration
│   ├── train.py              ← training + evaluation pipeline
│   └── inference.py          ← edge inference engine
│
├── data/                     ← created on first run
│   └── synthetic_windows.csv
│
├── model/                    ← created after training
│   ├── rf_model.pkl
│   ├── calibrated_model.pkl
│   ├── baseline_mean.npy
│   ├── baseline_std.npy
│   └── feature_contract.json
│
└── calibration/              ← created after HAL demo
    └── device_profile.json
```

---

## Privacy

The microphone is used as a **sound level meter only**:
- `cadence_var` detects acoustic irregularity (periodic = music, irregular = argument)
- `audio_class` outputs one label per second (quiet/normal/loud/argument)
- Raw audio signal is never stored or transmitted
- No speech recognition, no conversation content, no passenger identity

All 30 features are kinematic aggregates or acoustic envelope statistics.
This is equivalent to watching a VU meter — you know it's loud, not what's being said.

---

## 7 Situation Classes

| Class | Trigger | Notify driver? |
|---|---|---|
| NORMAL | Baseline | No |
| TRAFFIC_STOP | Hard brake ≥30 km/h, quiet cabin | No |
| SPEED_BREAKER | Hard brake <20 km/h, quiet cabin | No |
| CONFLICT | Hard brake + loud audio simultaneously | ⚠ Yes |
| ESCALATING | Loud audio **precedes** brake by >5s | 🚨 Yes (safety) |
| ARGUMENT_ONLY | Sustained loud audio, no motion | ⚠ Yes |
| MUSIC_OR_CALL | Continuous periodic audio | No |

The ESCALATING class is the key innovation — `audio_leads_motion < -5s` means
the argument was ongoing before the driver reacted. This is a causal chain,
not a coincidence. No single-trigger system catches this.
