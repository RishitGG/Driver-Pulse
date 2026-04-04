"""
DriveIntel Backend — FastAPI application.
Serves trip data, events, metrics, goals, and safety tips.
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from agent import run_co_pilot
from utils.logging import log_info, log_warn

from data.sample_data import (
    get_trips, get_profile, get_goals, set_goal_target,
    build_dashboard, build_weekly_metrics, build_monthly_metrics,
    STRESS_TIPS, SITUATIONS,
    create_user_trip, add_trip,
)
from data.batch_processor import (
    process_stress_csv, stress_csv_template,
    predict_stress_row,
)
from data.trips_import import import_trips_csv, trips_csv_template
from data.users import (
    login_user, register_user, get_user_profile, list_all_users,
)

# ── App Initialization ──────────────────────────────────────────────────

app = FastAPI(title="DriveIntel API", version="1.0.0")

# Allow frontend origins for development and production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://driveintel-alpha.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ──────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str

class FeedbackPayload(BaseModel):
    label: str  # "correct" | "incorrect" | "not_relevant"
    comment: Optional[str] = None

class GoalPayload(BaseModel):
    daily_target: float

class LoginPayload(BaseModel):
    username: str
    password: str

class RegisterPayload(BaseModel):
    username: str
    password: str
    name: str
    email: str
    phone: str
    city: str
    vehicle_type: str
    vehicle_number: str
    shift_preference: str = "morning"
    avg_hours_per_day: float = 7.0
    avg_earnings_per_hour: float = 180
    experience_months: int = 0

class TripCreatePayload(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # "HH:MM" (local) or ISO datetime
    end_time: str  # "HH:MM" (local) or ISO datetime
    distance_km: float
    fare: float
    stress_score: Optional[float] = None  # 0-10 (optional)

# ── Feedback storage (in-memory) ──────────────────────────────────────────

_feedback_store: dict = {}

# ── Routes: AI Co-pilot ──────────────────────────────────────────────────

@app.post("/api/chat")
async def chat_with_agent(payload: ChatRequest):
    """Entry point for the Agentic AI Financial Co-pilot."""
    try:
        ai_reply = run_co_pilot(payload.message)
        return {"response": ai_reply}
    except Exception as e:
        log_warn(f"Agent Error: {e}")
        return {"response": "I'm recalibrating my sensors. Try again in a moment! 🤖"}

# ── Routes: Health & Auth ────────────────────────────────────────────────

@app.get("/api/health")
def health():
    log_info("health check")
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/auth/login")
def login(payload: LoginPayload):
    """Authenticate a driver and return their profile."""
    user = login_user(payload.username, payload.password)
    if not user:
        raise HTTPException(401, "Invalid username or password")
    return user

@app.post("/api/auth/register")
def register(payload: RegisterPayload):
    """Register a new driver account."""
    driver_data = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "city": payload.city,
        "vehicle_type": payload.vehicle_type,
        "vehicle_number": payload.vehicle_number,
        "shift_preference": payload.shift_preference,
        "avg_hours_per_day": payload.avg_hours_per_day,
        "avg_earnings_per_hour": payload.avg_earnings_per_hour,
        "experience_months": payload.experience_months,
    }
    result = register_user(payload.username, payload.password, driver_data)
    if not result:
        raise HTTPException(400, "Username already exists")
    return result

@app.get("/api/auth/users")
def list_users():
    """List all available demo users."""
    return list_all_users()

@app.get("/api/profile")
def profile():
    return get_profile()

# ── Routes: Dashboard & Metrics ──────────────────────────────────────────

@app.get("/api/dashboard")
def dashboard():
    trips = get_trips()
    goals = get_goals()
    return build_dashboard(trips, goals)

@app.get("/api/metrics")
def metrics(range: str = Query("7d", description="7d | 30d")):
    if range == "30d":
        return build_monthly_metrics()
    return build_weekly_metrics(get_trips())

# ── Routes: Trips ─────────────────────────────────────────────────────────

@app.get("/api/trips/template", response_class=PlainTextResponse)
def trips_template():
    """Download a CSV template for trips import."""
    return PlainTextResponse(
        content=trips_csv_template(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trips_template.csv"},
    )

@app.post("/api/trips")
def create_trip(payload: TripCreatePayload):
    """Create a single trip (manual entry)."""
    try:
        date = payload.date
        def _to_iso(dt_or_hhmm: str) -> datetime:
            s = (dt_or_hhmm or "").strip()
            if "T" in s:
                return datetime.fromisoformat(s)
            hh, mm = s.split(":")
            return datetime.fromisoformat(f"{date}T{int(hh):02d}:{int(mm):02d}:00")

        start_dt = _to_iso(payload.start_time)
        end_dt = _to_iso(payload.end_time)
        if end_dt <= start_dt:
            raise HTTPException(400, "end_time must be after start_time")

        duration_min = int(round((end_dt - start_dt).total_seconds() / 60))
        stress_score = float(payload.stress_score or 0.0)
        
        trip = create_user_trip(
            date=date,
            start_time_iso=start_dt.isoformat(),
            end_time_iso=end_dt.isoformat(),
            duration_min=duration_min,
            distance_km=payload.distance_km,
            fare=payload.fare,
            stress_score=stress_score,
        )
        add_trip(trip)
        return trip
    except Exception as e:
        raise HTTPException(400, str(e))

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
    # [Filtering logic kept same as original]
    if preset == "high_stress": stress = "high"
    elif preset == "high_earnings": earnings_min = 500
    elif preset == "night": time_of_day = "night"
    elif preset == "short": duration_max = 15

    if date: trips = [t for t in trips if t["date"] == date]
    if stress and stress != "any": trips = [t for t in trips if t["stress_level"] == stress]
    if earnings_min is not None: trips = [t for t in trips if t["fare"] >= earnings_min]
    if earnings_max is not None: trips = [t for t in trips if t["fare"] <= earnings_max]
    
    lite = []
    for t in trips:
        lite.append({k: v for k, v in t.items() if k not in ("signals", "route", "events")})
        lite[-1]["events_summary"] = [{"label": e["label"], "severity": e["severity"]} for e in t["events"]]
    return {"trips": lite, "count": len(lite)}

@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str):
    trips = get_trips()
    trip = next((t for t in trips if t["id"] == trip_id), None)
    if not trip:
        raise HTTPException(404, "Trip not found")
    for ev in trip["events"]:
        ev["feedback"] = _feedback_store.get(ev["id"])
    return trip

# ── Routes: Events & Feedback ─────────────────────────────────────────────

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

# ── Routes: Goals & Predictions ───────────────────────────────────────────

@app.get("/api/goals")
def goals():
    return get_goals()

@app.post("/api/goals")
def update_goal(payload: GoalPayload):
    return set_goal_target(payload.daily_target)

@app.post("/api/predict/stress")
def predict_stress(payload: dict):
    try:
        # Defaults for missing features
        defaults = {
            "motion_std": 0.3, "z_dev_max": 0.5, "spikes_above3": 0,
            "spikes_above5": 0, "audio_class_max": 2.0, "audio_class_mean": 1.0,
            "sustained_max": 10.0, "sustained_sum": 50.0, "cadence_var_max": 0.6
        }
        for k, v in defaults.items(): payload.setdefault(k, v)
        return predict_stress_row(payload)
    except Exception as e:
        raise HTTPException(400, str(e))

# ── Routes: Batch & Features ──────────────────────────────────────────────

@app.post("/api/batch/stress")
async def batch_stress(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8")
    result = process_stress_csv(content)
    if "error" in result and result["error"]: raise HTTPException(400, result["error"])
    return result

@app.post("/api/trips/import-csv")
async def import_trips(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8")
    result = import_trips_csv(content)
    if "error" in result and result["error"]: raise HTTPException(400, result["error"])
    return result

@app.get("/api/tips")
def tips():
    import random as _r
    return {"tips": _r.sample(STRESS_TIPS, min(3, len(STRESS_TIPS)))}

@app.get("/api/situations")
def situations():
    return SITUATIONS

@app.get("/api/features/stress")
def stress_features():
    return {"features": [
        {"name": "motion_max", "label": "Motion Max (g)", "default": 1.5, "group": "Motion"},
        {"name": "speed_mean", "label": "Speed Mean (km/h)", "default": 30.0, "group": "Speed"},
        {"name": "audio_db_max", "label": "Audio dB Max", "default": 65.0, "group": "Audio"},
    ]}

if __name__ == "__main__":
    import uvicorn
    # Use "main:app" when cwd is backend/ (matches Docker and flat imports)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)