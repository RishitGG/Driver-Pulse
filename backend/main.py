"""
DrivePulse Backend API
FastAPI server with stress detection + earnings prediction
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from database import init_db, get_db
from models import (
    UserCreate, UserResponse, TripCreate, TripResponse,
    StressPredictRequest, StressPredictResponse,
    EarningsPredictRequest, EarningsPredictResponse,
    UserDB, TripDB, PredictionDB
)
from inference import models

# Initialize app
app = FastAPI(
    title="DrivePulse API",
    description="Stress detection + earnings forecasting for drivers",
    version="1.0.0"
)

# Enable CORS (allow frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["https://yourdomain.com"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
def startup():
    init_db()
    print("✓ Database initialized")


# ─────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────

@app.post("/api/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new driver profile."""
    # Check if user exists
    existing = db.query(UserDB).filter(UserDB.driver_id == user.driver_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Driver already exists")
    
    # Create user
    db_user = UserDB(
        driver_id=user.driver_id,
        name=user.name,
        phone=user.phone,
        daily_goal=user.daily_goal
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/users/{driver_id}", response_model=UserResponse)
def get_user(driver_id: str, db: Session = Depends(get_db)):
    """Get driver profile."""
    user = db.query(UserDB).filter(UserDB.driver_id == driver_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Driver not found")
    return user


# ─────────────────────────────────────────────────────────
# TRIPS
# ─────────────────────────────────────────────────────────

@app.post("/api/trips/{driver_id}")
def create_trip(driver_id: str, trip: TripCreate, db: Session = Depends(get_db)):
    """Log a new trip for a driver."""
    user = db.query(UserDB).filter(UserDB.driver_id == driver_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db_trip = TripDB(
        user_id=user.id,
        trip_date=trip.trip_date,
        elapsed_hours=trip.elapsed_hours,
        earnings=trip.earnings,
        trips_completed=trip.trips_completed
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return {"message": "Trip logged", "trip_id": db_trip.id, "trip": db_trip}


@app.get("/api/trips/{driver_id}")
def get_trips(driver_id: str, db: Session = Depends(get_db)):
    """Get all trips for a driver."""
    user = db.query(UserDB).filter(UserDB.driver_id == driver_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    trips = db.query(TripDB).filter(TripDB.user_id == user.id).order_by(TripDB.created_at.desc()).all()
    return trips


# ─────────────────────────────────────────────────────────
# PREDICTIONS
# ─────────────────────────────────────────────────────────

@app.post("/api/predict/stress", response_model=StressPredictResponse)
def predict_stress(req: StressPredictRequest):
    """
    Predict driver stress situation from sensor data.
    """
    result = models.predict_stress(req.model_dump())
    return result


@app.post("/api/predict/earnings", response_model=EarningsPredictResponse)
def predict_earnings(
    req: EarningsPredictRequest,
    driver_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Predict driver earning velocity.
    """
    # Get daily goal if driver_id provided
    daily_goal = 1200.0  # default
    if driver_id:
        user = db.query(UserDB).filter(UserDB.driver_id == driver_id).first()
        if user:
            daily_goal = user.daily_goal
    
    result = models.predict_earnings(req.model_dump(), daily_goal)
    return result


# ─────────────────────────────────────────────────────────
# HEALTH & INFO
# ─────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "stress_model_loaded": models.stress_loaded,
        "earnings_model_loaded": models.earnings_loaded,
    }


@app.get("/")
def root():
    """Welcome message."""
    return {
        "name": "DrivePulse API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
