import pandas as pd
from src.features import create_features
from src.augment import augment_data

def build_dataset():

    drivers = pd.read_csv("data/drivers.csv")
    goals = pd.read_csv("data/driver_goals.csv")
    velocity = pd.read_csv("data/earnings_velocity_log.csv")
    trips = pd.read_csv("data/trips.csv")

    data = velocity.merge(drivers, on="driver_id", how="left")
    data = data.merge(goals, on=["driver_id","date"], how="left")
    data = data.merge(trips, on=["driver_id","date"], how="left")
    data["current_velocity"] = data["current_velocity"].clip(0,600)
    data = create_features(data)

    data = augment_data(data)

    data.to_csv("data/training_dataset.csv", index=False)

    print("dataset saved")