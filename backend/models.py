"""
Database models (SQLAlchemy) and API schemas (Pydantic).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional, List
from database import Base


# ─── DATABASE MODELS (SQLAlchemy) ────────────────────────

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(String, unique=True, index=True)
    name = Column(String)
    phone = Column(String, unique=True, index=True)
    daily_goal = Column(Float, default=1200.0)  # ₹
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trips = relationship("TripDB", back_populates="user")
    predictions = relationship("PredictionDB", back_populates="user")


class TripDB(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    trip_date = Column(String)  # YYYY-MM-DD
    elapsed_hours = Column(Float)
    earnings = Column(Float)  # ₹
    trips_completed = Column(Integer)
    stress_situation = Column(String, nullable=True)  # NORMAL, CONFLICT, etc.
    stress_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserDB", back_populates="trips")


class PredictionDB(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    
    # Stress prediction
    stress_input = Column(JSON)  # Raw sensor data
    stress_output = Column(JSON)  # {situation, confidence, should_notify}
    
    # Earnings prediction
    earnings_input = Column(JSON)  # Current state
    earnings_output = Column(JSON)  # {predicted_velocity, status}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserDB", back_populates="predictions")


# ─── PYDANTIC SCHEMAS (API Request/Response) ────────────

class UserCreate(BaseModel):
    driver_id: str
    name: str
    phone: str
    daily_goal: float = 1200.0


class UserResponse(BaseModel):
    id: int
    driver_id: str
    name: str
    phone: str
    daily_goal: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class TripCreate(BaseModel):
    trip_date: str
    elapsed_hours: float
    earnings: float
    trips_completed: int


class TripResponse(BaseModel):
    id: int
    user_id: int
    trip_date: str
    elapsed_hours: float
    earnings: float
    trips_completed: int
    stress_situation: Optional[str]
    stress_confidence: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class StressPredictRequest(BaseModel):
    motion_max: float
    motion_mean: float
    motion_p95: float
    motion_std: float
    brake_intensity: float
    lateral_max: float
    z_dev_max: float
    speed_mean: float
    speed_at_brake: float
    speed_drop: float
    spikes_above3: int
    spikes_above5: int
    audio_db_max: float
    audio_db_mean: float
    audio_db_p90: float
    audio_db_std: float
    audio_class_max: int
    audio_class_mean: float
    sustained_max: int
    sustained_sum: int
    cadence_var_mean: float
    cadence_var_max: float
    argument_frac: float
    loud_frac: float
    audio_leads_motion: float
    audio_onset_sec: float
    brake_t_sec: float
    is_low_speed: int
    both_elevated: int
    audio_only: int


class StressPredictResponse(BaseModel):
    situation_id: int
    situation_name: str
    emoji: str
    confidence: float
    should_notify: bool
    inference_ms: float


class EarningsPredictRequest(BaseModel):
    elapsed_hours: float
    current_velocity: float
    velocity_delta: float
    trips_completed: int
    trip_rate: float
    hour_of_day: int
    is_morning_rush: int
    is_lunch_rush: int
    velocity_last_1: float
    velocity_last_2: float
    velocity_last_3: float
    rolling_velocity_3: float
    rolling_velocity_5: float
    goal_pressure: float


class EarningsPredictResponse(BaseModel):
    predicted_velocity: float
    status: str  # AHEAD, ON_TRACK, AT_RISK
    estimated_hours_to_goal: float
    goal_probability: int
