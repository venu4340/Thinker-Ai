from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.init_db import init_db
from app.ai.providers.provider_manager import provider_manager
from app.api import auth, projects, ai_planning, tasks, risks, decisions, documents, versions, templates, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logging
    setup_logging()
    logger.info("Initializing ThinkFlow AI database and seed data...")
    await init_db()
    logger.info("ThinkFlow AI Backend started successfully!")
    yield
    logger.info("Shutting down ThinkFlow AI Backend...")

app = FastAPI(
    title="ThinkFlow AI API",
    description="AI-Powered Visual Thinking, Planning & Execution Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(projects.router, prefix=api_v1)
app.include_router(ai_planning.router, prefix=api_v1)
app.include_router(tasks.router, prefix=api_v1)
app.include_router(risks.router, prefix=api_v1)
app.include_router(decisions.router, prefix=api_v1)
app.include_router(documents.router, prefix=api_v1)
app.include_router(versions.router, prefix=api_v1)
app.include_router(templates.router, prefix=api_v1)
app.include_router(chat.router, prefix=api_v1)

# Direct aliases
app.include_router(chat.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "ThinkFlow AI",
        "status": "operational",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/ai/health")
@app.get("/api/v1/ai/health")
async def ai_health():
    """Return Gemini AI health status."""
    return await provider_manager.get_health()
