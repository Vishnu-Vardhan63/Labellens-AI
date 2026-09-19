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

# Optional Single-Service SPA Mounting:
# If static frontend build exists (/app/static or frontend/dist), serve static assets and handle SPA routing
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/ directory
ROOT_DIR = BASE_DIR.parent                        # repository root

candidates = [
    BASE_DIR / "static",
    ROOT_DIR / "frontend" / "dist",
    BASE_DIR / "frontend" / "dist",
    Path("/app/static"),
    Path("static"),
]
static_dir = next((p for p in candidates if p.exists() and (p / "index.html").exists()), None)

if static_dir:
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("health", "docs", "redoc", "openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        file_path = static_dir / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        return FileResponse(static_dir / "index.html")


