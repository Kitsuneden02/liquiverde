# API package
from fastapi import APIRouter
from app.api.products import router as products_router
from app.api.optimize import router as optimize_router
from app.api.substitute import router as substitute_router
from app.api.stores import router as stores_router
from app.api.impact import router as impact_router

api_router = APIRouter()
api_router.include_router(products_router, prefix="/products", tags=["Productos & Escáner"])
api_router.include_router(optimize_router, prefix="/optimize", tags=["Optimizador de Mochila"])
api_router.include_router(substitute_router, prefix="/substitutes", tags=["Sustitución Inteligente"])
api_router.include_router(stores_router, prefix="/stores", tags=["Tiendas & Geolocalización"])
api_router.include_router(impact_router, prefix="/impact", tags=["Dashboard de Impacto"])
