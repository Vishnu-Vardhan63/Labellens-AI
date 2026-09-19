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

# connect_args is SQLite-specific; remove for PostgreSQL
_connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    echo=(settings.environment == "development"),
)

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

