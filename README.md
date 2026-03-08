# 🚗 DrivePulse

Real-time driver wellness & earnings intelligence platform for ride-hailing drivers. Uses on-device sensor data (accelerometer, gyroscope, microphone) with ML models to detect stressful driving situations and forecast earnings velocity.

---

## Features

- **Dashboard** — Daily trips, earnings, stress score, timeline
- **Trip Detail** — Map playback, sensor charts, event detection with explainability
- **Trends** — Weekly/monthly earnings, stress, and velocity charts
- **Goals** — Set and track daily earnings targets
- **Manual Predict** — Enter sensor/earnings values → instant ML prediction
- **Batch Upload** — Upload CSV → run inference on multiple trips at once
- **Explainability** — Per-event feature contributions, confidence badges
- **Feedback** — Thumbs up/down on detected events

---

## Architecture

```
Driver-Pulse/
├── backend/                  # FastAPI server
│   ├── main.py               # API endpoints
│   └── data/                 # Sample data + batch inference
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── pages/            # Dashboard, Trips, TripDetail, Trends, Goals, Predict, BatchUpload
│       └── components/       # Sidebar, TripMap, SignalCharts, ExplainModal, etc.
├── drivepulse_stress_model/  # Stress ML pipeline
├── earnings/                 # Earnings ML pipeline
└── requirements.txt
```

---

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

### Install & Run

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend (http://localhost:8000)
cd backend && python main.py

# In a new terminal — start frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Leaflet |
| Backend | FastAPI, Uvicorn |
| ML | scikit-learn, NumPy, Pandas |
