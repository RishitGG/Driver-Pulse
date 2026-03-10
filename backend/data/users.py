"""
DrivePulse Backend — User authentication and driver profiles.
Manages login, registration, and driver data.
"""

import json
from datetime import datetime
from typing import Optional, Dict

# In-memory user store (in production, use a real database)
_USERS = {
    "alex.kumar": {
        "driver_id": "DRV001",
        "password": "password123",  # In production, use bcrypt
        "name": "Alex Kumar",
        "email": "alex.kumar@example.com",
        "phone": "+91 9876543210",
        "city": "Mumbai",
        "vehicle_type": "Sedan",
        "vehicle_number": "MH01AB1234",
        "shift_preference": "morning",
        "avg_hours_per_day": 7.5,
        "avg_earnings_per_hour": 185,
        "experience_months": 18,
        "rating": 4.8,
        "total_trips": 342,
        "total_earnings": 48000,
    },
    "priya.singh": {
        "driver_id": "DRV002",
        "password": "password123",
        "name": "Priya Singh",
        "email": "priya.singh@example.com",
        "phone": "+91 9876543211",
        "city": "Bangalore",
        "vehicle_type": "SUV",
        "vehicle_number": "KA01CD5678",
        "shift_preference": "evening",
        "avg_hours_per_day": 8.2,
        "avg_earnings_per_hour": 195,
        "experience_months": 24,
        "rating": 4.9,
        "total_trips": 456,
        "total_earnings": 62000,
    },
}


def register_user(username: str, password: str, driver_data: dict) -> Optional[Dict]:
    """Register a new user with driver profile."""
    if username in _USERS:
        return None  # User already exists
    
    user = {
        "driver_id": driver_data.get("driver_id", f"DRV{len(_USERS) + 1000}"),
        "password": password,  # In production, use bcrypt.hashpw()
        "name": driver_data.get("name", ""),
        "email": driver_data.get("email", ""),
        "phone": driver_data.get("phone", ""),
        "city": driver_data.get("city", ""),
        "vehicle_type": driver_data.get("vehicle_type", ""),
        "vehicle_number": driver_data.get("vehicle_number", ""),
        "shift_preference": driver_data.get("shift_preference", "morning"),
        "avg_hours_per_day": driver_data.get("avg_hours_per_day", 7.0),
        "avg_earnings_per_hour": driver_data.get("avg_earnings_per_hour", 180),
        "experience_months": driver_data.get("experience_months", 0),
        "rating": driver_data.get("rating", 4.5),
        "total_trips": driver_data.get("total_trips", 0),
        "total_earnings": driver_data.get("total_earnings", 0),
    }
    
    _USERS[username] = user
    return {
        "driver_id": user["driver_id"],
        "name": user["name"],
        "email": user["email"],
        "city": user["city"],
        "rating": user["rating"],
        "vehicle_type": user["vehicle_type"],
    }


def login_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate a user and return their profile."""
    if username not in _USERS:
        return None
    
    user = _USERS[username]
    
    # Simple password check (in production, use bcrypt.checkpw())
    if user["password"] != password:
        return None
    
    return {
        "driver_id": user["driver_id"],
        "username": username,
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "city": user["city"],
        "vehicle_type": user["vehicle_type"],
        "vehicle_number": user["vehicle_number"],
        "rating": user["rating"],
        "total_trips": user["total_trips"],
        "total_earnings": user["total_earnings"],
        "avg_hours_per_day": user["avg_hours_per_day"],
        "avg_earnings_per_hour": user["avg_earnings_per_hour"],
        "experience_months": user["experience_months"],
        "shift_preference": user["shift_preference"],
    }


def get_user_profile(driver_id: str) -> Optional[Dict]:
    """Get user profile by driver ID."""
    for user in _USERS.values():
        if user["driver_id"] == driver_id:
            return {
                "driver_id": user["driver_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "city": user["city"],
                "vehicle_type": user["vehicle_type"],
                "vehicle_number": user["vehicle_number"],
                "rating": user["rating"],
                "total_trips": user["total_trips"],
                "total_earnings": user["total_earnings"],
                "avg_hours_per_day": user["avg_hours_per_day"],
                "avg_earnings_per_hour": user["avg_earnings_per_hour"],
                "experience_months": user["experience_months"],
                "shift_preference": user["shift_preference"],
            }
    return None


def list_all_users() -> list:
    """List all available users for demo purposes."""
    return [
        {
            "username": username,
            "name": user["name"],
            "city": user["city"],
            "rating": user["rating"],
        }
        for username, user in _USERS.items()
    ]
