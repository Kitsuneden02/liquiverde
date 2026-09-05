import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.api import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("liquiverde.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa la base de datos y los datos semilla al arrancar la aplicación."""
    logger.info("Initializing LiquiVerde database and seeds...")
    init_db()
    logger.info("LiquiVerde application startup complete.")
    yield
    logger.info("LiquiVerde application shutting down...")

app = FastAPI(
    title="LiquiVerde API",
    description="Plataforma de retail inteligente para optimización de compras sostenibles, impacto ambiental y ahorro económico.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración de CORS para permitir peticiones desde Vite / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión del router principal bajo /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Salud y Estado"])
def root():
    return {
        "app": "LiquiVerde API",
        "status": "healthy",
        "version": settings.VERSION,
        "docs": "/docs",
        "description": "API REST para optimización de canastas de compra, análisis de sostenibilidad y tiendas ecológicas."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
