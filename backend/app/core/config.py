import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "LiquiVerde API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/liquiverde.db")
    
    # Data Seeds Path
    DATA_DIR: Path = WORKSPACE_DIR / "data"
    PRODUCTS_SEED_FILE: Path = DATA_DIR / "products_seed.json"
    STORES_SEED_FILE: Path = DATA_DIR / "stores_seed.json"
    
    # Open Food Facts User Agent (required by OFF terms of use)
    OFF_USER_AGENT: str = "LiquiVerde-Chile-App/1.0 (soporte@liquiverde.cl)"
    
    # CORS Origins for Frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80"
    ]

settings = Settings()
