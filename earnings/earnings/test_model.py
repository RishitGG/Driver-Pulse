import pandas as pd
import joblib
from datetime import datetime, timedelta

model = joblib.load("model/rf_model.pkl")

test = pd.read_csv("data/test_input.csv")
goals = pd.read_csv("data/driver_goals.csv")

df = test.merge(goals, on="driver_id", how="left")

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

X = df[features]

df["predicted_velocity"] = model.predict(X)

df["cumulative_earnings"] = df["current_velocity"] * df["elapsed_hours"]

df["remaining_earnings"] = (
    df["target_earnings"] - df["cumulative_earnings"]
).clip(lower=0)

df["remaining_hours"] = (
    df["target_hours"] - df["elapsed_hours"]
).clip(lower=0.1)

df["required_velocity"] = (
    df["remaining_earnings"] / df["remaining_hours"]
)

def forecast(row):

    if row["predicted_velocity"] > row["required_velocity"]:
        return "ahead"

    if abs(row["predicted_velocity"] - row["required_velocity"]) < 20:
        return "on_track"

    return "at_risk"

df["forecast_status"] = df.apply(forecast, axis=1)

df["completion_hours_estimate"] = (
    df["remaining_earnings"] / df["predicted_velocity"]
)

df["completion_hours_estimate"] = df["completion_hours_estimate"].fillna(0)

current_time = datetime.now()

df["estimated_finish_time"] = df["completion_hours_estimate"].apply(
    lambda x: current_time + timedelta(hours=float(x))
)

df["goal_probability"] = (
    1
    - abs(df["predicted_velocity"] - df["required_velocity"])
    / df["required_velocity"]
).clip(0,1)

print("\nDRIVER GOAL DASHBOARD\n")

print(
    df[
        [
            "driver_id",
            "target_earnings",
            "cumulative_earnings",
            "remaining_earnings",
            "required_velocity",
            "predicted_velocity",
            "forecast_status",
            "completion_hours_estimate",
            "estimated_finish_time",
            "goal_probability"
        ]
    ]
)

df.to_csv("outputs/test_predictions.csv", index=False)

print("\nSaved to outputs/test_predictions.csv")