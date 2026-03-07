import pandas as pd

def create_features(df):

    df["timestamp"] = pd.to_datetime(df["timestamp"], format="%H:%M:%S", errors="coerce")
    df["hour_of_day"] = df["timestamp"].dt.hour

    df["is_morning_rush"] = df["hour_of_day"].between(7,9).astype(int)
    df["is_lunch_rush"] = df["hour_of_day"].between(12,14).astype(int)

    df["trip_rate"] = df["trips_completed"] / df["elapsed_hours"].replace(0,1)

    df = df.sort_values(["driver_id","timestamp"])

    df["velocity_last_1"] = df.groupby("driver_id")["current_velocity"].shift(1)
    df["velocity_last_2"] = df.groupby("driver_id")["current_velocity"].shift(2)
    df["velocity_last_3"] = df.groupby("driver_id")["current_velocity"].shift(3)

    df["rolling_velocity_3"] = (
        df.groupby("driver_id")["current_velocity"]
        .rolling(3)
        .mean()
        .reset_index(level=0,drop=True)
    )

    df["rolling_velocity_5"] = (
        df.groupby("driver_id")["current_velocity"]
        .rolling(5)
        .mean()
        .reset_index(level=0,drop=True)
    )

    df["goal_pressure"] = df["target_velocity"] - df["current_velocity"]

    df = df.bfill()

    df["target"] = df.groupby("driver_id")["current_velocity"].shift(-1)

    df = df.dropna()

    return df