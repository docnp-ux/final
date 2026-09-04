"""
Database — Engine, Session & Table Creation

One engine per process, one session per request.
The session is injected as a dependency via get_session().
"""

from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

settings = get_settings()

# SQLite needs this flag for multi-threaded FastAPI access; Postgres does not.
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def create_db_and_tables():
    """Create all tables. In production, use Alembic migrations instead."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Yield a database session per request."""
    with Session(engine) as session:
        yield session
