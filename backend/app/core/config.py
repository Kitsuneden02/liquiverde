import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent

def _resolve_data_dir() -> Path:
    if os.getenv("DATA_DIR"):
        return Path(os.getenv("DATA_DIR"))
    if (WORKSPACE_DIR / "data").exists():
        return WORKSPACE_DIR / "data"
    if (BASE_DIR / "data").exists():
        return BASE_DIR / "data"
    return Path("/app/data")

class Settings(BaseSettings):
    PROJECT_NAME: str = "LiquiVerde API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # SQLite Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/liquiverde.db"
    
    # Data Seeds Path
    DATA_DIR: Path = _resolve_data_dir()
    PRODUCTS_SEED_FILE: Path = DATA_DIR / "products_seed.json"
    STORES_SEED_FILE: Path = DATA_DIR / "stores_seed.json"
    
    # Open Food Facts User Agent (required by OFF terms of use)
    OFF_USER_AGENT: str = "LiquiVerde-Chile-App/1.0 (soporte@liquiverde.cl)"
    
    # CORS Origins for Frontend (soporta string separado por comas o lista)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

