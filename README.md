# AI Interview Coach

A local full-stack interview practice app. The frontend is Next.js and the API is FastAPI, with Groq (`llama-3.3-70b-versatile`) powering the interviewer and assessment.

## Setup

### Backend

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Add your GROQ_API_KEY to .env
uvicorn app.main:app --reload --port 8000
```

### Frontend (in a second terminal)

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. API docs are at http://localhost:8000/docs and the health check is at http://localhost:8000/health.

