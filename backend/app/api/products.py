from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.product import ProductOut
from app.services.product_service import ProductService

router = APIRouter()

@router.get("", response_model=List[ProductOut], summary="Listar y filtrar productos")
def get_products(
    q: Optional[str] = Query(None, description="Búsqueda por nombre, marca o descripción"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    eco_score: Optional[str] = Query(None, description="Filtrar por grado eco-score (a, b, c, d, e)"),
    max_price: Optional[float] = Query(None, description="Precio tope en CLP"),
    organic: bool = Query(False, description="Solo productos orgánicos certificados"),
    fair_trade: bool = Query(False, description="Solo productos de comercio justo / cooperativas"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retorna el listado de productos aplicando filtros combinados y paginación.
    """
    return ProductService.get_products(
        db=db,
        query=q,
        category=category,
        eco_score=eco_score,
        max_price=max_price,
        only_organic=organic,
        only_fair_trade=fair_trade,
        skip=skip,
        limit=limit
    )

@router.get("/categories", response_model=List[str], summary="Listar categorías disponibles")
def get_categories(db: Session = Depends(get_db)):
    """Retorna todas las categorías existentes en el catálogo."""
    return ProductService.get_categories(db)

@router.get("/barcode/{barcode}", response_model=ProductOut, summary="Escaneo / Búsqueda por código de barras")
async def get_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):
    """
    Escanea o busca un producto por código de barras EAN-13.
    Si no se encuentra localmente, consulta en tiempo real a Open Food Facts.
    """
    product = await ProductService.get_by_barcode(db, barcode)
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Producto con código de barras '{barcode}' no encontrado en LiquiVerde ni en Open Food Facts."
        )
    return product

@router.get("/{product_id}", response_model=ProductOut, summary="Detalle de producto por ID")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene el detalle completo y métricas de impacto de un producto específico."""
    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return product
