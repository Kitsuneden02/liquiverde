from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product

router = APIRouter()

@router.get("/summary", summary="Resumen consolidado de impacto ambiental y económico")
def get_impact_summary(db: Session = Depends(get_db)):
    """
    Retorna indicadores clave de impacto (KPIs) calculados sobre el catálogo de retail:
    - CO2 promedio por categoría vs alternativas verdes
    - Estimación de ahorro mensual por familia al adoptar sustitutos sostenibles
    - Árboles equivalentes plantados y litros de agua conservados
    """
    products = db.query(Product).all()
    if not products:
        return {
            "total_products": 0,
            "average_sustainability_score": 0,
            "potential_co2_reduction_kg": 0,
            "potential_savings_clp": 0,
            "trees_equivalent": 0,
            "water_saved_liters": 0
        }

    total_products = len(products)
    avg_score = sum(p.sustainability_score for p in products) / total_products

    # Comparación de productos tradicionales vs sus sustitutos recomendados (consulta optimizada por lote)
    co2_saved_total = 0.0
    savings_clp_total = 0.0
    water_saved_total = 0.0
    substitutions_available = 0

    sub_ids = [p.substitute_id for p in products if p.substitute_id]
    subs_map = {}
    if sub_ids:
        subs = db.query(Product).filter(Product.id.in_(sub_ids)).all()
        subs_map = {s.id: s for s in subs}

    for p in products:
        if p.substitute_id and p.substitute_id in subs_map:
            sub = subs_map[p.substitute_id]
            co2_delta = max(0.0, float(p.co2_kg) - float(sub.co2_kg))
            price_delta = max(0.0, float(p.price) - float(sub.price))
            water_delta = max(0.0, float(p.water_liters) - float(sub.water_liters))

            co2_saved_total += co2_delta
            savings_clp_total += price_delta
            water_saved_total += water_delta
            substitutions_available += 1


    # Conversión científica estándar: 1 árbol maduro absorbe ~22 kg de CO2 al año
    trees_equivalent = round(co2_saved_total / 22.0, 2) if co2_saved_total > 0 else 0.0

    return {
        "total_catalog_products": total_products,
        "substitutions_available": substitutions_available,
        "average_catalog_sustainability": round(avg_score, 1),
        "potential_basket_co2_savings_kg": round(co2_saved_total, 2),
        "potential_basket_savings_clp": round(savings_clp_total, 0),
        "potential_basket_water_savings_l": round(water_saved_total, 1),
        "trees_equivalent_annual": trees_equivalent,
        "projected_yearly_household_savings_clp": round(savings_clp_total * 12, 0),
        "projected_yearly_co2_avoided_kg": round(co2_saved_total * 12, 2)
    }
