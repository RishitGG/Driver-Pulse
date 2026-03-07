# DrivePulse — Full-Stack Production Ready

Complete backend + frontend + ML models. Deploy to Railway + Vercel.

## Project Structure

```
driver-pulse/
├── backend/                  # FastAPI server
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── inference.py
│   ├── requirements.txt
│   └── Procfile
│
├── frontend/                 # React app
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│
├── drivepulse_stress_model/  # ML model (stress)
├── earnings/                 # ML model (earnings)
│
└── README.md
```

---

## 🚀 Quick Start (Local Testing)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run server
python main.py
# Or: uvicorn main:app --reload
```

Server runs at **http://localhost:8000**

Access API docs: **http://localhost:8000/docs**

### Frontend Setup

```bash
# 1. Navigate to frontend (new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev
```

App runs at **http://localhost:3000**

---

## 📋 Test the Full Stack Locally

1. **Start backend:**
   ```bash
   cd backend
   venv\Scripts\activate
   python main.py
   ```

2. **Start frontend** (new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

4. **Test workflow:**
   - Click "Register" → Create a driver profile
   - Click "Dashboard" → Test stress detection
   - Click "Earnings Forecast" → See predictions
   - Check database: `backend/driver_pulse.db` (SQLite file)

---

## 🌐 Deploy to Production (Railway + Vercel)

### Backend → Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Create Railway project:**
   ```bash
   cd backend
   railway init
   # Follow prompts
   ```

4. **Add PostgreSQL (optional, for scaling):**
   ```bash
   railway add -d postgres
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get backend URL:**
   ```bash
   railway vars
   # Note the public URL
   ```

### Frontend → Vercel

1. **Build first:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy with Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set environment variable in Vercel:**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://your-railway-backend.railway.app/api`

4. **Done!** App is live at `your-vercel-domain.vercel.app`

---

## 📊 API Endpoints

All endpoints are at `http://localhost:8000/api` (local) or your deployed URL.

### Users
- `POST /users` — Register driver
- `GET /users/{driver_id}` — Get profile

### Trips
- `POST /trips/{driver_id}` — Log trip
- `GET /trips/{driver_id}` — Get trip history

### Predictions
- `POST /predict/stress` — Predict stress (input: sensors)
- `POST /predict/earnings` — Predict earnings (input: driving state)

### Health
- `GET /health` — Check API status
- `GET /docs` — Interactive API docs (Swagger UI)

---

## 🛠 Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./driver_pulse.db     # Local
# DATABASE_URL=postgresql://user:pass@...    # Production
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000/api   # Local
# REACT_APP_API_URL=https://backend.railway.app/api  # Production
```

---

## 📦 What's Included

✅ **Backend:**
- FastAPI REST API
- SQLite (local) / PostgreSQL (production)
- SQLAlchemy ORM
- Integrated ML inference
- CORS enabled

✅ **Frontend:**
- React 18 + Vite (fast builds)
- Simple black/white UI
- Register driver
- View dashboard
- Run stress/earnings predictions
- View trip history

✅ **ML Models:**
- Stress detection (7-class classifier)
- Earnings forecasting (regression)
- Both pre-trained and ready to use

---

## 🚨 Troubleshooting

**Backend won't start:**
- Make sure venv is activated
- Check: `pip install -r requirements.txt`
- Check models exist: `drivepulse_stress_model/model/rf_model.pkl`

**Frontend can't connect to backend:**
- Backend must be running on http://localhost:8000
- Check CORS is enabled in `backend/main.py`
- Check `frontend/.env` has correct `REACT_APP_API_URL`

**Database errors:**
- Delete `backend/driver_pulse.db` and restart
- Backend will auto-create fresh database

**ML models not found:**
- Run train scripts in each folder:
  - `cd drivepulse_stress_model && python run.py`
  - `cd earnings/earnings && python run.py`

---

## 📝 Next Steps

- [ ] Test locally (backend + frontend)
- [ ] Push to GitHub
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Test production URLs
- [ ] Add more features (auth, advanced UI, etc.)

---

## 📞 Support

Check the original Streamlit prototype: `app.py`

API docs: http://localhost:8000/docs (when running locally)
