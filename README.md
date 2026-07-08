# CivicLink AI — Smart City Municipal Coordinator

CivicLink AI is a production-ready, full-stack smart-city application connecting **Citizens**, **Social Workers (Field Technicians)**, **Regional Managers**, and **Super Administrators** to report, analyze, manage, and resolve civic complaints in real-time.

By combining the **Google Gemini 3.5 Flash model** with spatial and atmospheric parameters (interactive coordinates tracking & live local weather indices), the platform streamlines municipal issue routing, severity categorization, and resolution roadmaps.

---

## 🚀 Architectural Blueprint

The application features a decoupled architecture allowing for rapid local execution and standard cloud deployments on platforms like Render or Docker.

### 1. Unified Sandbox Execution (Active Live Preview)
To ensure immediate, zero-config usability inside sandboxed test environments, the core project runs a full-stack **React (Vite) + Node.js (Express)** setup on Port 3000. It features a persistent local JSON Database (`database.json`) that saves all user logins, reports, assignments, chat logs, and settings dynamically.

### 2. Ready-To-Clone Python FastAPI Backend
For native production deployments, a fully complete and validated Python backend is supplied under the `/backend/` and `/database/` directories:
* **Framework**: FastAPI (Pydantic schemas + async operations)
* **ORM**: SQLAlchemy (mapping relational schema models)
* **Database**: PostgreSQL
* **Migration engine**: Alembic config included
* **Authentication**: JWT Authorization with Role-Based Access Control (RBAC)

---

## 📂 Project Structure

```
├── backend/                  # Python FastAPI Backend
│   ├── Dockerfile            # Production multi-stage Dockerfile
│   ├── auth.py               # JWT Encryption & Password hashing
│   ├── database.py           # SQLAlchemy Connection pooling
│   ├── main.py               # REST API Router
│   ├── models.py             # SQLAlchemy Relational Models
│   ├── schemas.py            # Pydantic validation schemas
│   └── requirements.txt      # Python runtime dependencies
├── database/                 # Relational Database SQL Scripts
│   ├── schema.sql            # Master PostgreSQL schema definition
│   └── seed_data.sql         # Seed scripts with demo credentials & reports
├── docker-compose.yml        # Orchestration for local development
├── render.yaml               # Render Cloud Blueprint for 1-click deployment
├── package.json              # Sandbox scripts and node dependencies
├── server.ts                 # Full-stack Sandbox Express router
├── src/                      # Frontend SPA client-side source code
│   ├── App.tsx               # Main application controller
│   ├── types.ts              # TypeScript application type definitions
│   ├── components/
│   │   ├── InteractiveMap.tsx# SVG Coordinates Tracker & cluster map
│   │   ├── WeatherWidget.tsx # Atmospheric metrics analyzer
│   │   ├── AIPanel.tsx       # Gemini AI Report analyzer
│   │   └── ChatWidget.tsx    # Citizen & Field worker direct sync
│   └── index.css             # Extended design typography (Inter & JetBrains Mono)
```

---

## 🛠️ Installation & Local Setup

### Option A: Local Sandbox Run (Node Express + React)
No database installation or background configuration is required.
1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env` (copy from `.env.example`):
   ```env
   GEMINI_API_KEY="your-gemini-key"
   WEATHER_API_KEY="your-weather-key"
   ```
3. Boot the unified local server:
   ```bash
   npm run dev
   ```
4. Access the interface at `http://localhost:3000`.

### Option B: Local Python Stack Run (FastAPI + PostgreSQL)
1. Boot the PostgreSQL relational database container:
   ```bash
   docker-compose up -d db
   ```
2. Navigate to the backend directory, initialize a virtual environment, and install dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure environment variables in `.env` inside `/backend/`:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/civiclink"
   SECRET_KEY="super-secret-key-for-civiclink-ai-2026"
   GEMINI_API_KEY="your-gemini-key"
   ```
4. Start the FastAPI microservice:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. Navigate to the root directory, start the React dev client pointing to the backend:
   ```bash
   npm install
   npm run dev
   ```

---

## 🔒 Security Best Practices

* **JWT Authorization**: Encrypted tokens containing user roles and expiration claims, safely verified server-side on all state-altering API endpoints.
* **Role-Based Authorization (RBAC)**: Active middleware checks ensuring only authenticated managers or administrators can execute worker dispatches, user suspensions, or data deletion operations.
* **Sensitive API Proxies**: All Google Gemini SDK operations are routed strictly server-side (`server.ts`/`backend/main.py`), completely shielding sensitive API keys from browser inspectors.

---

## 🎯 Production Deployments (Render)

Deploy the entire stack to Render with a single action using the provided standard configuration file `render.yaml`.
1. Link your GitHub repository to **Render**.
2. Render automatically detects `render.yaml` and provisions:
   * A PostgreSQL relational database.
   * A Python web service running FastAPI on Gunicorn/Uvicorn.
   * A static web client hosting the React build files with proxy routing.
