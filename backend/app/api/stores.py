from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Store
from app.schemas.store import StoreOut

router = APIRouter()

@router.get("", response_model=List[StoreOut], summary="Listar tiendas sostenibles y cooperativas")
def get_stores(
    store_type: Optional[str] = Query(None, description="Filtrar por tipo (cooperativa, zero_waste_dispenser, feria_agroecologica, etc.)"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Calificación ecológica mínima"),
    db: Session = Depends(get_db)
):
    """
    Retorna los puntos de venta físicos sostenibles, granel y cooperativas con sus coordenadas geográficas
    para representación cartográfica en OpenStreetMap.
    """
    q = db.query(Store)
    if store_type:
        q = q.filter(Store.store_type == store_type)
    if min_rating is not None:
        q = q.filter(Store.rating_eco >= min_rating)

    return q.all()
