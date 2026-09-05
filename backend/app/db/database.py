import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Ensure directory exists for SQLite database file if applicable
if settings.DATABASE_URL.startswith("sqlite:///"):
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_file_path and db_file_path != ":memory:":
        Path(db_file_path).parent.mkdir(parents=True, exist_ok=True)

# For SQLite, connect_args={"check_same_thread": False} is required
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
