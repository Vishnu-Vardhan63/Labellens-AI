"""Application configuration loaded from environment variables."""
import os
from functools import lru_cache
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite:///./label_lens.db")
        self.upload_dir: Path = Path(os.getenv("UPLOAD_DIR", "./uploads"))
        self.host: str = os.getenv("HOST", "0.0.0.0")
        self.port: int = int(os.getenv("PORT", "8000"))
        _cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
        self.cors_origins_list: List[str] = [o.strip() for o in _cors.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
