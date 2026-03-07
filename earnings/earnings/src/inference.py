import pandas as pd
import joblib
from src.features import create_features

def run_inference():

    model = joblib.load("model/rf_model.pkl")

    velocity = pd.read_csv("data/earnings_velocity_log.csv")
    drivers = pd.read_csv("data/drivers.csv")
    goals = pd.read_csv("data/driver_goals.csv")
    trips = pd.read_csv("data/trips.csv")

    data = velocity.merge(drivers, on="driver_id", how="left")
    data = data.merge(goals, on=["driver_id","date"], how="left")
    data = data.merge(trips, on=["driver_id","date"], how="left")

    data["current_velocity"] = data["current_velocity"].clip(0,600)

    data = create_features(data)

    features = [
        "elapsed_hours",
        "current_velocity",
        "velocity_delta",
        "trips_completed",
        "trip_rate",
        "hour_of_day",
        "is_morning_rush",
        "is_lunch_rush",
        "velocity_last_1",
        "velocity_last_2",
        "velocity_last_3",
        "rolling_velocity_3",
        "rolling_velocity_5",
        "goal_pressure"
    ]

    X = data[features]

    data["predicted_velocity"] = model.predict(X)

    data.to_csv("outputs/earnings_predictions.csv", index=False)

    print("predictions saved")