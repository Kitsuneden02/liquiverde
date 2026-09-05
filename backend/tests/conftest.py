import os
import tempfile
from pathlib import Path
import pytest

# Configurar base de datos SQLite temporal aislada antes de importar la app
_temp_dir = tempfile.TemporaryDirectory()
_test_db_path = Path(_temp_dir.name) / "test_liquiverde.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal

@pytest.fixture(scope="session")
def client():
    """
    Cliente de pruebas de FastAPI con context manager para disparar el lifespan (init_db).
    Asegura reproducibilidad en checkout limpio sin depender de backend/liquiverde.db.
    """
    with TestClient(app) as test_client:
        yield test_client
    try:
        _temp_dir.cleanup()
    except Exception:
        pass

@pytest.fixture
def db_session(client):
    """
    Sesión de base de datos para pruebas unitarias directas.
    Depende del fixture client para garantizar que las tablas e init_db estén creados.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
