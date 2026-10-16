# AI Interview Coach

A full-stack interview practice app. The frontend is Next.js and the API is FastAPI, with Groq (`openai/gpt-oss-120b`) powering the interviewer and assessment.

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

## Deployment

### Render backend

Create a Render **Web Service** from this repository using:

- Root Directory: `backend`
- Runtime: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

Set these environment variables:

```text
GROQ_API_KEY=<your Groq API key>
GROQ_MODEL=openai/gpt-oss-120b
FRONTEND_ORIGINS=https://your-vercel-project.vercel.app
```

`FRONTEND_ORIGINS` accepts a comma-separated list when multiple exact frontend origins are needed. Do not include a trailing slash.

### Vercel frontend

Import the same repository into Vercel and use:

- Framework Preset: `Next.js`
- Root Directory: `frontend`
- Build and install settings: defaults

Set this environment variable for Production (and Preview if desired):

```text
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
```

Do not include a trailing slash. Because `NEXT_PUBLIC_API_URL` is embedded during the Next.js build, redeploy the frontend after changing it.

