"""
DrivePulse Backend — FastAPI application.
Serves trip data, events, metrics, goals, and stress tips.
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from data.sample_data import (
    get_trips, get_profile, get_goals, set_goal_target,
    build_dashboard, build_weekly_metrics, build_monthly_metrics,
    STRESS_TIPS, SITUATIONS,
)
from data.batch_processor import (
    process_stress_csv, process_earnings_csv,
    stress_csv_template, earnings_csv_template,
    predict_stress_row, predict_earnings_row,
)

app = FastAPI(title="DrivePulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Feedback storage (in-memory) ──────────────────────────────────────────

_feedback_store: dict = {}


class FeedbackPayload(BaseModel):
    label: str  # "correct" | "incorrect" | "not_relevant"
    comment: Optional[str] = None


class GoalPayload(BaseModel):
    daily_target: float


# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api/profile")
def profile():
    return get_profile()


# ── Dashboard ─────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def dashboard():
    trips = get_trips()
    goals = get_goals()
    return build_dashboard(trips, goals)


# ── Trips ─────────────────────────────────────────────────────────────────

@app.get("/api/trips")
def list_trips(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    stress: Optional[str] = Query(None, description="high | medium | low | any"),
    earnings_min: Optional[float] = Query(None),
    earnings_max: Optional[float] = Query(None),
    time_of_day: Optional[str] = Query(None, description="morning|afternoon|evening|night"),
    duration_min: Optional[int] = Query(None),
    duration_max: Optional[int] = Query(None),
    preset: Optional[str] = Query(None, description="high_stress|high_earnings|night|short"),
):
    trips = get_trips()

    # Presets
    if preset == "high_stress":
        stress = "high"
    elif preset == "high_earnings":
        earnings_min = 500
    elif preset == "night":
        time_of_day = "night"
    elif preset == "short":
        duration_max = 15

    if date:
        trips = [t for t in trips if t["date"] == date]
    if stress and stress != "any":
        trips = [t for t in trips if t["stress_level"] == stress]
    if earnings_min is not None:
        trips = [t for t in trips if t["fare"] >= earnings_min]
    if earnings_max is not None:
        trips = [t for t in trips if t["fare"] <= earnings_max]
    if duration_min is not None:
        trips = [t for t in trips if t["duration_min"] >= duration_min]
    if duration_max is not None:
        trips = [t for t in trips if t["duration_min"] <= duration_max]
    if time_of_day:
        def _in_tod(t):
            h = datetime.fromisoformat(t["start_time"]).hour
            if time_of_day == "morning":
                return 5 <= h < 12
            elif time_of_day == "afternoon":
                return 12 <= h < 17
            elif time_of_day == "evening":
                return 17 <= h < 21
            elif time_of_day == "night":
                return h >= 21 or h < 5
            return True
        trips = [t for t in trips if _in_tod(t)]

    # Strip heavy data from list view
    lite = []
    for t in trips:
        lite.append({k: v for k, v in t.items() if k not in ("signals", "route", "events")})
        lite[-1]["events_summary"] = [
            {"label": e["label"], "severity": e["severity"]}
            for e in t["events"]
        ]
    return {"trips": lite, "count": len(lite)}


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str):
    trips = get_trips()
    trip = next((t for t in trips if t["id"] == trip_id), None)
    if not trip:
        raise HTTPException(404, "Trip not found")
    # Attach feedback if any
    for ev in trip["events"]:
        ev["feedback"] = _feedback_store.get(ev["id"])
    return trip


@app.get("/api/sample-trip")
def sample_trip():
    """Return a feature-rich sample trip for judges / quick start."""
    trips = get_trips()
    # Pick the trip with the most events
    best = max(trips, key=lambda t: len(t["events"]))
    return best


# ── Events & Feedback ─────────────────────────────────────────────────────

@app.get("/api/trips/{trip_id}/events")
def trip_events(trip_id: str):
    trips = get_trips()
    trip = next((t for t in trips if t["id"] == trip_id), None)
    if not trip:
        raise HTTPException(404, "Trip not found")
    events = trip["events"]
    for ev in events:
        ev["feedback"] = _feedback_store.get(ev["id"])
    return {"trip_id": trip_id, "events": events}


@app.post("/api/events/{event_id}/feedback")
def post_feedback(event_id: str, payload: FeedbackPayload):
    _feedback_store[event_id] = {"label": payload.label, "comment": payload.comment}
    return {"status": "ok", "event_id": event_id, "feedback": _feedback_store[event_id]}


# ── Goals ─────────────────────────────────────────────────────────────────

@app.get("/api/goals")
def goals():
    return get_goals()


@app.post("/api/goals")
def update_goal(payload: GoalPayload):
    return set_goal_target(payload.daily_target)


# ── Metrics / Trends ──────────────────────────────────────────────────────

@app.get("/api/metrics")
def metrics(range: str = Query("7d", description="7d | 30d")):
    if range == "30d":
        return build_monthly_metrics()
    return build_weekly_metrics(get_trips())


# ── Stress Tips ───────────────────────────────────────────────────────────

@app.get("/api/tips")
def tips(severity: Optional[str] = Query(None)):
    import random as _r
    selected = _r.sample(STRESS_TIPS, min(3, len(STRESS_TIPS)))
    return {"tips": selected}


# ── Situations reference ──────────────────────────────────────────────────

@app.get("/api/situations")
def situations():
    return SITUATIONS


# ── Batch CSV Upload ──────────────────────────────────────────────────────

@app.post("/api/batch/stress")
async def batch_stress(file: UploadFile = File(...)):
    """Upload a CSV of sensor windows → get stress predictions for all rows."""
    content = (await file.read()).decode("utf-8")
    if not content.strip():
        raise HTTPException(400, "Empty file")
    result = process_stress_csv(content)
    if "error" in result and result["error"]:
        raise HTTPException(400, result["error"])
    return result


@app.post("/api/batch/earnings")
async def batch_earnings(file: UploadFile = File(...)):
    """Upload a CSV of trip/earnings data → get velocity predictions for all rows."""
    content = (await file.read()).decode("utf-8")
    if not content.strip():
        raise HTTPException(400, "Empty file")
    result = process_earnings_csv(content)
    if "error" in result and result["error"]:
        raise HTTPException(400, result["error"])
    return result


@app.get("/api/batch/template/stress", response_class=PlainTextResponse)
def stress_template():
    """Download a CSV template for stress batch upload."""
    return PlainTextResponse(
        content=stress_csv_template(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stress_template.csv"},
    )


@app.get("/api/batch/template/earnings", response_class=PlainTextResponse)
def earnings_template():
    """Download a CSV template for earnings batch upload."""
    return PlainTextResponse(
        content=earnings_csv_template(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=earnings_template.csv"},
    )


# ── Single-row manual prediction ──────────────────────────────────────────

@app.post("/api/predict/stress")
def predict_stress(payload: dict):
    """Submit a single row of sensor features → get stress prediction."""
    try:
        result = predict_stress_row(payload)
        return result
    except Exception as e:
        raise HTTPException(400, str(e))


@app.post("/api/predict/earnings")
def predict_earnings(payload: dict):
    """Submit a single row of earnings features → get velocity prediction."""
    try:
        result = predict_earnings_row(payload)
        return result
    except Exception as e:
        raise HTTPException(400, str(e))


@app.get("/api/features/stress")
def stress_features():
    """Return the list of stress model input features with defaults."""
    features = [
        {"name": "motion_max", "label": "Motion Max (g)", "default": 1.5, "group": "Motion"},
        {"name": "motion_mean", "label": "Motion Mean (g)", "default": 0.8, "group": "Motion"},
        {"name": "motion_p95", "label": "Motion P95 (g)", "default": 1.2, "group": "Motion"},
        {"name": "motion_std", "label": "Motion Std (g)", "default": 0.3, "group": "Motion"},
        {"name": "brake_intensity", "label": "Brake Intensity", "default": 0.5, "group": "Motion"},
        {"name": "lateral_max", "label": "Lateral Max (g)", "default": 0.8, "group": "Motion"},
        {"name": "z_dev_max", "label": "Z Deviation Max", "default": 0.5, "group": "Motion"},
        {"name": "speed_mean", "label": "Speed Mean (km/h)", "default": 30.0, "group": "Speed"},
        {"name": "speed_at_brake", "label": "Speed at Brake (km/h)", "default": 25.0, "group": "Speed"},
        {"name": "speed_drop", "label": "Speed Drop (km/h)", "default": 5.0, "group": "Speed"},
        {"name": "spikes_above3", "label": "Spikes > 3g", "default": 0, "group": "Motion"},
        {"name": "spikes_above5", "label": "Spikes > 5g", "default": 0, "group": "Motion"},
        {"name": "audio_db_max", "label": "Audio dB Max", "default": 65.0, "group": "Audio"},
        {"name": "audio_db_mean", "label": "Audio dB Mean", "default": 55.0, "group": "Audio"},
        {"name": "audio_db_p90", "label": "Audio dB P90", "default": 62.0, "group": "Audio"},
        {"name": "audio_db_std", "label": "Audio dB Std", "default": 5.0, "group": "Audio"},
        {"name": "audio_class_max", "label": "Audio Class Max", "default": 2.0, "group": "Audio"},
        {"name": "audio_class_mean", "label": "Audio Class Mean", "default": 1.0, "group": "Audio"},
        {"name": "sustained_max", "label": "Sustained Max", "default": 10.0, "group": "Audio"},
        {"name": "sustained_sum", "label": "Sustained Sum", "default": 50.0, "group": "Audio"},
        {"name": "cadence_var_mean", "label": "Cadence Var Mean", "default": 0.3, "group": "Voice"},
        {"name": "cadence_var_max", "label": "Cadence Var Max", "default": 0.6, "group": "Voice"},
        {"name": "argument_frac", "label": "Argument Fraction", "default": 0.0, "group": "Voice"},
        {"name": "loud_frac", "label": "Loud Fraction", "default": 0.1, "group": "Voice"},
        {"name": "audio_leads_motion", "label": "Audio Leads Motion (s)", "default": 0.0, "group": "Timing"},
        {"name": "audio_onset_sec", "label": "Audio Onset (s)", "default": 15.0, "group": "Timing"},
        {"name": "brake_t_sec", "label": "Brake Time (s)", "default": 15.0, "group": "Timing"},
        {"name": "is_low_speed", "label": "Is Low Speed (0/1)", "default": 0, "group": "Flags"},
        {"name": "both_elevated", "label": "Both Elevated (0/1)", "default": 0, "group": "Flags"},
        {"name": "audio_only", "label": "Audio Only (0/1)", "default": 0, "group": "Flags"},
    ]
    return {"features": features, "total": len(features)}


@app.get("/api/features/earnings")
def earnings_features():
    """Return the list of earnings model input features with defaults."""
    features = [
        {"name": "avg_earnings_per_hour", "label": "Avg Earnings/hr (₹)", "default": 250.0, "group": "Earnings"},
        {"name": "experience_months", "label": "Experience (months)", "default": 12, "group": "Driver"},
        {"name": "rating", "label": "Rating (1-5)", "default": 4.5, "group": "Driver"},
        {"name": "target_earnings", "label": "Target Earnings (₹)", "default": 2000.0, "group": "Earnings"},
        {"name": "remaining_earnings", "label": "Remaining Earnings (₹)", "default": 1200.0, "group": "Earnings"},
        {"name": "remaining_hours", "label": "Remaining Hours", "default": 5.0, "group": "Time"},
        {"name": "required_velocity", "label": "Required Velocity (₹/hr)", "default": 240.0, "group": "Earnings"},
        {"name": "trips_completed", "label": "Trips Completed", "default": 5, "group": "Trip"},
        {"name": "trip_rate", "label": "Trip Rate (trips/hr)", "default": 2.0, "group": "Trip"},
        {"name": "hour_of_day", "label": "Hour of Day (0-23)", "default": 14, "group": "Time"},
        {"name": "is_morning_rush", "label": "Morning Rush (0/1)", "default": 0, "group": "Time"},
        {"name": "is_lunch_rush", "label": "Lunch Rush (0/1)", "default": 0, "group": "Time"},
        {"name": "is_evening_rush", "label": "Evening Rush (0/1)", "default": 0, "group": "Time"},
        {"name": "current_velocity", "label": "Current Velocity (₹/hr)", "default": 200.0, "group": "Earnings"},
    ]
    return {"features": features, "total": len(features)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
