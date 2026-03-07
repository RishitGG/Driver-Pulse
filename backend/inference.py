"""
Load ML models and provide prediction functions.
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
import time

# Paths to models (relative to project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
STRESS_MODEL_DIR = PROJECT_ROOT / "drivepulse_stress_model" / "model"
EARNINGS_MODEL_DIR = PROJECT_ROOT / "earnings" / "earnings" / "model"


class ModelManager:
    def __init__(self):
        self.stress_model = None
        self.stress_mean = None
        self.stress_std = None
        self.stress_features = None
        self.earnings_model = None
        self.stress_loaded = False
        self.earnings_loaded = False
        self._load_models()
    
    def _load_models(self):
        """Load both models at startup."""
        try:
            self.stress_model = joblib.load(STRESS_MODEL_DIR / "rf_model.pkl")
            self.stress_mean = np.load(STRESS_MODEL_DIR / "baseline_mean.npy")
            self.stress_std = np.load(STRESS_MODEL_DIR / "baseline_std.npy")
            
            with open(STRESS_MODEL_DIR / "feature_contract.json") as f:
                contract = json.load(f)
                self.stress_features = contract['features']
            
            self.stress_loaded = True
            print("✓ Stress model loaded")
        except Exception as e:
            print(f"⚠ Stress model failed to load: {e}")
        
        try:
            self.earnings_model = joblib.load(EARNINGS_MODEL_DIR / "rf_model.pkl")
            self.earnings_loaded = True
            print("✓ Earnings model loaded")
        except Exception as e:
            print(f"⚠ Earnings model failed to load: {e}")
    
    def predict_stress(self, feature_dict: dict) -> dict:
        """
        Predict stress situation from sensor features.
        """
        if not self.stress_loaded:
            return {
                "situation_id": 0,
                "situation_name": "MODEL_NOT_LOADED",
                "emoji": "⚠️",
                "confidence": 0.0,
                "should_notify": False,
                "inference_ms": 0.0,
            }
        
        t0 = time.perf_counter()
        
        situations = {
            0: ('NORMAL', '😊'),
            1: ('TRAFFIC_STOP', '🛑'),
            2: ('SPEED_BREAKER', '🚧'),
            3: ('CONFLICT', '🚨'),
            4: ('ESCALATING', '🚨'),
            5: ('ARGUMENT_ONLY', '⚠️'),
            6: ('MUSIC_OR_CALL', '🎵'),
        }
        
        # Build feature vector in correct order
        X = np.array(
            [feature_dict.get(f, 0.0) for f in self.stress_features],
            dtype=np.float32
        ).reshape(1, -1)
        
        # Normalize
        X_norm = (X - self.stress_mean) / self.stress_std
        
        # Predict
        pred = int(self.stress_model.predict(X_norm)[0])
        proba = self.stress_model.predict_proba(X_norm)[0]
        conf = float(proba[pred])
        
        name, emoji = situations[pred]
        ms = (time.perf_counter() - t0) * 1000
        
        # Low confidence → default to NORMAL (don't false alarm)
        if conf < 0.50:
            pred, conf = 0, conf
            name, emoji = situations[0]
        
        return {
            "situation_id": pred,
            "situation_name": name,
            "emoji": emoji,
            "confidence": round(conf, 3),
            "should_notify": pred in {3, 4, 5} and conf >= 0.50,
            "inference_ms": round(ms, 2),
        }
    
    def predict_earnings(self, feature_dict: dict, daily_goal: float = 1200.0) -> dict:
        """
        Predict future earning velocity and goal completion.
        """
        if not self.earnings_loaded:
            return {
                "predicted_velocity": 0.0,
                "status": "MODEL_NOT_LOADED",
                "estimated_hours_to_goal": 0.0,
                "goal_probability": 0,
            }
        
        t0 = time.perf_counter()
        
        # Build DataFrame
        df = pd.DataFrame({
            'elapsed_hours': [feature_dict['elapsed_hours']],
            'current_velocity': [feature_dict['current_velocity']],
            'velocity_delta': [feature_dict['velocity_delta']],
            'trips_completed': [feature_dict['trips_completed']],
            'trip_rate': [feature_dict['trip_rate']],
            'hour_of_day': [feature_dict['hour_of_day']],
            'is_morning_rush': [feature_dict['is_morning_rush']],
            'is_lunch_rush': [feature_dict['is_lunch_rush']],
            'velocity_last_1': [feature_dict['velocity_last_1']],
            'velocity_last_2': [feature_dict['velocity_last_2']],
            'velocity_last_3': [feature_dict['velocity_last_3']],
            'rolling_velocity_3': [feature_dict['rolling_velocity_3']],
            'rolling_velocity_5': [feature_dict['rolling_velocity_5']],
            'goal_pressure': [feature_dict['goal_pressure']],
        })
        
        # Predict
        pred_velocity = float(self.earnings_model.predict(df)[0])
        
        # Calculate metrics
        elapsed = feature_dict['elapsed_hours']
        current_velocity = feature_dict['current_velocity']
        
        cumulative_earnings = current_velocity * elapsed
        remaining_earnings = max(0, daily_goal - cumulative_earnings)
        remaining_hours = remaining_earnings / pred_velocity if pred_velocity > 0 else 0
        
        required_velocity = daily_goal / (8 - elapsed) if elapsed < 8 else 999
        
        # Determine status
        if pred_velocity >= required_velocity:
            status = "AHEAD"
        elif pred_velocity >= required_velocity * 0.9:
            status = "ON_TRACK"
        else:
            status = "AT_RISK"
        
        goal_prob = int(min(100, (pred_velocity / required_velocity) * 100)) if required_velocity > 0 else 100
        
        ms = (time.perf_counter() - t0) * 1000
        
        return {
            "predicted_velocity": round(pred_velocity, 2),
            "status": status,
            "estimated_hours_to_goal": round(remaining_hours, 2),
            "goal_probability": goal_prob,
            "inference_ms": round(ms, 2),
        }


# Single instance
models = ModelManager()
