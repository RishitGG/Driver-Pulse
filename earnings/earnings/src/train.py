import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_model():

    df = pd.read_csv("data/training_dataset.csv")

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
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        random_state=42
    )

    model.fit(X_train,y_train)

    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test,preds)
    rmse = mean_squared_error(y_test,preds) ** 0.5
    r2 = r2_score(y_test,preds)

    print("MAE:",mae)
    print("RMSE:",rmse)
    print("R2:",r2)

    joblib.dump(model,"model/rf_model.pkl")

    print("model saved")