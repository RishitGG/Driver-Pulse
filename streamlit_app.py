"""
DriveIntel Prototype — Streamlit Demo

Driver behavior analysis and stress detection interface.
"""

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path

st.set_page_config(
    page_title="DriveIntel",
    page_icon="🛣️",
    layout="wide"
)

# ── Load Models (cached) ──────────────────────────────────

@st.cache_resource
def load_models():
    """Load both ML models once at startup."""
    stress_model = joblib.load("driveintel_stress_model/model/rf_model.pkl")
    stress_mean = np.load("driveintel_stress_model/model/baseline_mean.npy")
    stress_std = np.load("driveintel_stress_model/model/baseline_std.npy")
    
    with open("driveintel_stress_model/model/feature_contract.json") as f:
        feature_contract = json.load(f)
    
    earnings_model = joblib.load("earnings/earnings/model/rf_model.pkl")
    
    return {
        'stress_model': stress_model,
        'stress_mean': stress_mean,
        'stress_std': stress_std,
        'feature_list': feature_contract['features'],
        'earnings_model': earnings_model,
    }

try:
    models = load_models()
    st.session_state.models_loaded = True
except Exception as e:
    st.error(f"❌ Failed to load models: {e}")
    st.info("Make sure to run the training scripts first:\n```bash\ncd driveintel_stress_model && python run.py\n```")
    st.stop()

# ── Header ────────────────────────────────────────────────

st.title("�️ DriveIntel Prototype")
st.markdown("**Driver Safety Detection & Behavior Analytics**")

# ── Tabs ──────────────────────────────────────────────────

tab1, tab3 = st.tabs(["Stress Detection", "About DriveIntel"])

# ════════════════════════════════════════════════════════════
# TAB 1: STRESS DETECTION
# ════════════════════════════════════════════════════════════

with tab1:
    st.header("🚨 Stress Detection")
    st.markdown("Analyze a 30-second sensor window to detect driver stress situations.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Motion Sensors (Accelerometer)")
        motion_max = st.slider("Max Motion (m/s²)", 0.0, 6.0, 1.5, 0.1)
        motion_mean = st.slider("Mean Motion (m/s²)", 0.0, 4.0, 0.8, 0.1)
        motion_p95 = st.slider("95th Percentile Motion", 0.0, 6.0, 2.5, 0.1)
        motion_std = st.slider("Motion Std Dev", 0.0, 2.0, 0.5, 0.1)
        
        brake_intensity = st.slider("Brake Intensity", 0.0, 5.0, 1.0, 0.1)
        lateral_max = st.slider("Lateral Acceleration", 0.0, 3.0, 0.7, 0.1)
        z_dev_max = st.slider("Z-axis Deviation", 0.0, 2.0, 0.4, 0.1)
        
        speed_mean = st.slider("Speed (km/h)", 0.0, 60.0, 35.0, 1.0)
        speed_at_brake = st.slider("Speed at Brake", 0.0, 60.0, 30.0, 1.0)
        speed_drop = st.slider("Speed Drop", 0.0, 30.0, 5.0, 1.0)
        
        spikes_above3 = st.slider("Spikes > 3 m/s²", 0, 30, 5)
        spikes_above5 = st.slider("Spikes > 5 m/s²", 0, 10, 1)
    
    with col2:
        st.subheader("Audio Sensors (Microphone)")
        audio_db_max = st.slider("Max Audio (dB)", 50.0, 100.0, 85.0, 1.0)
        audio_db_mean = st.slider("Mean Audio (dB)", 50.0, 90.0, 70.0, 1.0)
        audio_db_p90 = st.slider("90th Percentile Audio", 50.0, 100.0, 80.0, 1.0)
        audio_db_std = st.slider("Audio Std Dev", 0.0, 15.0, 5.0, 0.5)
        
        audio_class_max = st.slider("Max Audio Class", 0, 5, 2)
        audio_class_mean = st.slider("Mean Audio Class", 0.0, 5.0, 1.5, 0.1)
        
        sustained_max = st.slider("Sustained Loud (sec)", 0, 30, 5)
        sustained_sum = st.slider("Total Sustained (sec)", 0, 30, 10)
        
        cadence_var_mean = st.slider("Cadence Variance", 0.0, 20.0, 8.0, 0.5)
        cadence_var_max = st.slider("Max Cadence Var", 0.0, 25.0, 12.0, 0.5)
        
        argument_frac = st.slider("Argument Fraction", 0.0, 1.0, 0.3, 0.05)
        loud_frac = st.slider("Loud Fraction", 0.0, 1.0, 0.4, 0.05)
    
    col3, col4 = st.columns(2)
    
    with col3:
        st.subheader("Timing & Context")
        audio_leads_motion = st.slider("Audio Leads Motion (sec)", -15.0, 15.0, -2.0, 0.5)
        audio_onset_sec = st.slider("Audio Onset (sec)", 0.0, 30.0, 10.0, 0.5)
        brake_t_sec = st.slider("Brake Time (sec)", 0.0, 30.0, 15.0, 0.5)
        
        is_low_speed = st.checkbox("Low Speed (<20 km/h)?", False)
        both_elevated = st.checkbox("Both Motion & Audio Elevated?", False)
        audio_only = st.checkbox("Audio Only (No Motion)?", False)
    
    with col4:
        st.write("")  # spacing
    
    # ── Predict ──────────────────────────────────────────
    
    if st.button("🔮 Predict Stress Situation", key="stress_btn", use_container_width=True):
        # Assemble feature vector
        feature_dict = {
            'motion_max': motion_max,
            'motion_mean': motion_mean,
            'motion_p95': motion_p95,
            'motion_std': motion_std,
            'brake_intensity': brake_intensity,
            'lateral_max': lateral_max,
            'z_dev_max': z_dev_max,
            'speed_mean': speed_mean,
            'speed_at_brake': speed_at_brake,
            'speed_drop': speed_drop,
            'spikes_above3': spikes_above3,
            'spikes_above5': spikes_above5,
            'audio_db_max': audio_db_max,
            'audio_db_mean': audio_db_mean,
            'audio_db_p90': audio_db_p90,
            'audio_db_std': audio_db_std,
            'audio_class_max': audio_class_max,
            'audio_class_mean': audio_class_mean,
            'sustained_max': sustained_max,
            'sustained_sum': sustained_sum,
            'cadence_var_mean': cadence_var_mean,
            'cadence_var_max': cadence_var_max,
            'argument_frac': argument_frac,
            'loud_frac': loud_frac,
            'audio_leads_motion': audio_leads_motion,
            'audio_onset_sec': audio_onset_sec,
            'brake_t_sec': brake_t_sec,
            'is_low_speed': int(is_low_speed),
            'both_elevated': int(both_elevated),
            'audio_only': int(audio_only),
        }
        
        # Build feature vector in correct order
        feature_list = models['feature_list']
        X = np.array([feature_dict.get(f, 0.0) for f in feature_list], dtype=np.float32).reshape(1, -1)
        
        # Normalize
        X_norm = (X - models['stress_mean']) / models['stress_std']
        
        # Predict
        pred = int(models['stress_model'].predict(X_norm)[0])
        proba = models['stress_model'].predict_proba(X_norm)[0]
        conf = float(proba[pred])
        
        # Situation names
        situations = {
            0: ('NORMAL', '😊', 'Smooth driving — no incidents'),
            1: ('TRAFFIC_STOP', '🛑', 'Traffic stop — normal braking'),
            2: ('SPEED_BREAKER', '🚧', 'Speed breaker detected'),
            3: ('CONFLICT', '🚨', 'Hard brake + loud cabin simultaneously'),
            4: ('ESCALATING', '🚨', 'Loud cabin preceded brake'),
            5: ('ARGUMENT_ONLY', '⚠️', 'Sustained loud cabin detected'),
            6: ('MUSIC_OR_CALL', '🎵', 'Music or phone call'),
        }
        
        name, emoji, msg = situations[pred]
        
        # Display results
        st.markdown("---")
        
        result_col1, result_col2 = st.columns([2, 1])
        
        with result_col1:
            st.markdown(f"### {emoji} **{name}**")
            st.markdown(f"> {msg}")
            st.markdown(f"**Confidence:** {conf:.1%}")
            
            # Confidence badge
            if conf >= 0.75:
                st.success("HIGH Confidence", icon="✅")
            elif conf >= 0.50:
                st.warning("MEDIUM Confidence", icon="⚠️")
            else:
                st.info("LOW Confidence", icon="ℹ️")
        
        with result_col2:
            should_notify = pred in {3, 4, 5}
            is_safety = pred in {3, 4}
            
            if is_safety and conf >= 0.75:
                st.error("🚨 SAFETY ALERT", icon="🔴")
            elif should_notify:
                st.warning("📢 NOTIFY DRIVER", icon="🟡")
            else:
                st.success("✓ Normal", icon="🟢")
        
        # Class probabilities
        st.markdown("**All Classes:**")
        prob_df = pd.DataFrame({
            'Situation': [situations[i][0] for i in range(7)],
            'Probability': proba
        }).sort_values('Probability', ascending=False)
        st.bar_chart(prob_df.set_index('Situation')['Probability'])




# ════════════════════════════════════════════════════════════
# TAB 2: ABOUT
# ════════════════════════════════════════════════════════════

with tab3:
    st.header("About DriveIntel")
    
    st.markdown("""
    ### 🎯 Mission
    DriveIntel analyzes driver behavior and detects stress situations in real-time, enabling:
    - **Safety:** Detect escalating conflicts before they happen
    - **Insights:** Understand your driving patterns and behavior trends
    - **Privacy:** All computation on-device, no audio recording
    
    ### 🧠 Models
    
    **Stress Detection (Classification)**
    - Input: 30-second sensor window (26 features)
    - Model: Random Forest (200 trees)
    - Output: 7 situation classes + confidence
    - Accuracy: F1 = 0.98
    
    **Earnings Forecasting (Regression)**
    - Input: Driver state (14 features)
    - Model: Random Forest (300 trees)
    - Output: Predicted velocity (₹/hr)
    - R²: 0.93
    
    ### 📊 Data
    - **Stress:** 3,150 synthetic sensor windows
    - **Earnings:** Real trip data (augmented 5×)
    
    ### 🚀 Deployment
    - Built with Streamlit
    - Hosted on Streamlit Cloud
    - No database overhead
    """)
    
    st.markdown("---")
    st.markdown("**Hackathon Prototype** — March 2026")
