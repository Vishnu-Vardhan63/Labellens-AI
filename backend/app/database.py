"""Database setup using SQLAlchemy.

Currently configured for SQLite (development).
To switch to PostgreSQL, change DATABASE_URL in .env to:
  postgresql+asyncpg://user:password@host/dbname
No code changes required — only the URL.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

def _build_engine():
    """Build the SQLAlchemy engine with correct dialect-specific options."""
    url = settings.database_url

    is_pg = "postgresql" in url or "postgres" in url

    if is_pg:
        # Strip any query parameters that psycopg2 cannot handle (e.g. channel_binding)
        # and enforce SSL via connect_args instead — more reliable across hosting platforms.
        base_url = url.split("?")[0]

        connect_args = {
            "sslmode": "require",
        }
        return create_engine(
            base_url,
            connect_args=connect_args,
            pool_pre_ping=True,        # detects stale Neon connections
            pool_size=2,               # keep small — Neon free tier connection limit
            max_overflow=3,
            echo=(settings.environment == "development"),
        )
    else:
        # SQLite (local development)
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=(settings.environment == "development"),
        )

engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """FastAPI dependency: yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all tables. Called on application startup."""
    from sqlalchemy import inspect, text
    from app.models import scan  # noqa: F401 — import registers the model
    Base.metadata.create_all(bind=engine)

    # Lightweight migration helper — adds columns that may be missing in pre-existing databases.
    # Uses dialect-appropriate SQL types so it works on both SQLite and PostgreSQL (Neon).
    is_pg = "postgresql" in settings.database_url or "postgres" in settings.database_url
    datetime_type = "TIMESTAMP WITH TIME ZONE" if is_pg else "DATETIME"

    try:
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("scans")]
        new_cols = [
            ("analysis_status", f"VARCHAR(20) DEFAULT 'pending'"),
            ("raw_ocr_text", "TEXT"),
            ("ocr_results", "JSON"),
            ("extracted_fields", "JSON"),
            ("analysis_error", "TEXT"),
            ("analyzed_at", datetime_type),
            ("compliance_status", f"VARCHAR(30) DEFAULT 'pending'"),
            ("overall_assessment", "VARCHAR(50)"),
            ("compliance_summary", "JSON"),
            ("compliance_results", "JSON"),
            ("validated_at", datetime_type),
            ("inspector_decision", "VARCHAR(50)"),
            ("inspector_notes", "TEXT"),
            ("inspector_reviewed_at", datetime_type),
        ]
        with engine.begin() as conn:
            for col_name, col_type in new_cols:
                if col_name not in columns:
                    conn.execute(text(f"ALTER TABLE scans ADD COLUMN {col_name} {col_type}"))
    except Exception:
        # If table does not exist yet or inspection fails, create_all already took care of it
        pass

