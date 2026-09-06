"""Label Lens AI — FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routes import health, upload, analysis, dashboard

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: create tables on startup."""
    create_tables()
    yield


app = FastAPI(
    title="Label Lens AI API",
    description=(
        "Backend API for the Label Lens AI Smart Packaged Commodity "
        "Compliance Assistant (SIH26034). Production Legal Metrology Compliance, "
        "Explainable Visual Evidence, Eligibility Gate & AI Copilot."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(dashboard.router)
