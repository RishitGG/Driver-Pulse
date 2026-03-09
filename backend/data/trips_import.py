import csv
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from .sample_data import create_user_trip, add_trip


REQUIRED_COLUMNS = ["date", "start_time", "end_time", "distance_km", "fare"]
OPTIONAL_COLUMNS = ["stress_score"]


def trips_csv_template() -> str:
    header = REQUIRED_COLUMNS + OPTIONAL_COLUMNS
    example_rows = [
        {
            "date": "2026-03-08",
            "start_time": "09:15",
            "end_time": "09:45",
            "distance_km": "8.2",
            "fare": "310",
            "stress_score": "2.5",
        },
        {
            "date": "2026-03-08",
            "start_time": "18:05",
            "end_time": "18:40",
            "distance_km": "11.6",
            "fare": "520",
            "stress_score": "6.3",
        },
    ]
    lines = [",".join(header)]
    for r in example_rows:
        lines.append(",".join(str(r.get(k, "")) for k in header))
    return "\n".join(lines) + "\n"


def _parse_dt(date: str, dt_or_hhmm: str) -> datetime:
    s = (dt_or_hhmm or "").strip()
    if "T" in s:
        return datetime.fromisoformat(s)
    hh, mm = s.split(":")
    return datetime.fromisoformat(f"{date}T{int(hh):02d}:{int(mm):02d}:00")


def import_trips_csv(csv_content: str) -> Dict[str, Any]:
    """
    Parse a Trips CSV and append trips to the in-memory store.
    Returns summary + per-row results (created trip IDs or errors).
    """
    reader = csv.DictReader(csv_content.splitlines())
    if not reader.fieldnames:
        return {"error": "CSV missing header row"}

    missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing:
        return {"error": f"Missing required columns: {', '.join(missing)}"}

    results: List[Dict[str, Any]] = []
    created: List[Dict[str, Any]] = []

    for idx, row in enumerate(reader):
        try:
            date = (row.get("date") or "").strip()
            if not date:
                raise ValueError("date is required")

            start_dt = _parse_dt(date, row.get("start_time"))
            end_dt = _parse_dt(date, row.get("end_time"))
            if end_dt <= start_dt:
                raise ValueError("end_time must be after start_time")

            duration_min = int(round((end_dt - start_dt).total_seconds() / 60))
            if duration_min <= 0:
                raise ValueError("duration must be at least 1 minute")

            distance_km = float(row.get("distance_km"))
            fare = float(row.get("fare"))

            stress_score_raw = (row.get("stress_score") or "").strip()
            if stress_score_raw == "":
                stress_score = 0.0
            else:
                stress_score = float(stress_score_raw)
            if stress_score < 0 or stress_score > 10:
                raise ValueError("stress_score must be between 0 and 10")

            trip = create_user_trip(
                date=date,
                start_time_iso=start_dt.isoformat(),
                end_time_iso=end_dt.isoformat(),
                duration_min=duration_min,
                distance_km=distance_km,
                fare=fare,
                stress_score=stress_score,
            )
            add_trip(trip)
            created.append(trip)
            results.append({"row_index": idx, "status": "created", "trip_id": trip["id"]})
        except Exception as e:
            results.append({"row_index": idx, "status": "error", "error": str(e)})

    return {
        "summary": {
            "total_rows": len(results),
            "created": sum(1 for r in results if r["status"] == "created"),
            "errors": sum(1 for r in results if r["status"] == "error"),
        },
        "results": results,
        "created_trips": created,
    }

