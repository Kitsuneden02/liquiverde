from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product
from app.schemas.optimizer import KnapsackRequest, KnapsackResponse
from app.algorithms.knapsack import optimize_shopping_list, optimize_basket_with_substitutes

router = APIRouter()

@router.post("/knapsack", response_model=KnapsackResponse, summary="Optimizar lista de compras con algoritmo de mochila multi-objetivo")
def optimize_knapsack(
    req: KnapsackRequest,
    db: Session = Depends(get_db)
):
    """
    Optimiza una canasta de compras sujeta a una restricción presupuestaria estricta (budget en CLP),
    balanceando entre Ahorro Económico (slider hacia 0.0) y Sostenibilidad Ecológica (slider hacia 1.0).
    
    Si se entregan product_ids (optimización sobre canasta del usuario), evalúa alternativas
    de sustitución para cada producto seleccionado con el algoritmo Multiple-Choice Knapsack.
    """
    if req.product_ids and len(req.product_ids) > 0:
        basket_products = db.query(Product).filter(Product.id.in_(req.product_ids)).all()
        if not basket_products:
            raise HTTPException(status_code=400, detail="Ninguno de los IDs de producto solicitados existe.")

        all_products = db.query(Product).all()

        result = optimize_basket_with_substitutes(
            basket_products=basket_products,
            all_products=all_products,
            budget=req.budget,
            sustainability_weight=req.sustainability_weight,
            mandatory_product_ids=req.mandatory_product_ids
        )
    else:
        # Evalúa todo el catálogo disponible
        candidates = db.query(Product).all()
        result = optimize_shopping_list(
            available_products=candidates,
            budget=req.budget,
            sustainability_weight=req.sustainability_weight,
            mandatory_product_ids=req.mandatory_product_ids
        )

    return result
