# DrivePulse — Driver Earnings Forecast Model

## Description
DrivePulse predicts a driver's future earning velocity during a shift and estimates whether the driver will reach their daily earnings goal.  
Using trip activity, earnings history, and shift progress, the system forecasts driver performance and classifies the driver as **Ahead, On Track, or At Risk**.

---

## Setup

Requirements: Python 3.9+

1. Go to the project folder

cd earnings

2. Create a virtual environment

python -m venv venv

Activate it

macOS / Linux
source venv/bin/activate

Windows
venv\Scripts\activate

3. Install dependencies

pip install -r requirements.txt

---

## How to Run

Run the full pipeline

python run.py

This will:
• build the dataset  
• train the model  
• generate predictions  

To test with sample driver scenarios:

python test_model.py

Predictions will be saved in:

outputs/earnings_predictions.csv

---

## Implementation Steps

1. Dataset Construction  
Raw datasets (drivers, trips, goals, velocity logs) are merged to create the training dataset.

2. Feature Engineering  
Important signals are created such as:
• trip rate  
• velocity history  
• rolling velocity averages  
• rush hour indicators  
• goal pressure  

3. Data Augmentation  
Small variations are added to simulate realistic driver behavior.

4. Model Training  
A Random Forest regression model learns to predict **future earning velocity**.

5. Inference  
The trained model forecasts driver performance and goal completion.

---

## Expected Result

Typical training metrics:

MAE ≈ 21  
RMSE ≈ 52  
R² ≈ 0.93  

The system predicts:
• future earning speed  
• goal completion time  
• probability of reaching the goal  

---

## Example Dashboard

Driver: DRV002

Current Velocity:        ₹180/hr  
Predicted Velocity:      ₹279/hr  

Goal:                    ₹1200  
Current Earnings:        ₹540  
Remaining Earnings:      ₹660  

Required Velocity:       ₹210/hr  
Status:                  AHEAD  

Estimated Completion:    2.3 hours  
Goal Probability:        72%

---

## Project Structure

earnings
|
|--- data
|    |--- drivers.csv
|    |--- driver_goals.csv
|    |--- earnings_velocity_log.csv
|    |--- trips.csv
|    |--- training_dataset.csv
|
|--- src
|    |--- build_dataset.py
|    |--- features.py
|    |--- augment.py
|    |--- train.py
|    |--- inference.py
|
|--- model
|    |--- rf_model.pkl
|
|--- outputs
|    |--- earnings_predictions.csv
|
|--- run.py
|--- test_model.py
|--- requirements.txt
|--- README.md

---

## Driver Situations

AHEAD  
Driver is earning faster than the pace needed to reach the goal.

ON_TRACK  
Driver is progressing at approximately the required pace.

AT_RISK  
Driver is unlikely to reach the earnings goal today unless performance improves.