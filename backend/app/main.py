from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .schemas import AnswerRequest, InterviewReply, Report, ReportRequest, StartRequest
from .services import AIServiceError, InterviewService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    status = "configured" if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here" else "API key missing"
    print(f"\nAI Interview Coach API ready ({status})\n")
    yield


settings = get_settings()
app = FastAPI(title="AI Interview Coach API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    message = first.get("msg", "Please check the information you submitted.")
    return JSONResponse(status_code=422, content={"detail": message})


def service(config: Settings = Depends(get_settings)) -> InterviewService:
    try:
        return InterviewService(config)
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-interview-coach"}


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "ai-interview-coach",
        "message": "AI Interview Coach API is running",
    }


@app.post("/api/interview/start", response_model=InterviewReply)
async def start_interview(payload: StartRequest, ai: InterviewService = Depends(service)):
    try:
        return await ai.start(payload.topic, payload.difficulty.value)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/interview/answer", response_model=InterviewReply)
async def submit_answer(payload: AnswerRequest, ai: InterviewService = Depends(service)):
    if payload.conversation[-1].role != "candidate":
        raise HTTPException(status_code=422, detail="The conversation must end with the candidate's answer.")
    try:
        return await ai.answer(payload.topic, payload.difficulty.value, payload.conversation)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/interview/report", response_model=Report)
async def generate_report(payload: ReportRequest, ai: InterviewService = Depends(service)):
    try:
        return await ai.report(payload.topic, payload.difficulty.value, payload.conversation)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

