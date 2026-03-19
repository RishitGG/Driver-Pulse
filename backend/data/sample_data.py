"""
DrivePulse Backend — Sample data generator.
Produces realistic trips, events, signals, and driver metrics.
"""

import random
import math
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

random.seed(42)

# Canonical "today" used across demo endpoints.
# (The frontend defaults to this date as well.)
TODAY = datetime(2026, 3, 8)
TODAY_STR = TODAY.strftime("%Y-%m-%d")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SITUATIONS = {
    0: {"name": "NORMAL", "emoji": "✅", "severity": "low"},
    1: {"name": "TRAFFIC_STOP", "emoji": "🚦", "severity": "low"},
    2: {"name": "SPEED_BREAKER", "emoji": "⚠️", "severity": "medium"},
    3: {"name": "CONFLICT", "emoji": "😠", "severity": "high"},
    4: {"name": "ESCALATING", "emoji": "🔴", "severity": "high"},
    5: {"name": "ARGUMENT_ONLY", "emoji": "🗣️", "severity": "medium"},
    6: {"name": "MUSIC_OR_CALL", "emoji": "🎵", "severity": "low"},
}

STRESS_TIPS = [
    {"id": 1, "title": "Deep Breathing", "text": "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Helps reduce cortisol instantly.", "cta": "Try now"},
    {"id": 2, "title": "Pull Over Briefly", "text": "If safe, stop for 2 minutes. A short pause resets your stress response.", "cta": "Find safe spot"},
    {"id": 3, "title": "Adjust Temperature", "text": "Lower the AC by 2°. Cooler air helps reduce tension and improve alertness.", "cta": "Got it"},
    {"id": 4, "title": "Play Calming Audio", "text": "Switch to lo-fi or nature sounds. Reduces heart rate within 3 minutes.", "cta": "Open music"},
    {"id": 5, "title": "Stretch at Next Stop", "text": "Roll your shoulders and stretch your neck at the next red light or stop.", "cta": "Remind me"},
    {"id": 6, "title": "Hydrate", "text": "Dehydration increases stress hormones. Take a sip of water.", "cta": "Thanks"},
    {"id": 7, "title": "Positive Self-Talk", "text": "Remind yourself: 'This moment will pass. I'm doing well today.'", "cta": "Noted"},
    {"id": 8, "title": "Micro-break", "text": "After this trip, take a 5-minute walk. It clears mental fatigue.", "cta": "Schedule break"},
]

# Bangalore area coordinates for route generation
BANGALORE_CENTER = (12.9716, 77.5946)
ROUTE_ANCHORS = [
    [(12.9716, 77.5946), (12.9780, 77.6050), (12.9850, 77.6150), (12.9900, 77.6200)],
    [(12.9350, 77.6140), (12.9400, 77.6050), (12.9500, 77.5970), (12.9600, 77.5900)],
    [(12.9600, 77.5700), (12.9550, 77.5800), (12.9500, 77.5900), (12.9450, 77.6000)],
    [(12.9800, 77.5500), (12.9750, 77.5600), (12.9700, 77.5750), (12.9716, 77.5946)],
    [(12.9200, 77.6200), (12.9300, 77.6100), (12.9400, 77.5950), (12.9500, 77.5850)],
    [(12.9900, 77.5800), (12.9850, 77.5900), (12.9800, 77.6000), (12.9750, 77.6100)],
]


def _interp_route(anchors: list, n_points: int = 60) -> list:
    """Interpolate between anchor points to create a smooth route."""
    route = []
    segs = len(anchors) - 1
    pts_per_seg = max(n_points // segs, 2)
    for i in range(segs):
        for j in range(pts_per_seg):
            t = j / pts_per_seg
            lat = anchors[i][0] + t * (anchors[i + 1][0] - anchors[i][0]) + random.gauss(0, 0.0002)
            lng = anchors[i][1] + t * (anchors[i + 1][1] - anchors[i][1]) + random.gauss(0, 0.0002)
            route.append([round(lat, 6), round(lng, 6)])
    route.append(list(anchors[-1]))
    return route


def _gen_signals(duration_min: int, events: list) -> Dict[str, list]:
    """Generate time-series signals: speed, accel_magnitude, audio_db."""
    n = duration_min * 6  # one sample every 10s
    ts = list(range(0, duration_min * 60, 10))
    speed = []
    accel = []
    audio = []

    base_speed = random.uniform(20, 45)
    for i in range(n):
        t_sec = ts[i] if i < len(ts) else i * 10
        # Base speed with traffic variation
        s = base_speed + 10 * math.sin(2 * math.pi * i / n) + random.gauss(0, 3)
        a = abs(random.gauss(1.0, 0.3))
        d = random.gauss(55, 5)

        # Inject spikes near events
        for ev in events:
            ev_sec = ev["offset_sec"]
            if abs(t_sec - ev_sec) < 30:
                proximity = 1 - abs(t_sec - ev_sec) / 30
                if ev["label"] in ("CONFLICT", "ESCALATING", "ARGUMENT_ONLY"):
                    d += 20 * proximity
                    a += 1.5 * proximity
                elif ev["label"] == "SPEED_BREAKER":
                    a += 3 * proximity
                    s = max(5, s - 15 * proximity)
                elif ev["label"] == "TRAFFIC_STOP":
                    s = max(0, s - s * proximity)

        speed.append(round(max(0, s), 1))
        accel.append(round(max(0, a), 2))
        audio.append(round(max(30, min(100, d)), 1))

    return {"timestamps": ts[:n], "speed": speed, "accel_magnitude": accel, "audio_db": audio}


def _gen_events(duration_min: int, stress_level: str) -> list:
    """Generate random events for a trip based on stress level."""
    if stress_level == "low":
        n_events = random.randint(0, 2)
        pool = [0, 1, 6]
    elif stress_level == "medium":
        n_events = random.randint(2, 4)
        pool = [0, 1, 2, 5, 6]
    else:
        n_events = random.randint(3, 6)
        pool = [1, 2, 3, 4, 5]

    events = []
    used_offsets = set()
    for _ in range(n_events):
        sit_id = random.choice(pool)
        sit = SITUATIONS[sit_id]
        offset = random.randint(60, (duration_min - 1) * 60)
        while any(abs(offset - u) < 30 for u in used_offsets):
            offset = random.randint(60, (duration_min - 1) * 60)
        used_offsets.add(offset)

        confidence = round(random.uniform(0.55, 0.98), 2)
        conf_level = "high" if confidence > 0.85 else ("medium" if confidence > 0.65 else "low")

        # Feature contributions (SHAP-like)
        all_contribs = [
            {"feature": "accel_magnitude", "direction": "↑", "contribution": round(random.uniform(0.05, 0.35), 3)},
            {"feature": "audio_db_max", "direction": "↑", "contribution": round(random.uniform(0.03, 0.30), 3)},
            {"feature": "speed_drop", "direction": "↑", "contribution": round(random.uniform(0.02, 0.25), 3)},
            {"feature": "brake_intensity", "direction": "↑", "contribution": round(random.uniform(0.01, 0.20), 3)},
            {"feature": "lateral_max", "direction": "↑", "contribution": round(random.uniform(0.01, 0.15), 3)},
            {"feature": "sustained_max", "direction": "↑" if sit_id in (3, 4, 5) else "→", "contribution": round(random.uniform(0.01, 0.18), 3)},
            {"feature": "cadence_var_mean", "direction": "↑" if sit_id in (3, 4) else "→", "contribution": round(random.uniform(0.005, 0.10), 3)},
        ]
        all_contribs.sort(key=lambda x: x["contribution"], reverse=True)
        top3 = all_contribs[:3]

        model_inputs = {
            "motion_max": round(random.uniform(1, 8), 2),
            "audio_db_max": round(random.uniform(50, 95), 1),
            "speed_mean": round(random.uniform(5, 50), 1),
            "brake_intensity": round(random.uniform(0, 5), 2),
            "lateral_max": round(random.uniform(0.2, 3), 2),
        }

        events.append({
            "id": str(uuid.uuid4())[:8],
            "offset_sec": offset,
            "timestamp": None,  # filled later
            "label": sit["name"],
            "emoji": sit["emoji"],
            "severity": sit["severity"],
            "situation_id": sit_id,
            "confidence": confidence,
            "confidence_level": conf_level,
            "explain": {
                "model_inputs": model_inputs,
                "top_features": top3,
                "summary": f"Detected {sit['name'].lower().replace('_', ' ')} — primary driver: {top3[0]['feature']} {top3[0]['direction']}"
            },
            "feedback": None,
        })

    events.sort(key=lambda e: e["offset_sec"])
    return events


def _gen_trip(trip_idx: int, day: datetime, hour: int) -> Dict[str, Any]:
    """Generate a single trip."""
    stress_options = ["low", "low", "medium", "medium", "high"]
    stress_level = random.choice(stress_options)

    duration_min = random.randint(12, 55)
    start_time = day.replace(hour=hour, minute=random.randint(0, 59), second=0)
    end_time = start_time + timedelta(minutes=duration_min)

    route_anchors = random.choice(ROUTE_ANCHORS)
    route = _interp_route(route_anchors, n_points=max(30, duration_min))

    distance_km = round(random.uniform(3, 25), 1)
    base_fare = 30 + distance_km * 12 + duration_min * 2
    surge = round(random.choice([1.0, 1.0, 1.0, 1.2, 1.5, 1.8, 2.0]), 1)
    fare = round(base_fare * surge, 0)

    events = _gen_events(duration_min, stress_level)
    stress_score = 0
    for ev in events:
        w = {"low": 1, "medium": 3, "high": 5}.get(ev["severity"], 1)
        stress_score += w * ev["confidence"]
    stress_score = round(min(10, stress_score), 1)

    # Fill event timestamps
    for ev in events:
        ev["timestamp"] = (start_time + timedelta(seconds=ev["offset_sec"])).isoformat()

    signals = _gen_signals(duration_min, events)

    # Place event markers on route
    for ev in events:
        frac = ev["offset_sec"] / (duration_min * 60)
        idx = min(int(frac * len(route)), len(route) - 1)
        ev["location"] = route[idx]

    trip_id = f"trip-{trip_idx:03d}"
    return {
        "id": trip_id,
        "date": day.strftime("%Y-%m-%d"),
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_min": duration_min,
        "distance_km": distance_km,
        "fare": fare,
        "surge_multiplier": surge,
        "stress_score": stress_score,
        "stress_level": stress_level,
        "events_count": len(events),
        "events": events,
        "route": route,
        "pickup": route[0],
        "dropoff": route[-1],
        "signals": signals,
    }


# ---------------------------------------------------------------------------
# Public generators
# ---------------------------------------------------------------------------

def generate_trips(today: datetime = None) -> List[Dict]:
    """Generate ~8-10 trips for today and ~8-10 for yesterday."""
    if today is None:
        today = datetime(2026, 3, 8)
    yesterday = today - timedelta(days=1)

    trips = []
    idx = 1

    for day, label in [(today, "today"), (yesterday, "yesterday")]:
        n_trips = random.randint(7, 10)
        hours = sorted(random.sample(range(6, 23), n_trips))
        for h in hours:
            trips.append(_gen_trip(idx, day, h))
            idx += 1

    return trips


def generate_driver_profile() -> Dict:
    return {
        "id": "driver-001",
        "name": "Alex Kumar",
        "city": "Mumbai",
        "rating": 4.82,
        "experience_months": 18,
        "avg_hours_per_day": 10,
        "avg_earnings_per_hour": 185,
        "shift_preference": "morning",
    }


def generate_goals() -> Dict:
    return {
        "daily_target": 1800,
        "current_earnings": 1230,
        "target_hours": 10,
        "current_hours": 6.5,
        "trips_completed": 8,
        "forecast_status": "on_track",
        "goal_probability": 0.78,
        "required_velocity": 220,
        "current_velocity": 189,
    }


def build_dashboard(trips: List[Dict], goals: Dict) -> Dict:
    """Build dashboard summary from trips and goals."""
    today_trips = [t for t in trips if t["date"] == TODAY_STR]

    total_earnings = sum(t["fare"] for t in today_trips)
    total_hours = round(sum(t["duration_min"] for t in today_trips) / 60, 1)
    stress_events = sum(1 for t in today_trips for e in t["events"] if e["severity"] in ("medium", "high"))
    high_stress_count = sum(1 for t in today_trips for e in t["events"] if e["severity"] == "high")
    pct_target = round(min(100, (total_earnings / goals["daily_target"]) * 100), 1) if goals["daily_target"] else 0

    return {
        "date": TODAY_STR,
        "total_trips": len(today_trips),
        "total_hours": total_hours,
        "total_earnings": total_earnings,
        "stress_events": stress_events,
        "high_stress_events": high_stress_count,
        "pct_target_achieved": pct_target,
        "avg_stress_score": round(sum(t["stress_score"] for t in today_trips) / max(len(today_trips), 1), 1),
        "earnings_velocity": goals["current_velocity"],
    }


def build_weekly_metrics(trips: List[Dict]) -> Dict:
    """Build aggregated metrics for trends page."""
    today = TODAY
    days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_label = day.strftime("%a")
        day_trips = [t for t in trips if t["date"] == day_str]

        # For days without data, simulate
        if not day_trips:
            n = random.randint(5, 10)
            earnings = round(random.uniform(1200, 2200), 0)
            hours = round(random.uniform(6, 11), 1)
            stress = round(random.uniform(2, 6), 1)
            stress_events = random.randint(2, 8)
        else:
            n = len(day_trips)
            earnings = sum(t["fare"] for t in day_trips)
            hours = round(sum(t["duration_min"] for t in day_trips) / 60, 1)
            stress = round(sum(t["stress_score"] for t in day_trips) / n, 1)
            stress_events = sum(1 for t in day_trips for e in t["events"] if e["severity"] in ("medium", "high"))

        days.append({
            "date": day_str,
            "day": day_label,
            "trips": n,
            "earnings": earnings,
            "hours": hours,
            "avg_stress": stress,
            "stress_events": stress_events,
            "velocity": round(earnings / max(hours, 1), 0),
        })

    return {
        "range": "7d",
        "days": days,
        "summary": {
            "avg_daily_earnings": round(sum(d["earnings"] for d in days) / 7, 0),
            "avg_daily_trips": round(sum(d["trips"] for d in days) / 7, 1),
            "avg_stress": round(sum(d["avg_stress"] for d in days) / 7, 1),
            "total_earnings": sum(d["earnings"] for d in days),
            "total_trips": sum(d["trips"] for d in days),
            "best_day": max(days, key=lambda d: d["earnings"])["day"],
        },
    }


def build_monthly_metrics() -> Dict:
    """Build 30-day metric trend."""
    today = TODAY
    days = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        n = random.randint(5, 12)
        earnings = round(random.uniform(1000, 2500), 0)
        hours = round(random.uniform(5, 12), 1)
        days.append({
            "date": day.strftime("%Y-%m-%d"),
            "day": day.strftime("%d %b"),
            "trips": n,
            "earnings": earnings,
            "hours": hours,
            "avg_stress": round(random.uniform(1.5, 7), 1),
            "stress_events": random.randint(0, 10),
            "velocity": round(earnings / max(hours, 1), 0),
        })
    return {
        "range": "30d",
        "days": days,
        "summary": {
            "avg_daily_earnings": round(sum(d["earnings"] for d in days) / 30, 0),
            "avg_daily_trips": round(sum(d["trips"] for d in days) / 30, 1),
            "avg_stress": round(sum(d["avg_stress"] for d in days) / 30, 1),
            "total_earnings": sum(d["earnings"] for d in days),
            "total_trips": sum(d["trips"] for d in days),
        },
    }


# ---------------------------------------------------------------------------
# Singleton data store
# ---------------------------------------------------------------------------

_TRIPS = None
_PROFILE = None
_GOALS = None


def get_trips():
    global _TRIPS
    if _TRIPS is None:
        _TRIPS = generate_trips()
    return _TRIPS


def create_user_trip(
    *,
    date: str,
    start_time_iso: str,
    end_time_iso: str,
    duration_min: int,
    distance_km: float,
    fare: float,
    stress_score: float = 0.0,
):
    """Create a minimal, UI-compatible trip for manual entry/import flows."""
    # Keep detail page working by providing empty events + synthetic route/signals.
    events = []
    route_anchors = ROUTE_ANCHORS[0]
    route = _interp_route(route_anchors, n_points=max(30, duration_min))
    signals = _gen_signals(duration_min, events)

    stress_score = float(stress_score or 0.0)
    # Derive stress_level for existing UI (dots/filters).
    if stress_score <= 3:
        stress_level = "low"
    elif stress_score <= 6:
        stress_level = "medium"
    else:
        stress_level = "high"

    return {
        "id": f"user-{str(uuid.uuid4())[:8]}",
        "date": date,
        "start_time": start_time_iso,
        "end_time": end_time_iso,
        "duration_min": int(duration_min),
        "distance_km": float(distance_km),
        "fare": float(fare),
        "surge_multiplier": 1.0,
        "stress_score": round(min(10.0, max(0.0, stress_score)), 1),
        "stress_level": stress_level,
        "events_count": 0,
        "events": events,
        "route": route,
        "pickup": route[0] if route else None,
        "dropoff": route[-1] if route else None,
        "signals": signals,
    }


def add_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    trips = get_trips()
    trips.insert(0, trip)
    return trip


def get_profile():
    global _PROFILE
    if _PROFILE is None:
        _PROFILE = generate_driver_profile()
    return _PROFILE


def get_goals():
    global _GOALS
    if _GOALS is None:
        _GOALS = generate_goals()
    
    # We use the existing goals object which contains the saved 'daily_target'
    goals = _GOALS
    trips = get_trips()
    
    # Always calculate "Today's" actuals from the trip list
    today_trips = [t for t in trips if t.get("date") == TODAY_STR]
    current_earnings = round(sum(float(t.get("fare", 0) or 0) for t in today_trips), 2)
    current_hours = round(sum(float(t.get("duration_min", 0) or 0) for t in today_trips) / 60, 2)
    
    goals["current_earnings"] = current_earnings
    goals["current_hours"] = current_hours
    goals["trips_completed"] = len(today_trips)
    goals["current_velocity"] = round(current_earnings / current_hours, 0) if current_hours > 0 else 0

    # This handles the "Remaining" and "Ahead/Behind" logic automatically
    _recompute_goal_derivatives(goals)
    
    _GOALS = goals
    return goals


def set_goal_target(target: float):
    global _GOALS
    goals = get_goals()
    goals["daily_target"] = float(target)

    _recompute_goal_derivatives(goals)

    _GOALS = goals
    return _GOALS


def _recompute_goal_derivatives(goals: Dict[str, Any]) -> None:
    """
    Keep all goal-derived fields (remaining earnings/hours, required velocity,
    probability and forecast status) in one place so they stay consistent
    between get_goals() and set_goal_target().
    """
    remaining_earnings = max(0, float(goals.get("daily_target") or 0) - float(goals.get("current_earnings") or 0))
    remaining_hours = max(0.1, float(goals.get("target_hours") or 0) - float(goals.get("current_hours") or 0))
    goals["required_velocity"] = round(remaining_earnings / remaining_hours, 0) if goals.get("daily_target") else 0
    goals["remaining_earnings"] = round(remaining_earnings, 2)
    goals["remaining_hours"] = round(
        max(0.0, float(goals.get("target_hours") or 0) - float(goals.get("current_hours") or 0)),
        2,
    )
    current_velocity = float(goals.get("current_velocity") or 0)
    goals["hours_to_target"] = round(remaining_earnings / current_velocity, 2) if current_velocity > 0 else None

    velocity_ratio = goals["current_velocity"] / max(goals["required_velocity"], 1)
    time_ratio = goals["current_hours"] / max(goals["target_hours"], 0.1)

    if velocity_ratio >= 1.2:
        prob = 0.95
    elif velocity_ratio >= 1.0:
        prob = 0.75
    elif velocity_ratio >= 0.8:
        prob = 0.55
    else:
        prob = 0.25

    if time_ratio > 0.8:
        prob *= 0.8

    goals["goal_probability"] = round(min(0.99, max(0.01, prob)), 2)

    if goals["current_velocity"] >= goals["required_velocity"] * 1.1:
        goals["forecast_status"] = "ahead"
    elif goals["current_velocity"] >= goals["required_velocity"] * 0.9:
        goals["forecast_status"] = "on_track"
    else:
        goals["forecast_status"] = "at_risk"


def get_driver_preferences():
    """Returns the driver's personal favorites and habits."""
    return {
        "food_preferences": ["McDonald's", "Starbucks", "Chai Point"],
        "break_habits": "Prefers 15-min breaks after 4 hours of driving",
        "favorite_zones": ["Indiranagar", "Koramangala"]
    }

def get_market_insights():
    """Returns real-time high-surge zones and hot spots."""
    return {
        "high_surge_zones": [
            {"name": "Kempegowda International Airport", "surge": "2.5x", "demand": "Critical"},
            {"name": "Whitefield", "surge": "1.8x", "demand": "High"}
        ],
        "nearby_favorites": [
            {"name": "McDonald's", "distance": "2.1km", "direction": "North-East", "estimated_wait": "5 min"}
        ]
    }


def get_driver_preferences():
    return {
        "food_preferences": ["McDonald's"],
        "favorite_zones": ["Airport", "Indiranagar"]
    }

def get_market_insights():
    return {
        "high_surge_zones": [{"name": "Airport", "surge": "2.5x"}],
        "nearby_favorites": [{"name": "McDonald's", "distance": "2.1km"}]
    }