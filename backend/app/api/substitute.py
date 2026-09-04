from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product
from app.schemas.optimizer import SubstituteRecommendation
from app.algorithms.substitution import find_substitutes_for_product

router = APIRouter()

@router.get("/{product_id}", response_model=List[SubstituteRecommendation], summary="Recomendaciones de sustitución inteligente")
def get_substitutes(
    product_id: int,
    limit: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """
    Identifica alternativas de la misma categoría para un producto específico,
    calculando en tiempo real el ahorro económico ($ CLP), reducción de CO2 y conservación hídrica.
    """
    original = db.query(Product).filter(Product.id == product_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Producto de origen no encontrado.")

    # Candidatos de la misma categoría o catálogo completo
    candidates = db.query(Product).filter(
        (Product.category == original.category) | (Product.id == original.substitute_id)
    ).all()

    recommendations = find_substitutes_for_product(
        original_product=original,
        candidate_products=candidates,
        max_results=limit
    )

    return recommendations
