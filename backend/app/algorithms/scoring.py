"""
Módulo de Scoring de Sostenibilidad Multicriterio (LiquiVerde)
============================================================
Calcula un índice integral normalizado [0, 100] evaluando tres dimensiones:
1. Dimensión Ambiental (50%): Huella de carbono, reciclabilidad de empaque, certificación eco-score y orgánico.
2. Dimensión Social (30%): Origen local (cooperativas vs. importado transoceánico) y Comercio Justo (Fair Trade).
3. Dimensión Económica (20%): Accesibilidad de precio respecto a la media de la categoría.
"""

from typing import Dict, Any, Optional

ECO_SCORE_MAP = {
    "a": 100.0,
    "b": 80.0,
    "c": 60.0,
    "d": 40.0,
    "e": 20.0
}

from app.core.categories import CATEGORY_CO2_CEILINGS

def calculate_environmental_subscore(
    co2_kg: float,
    packaging_score: float,
    eco_score_grade: Optional[str] = None,
    is_organic: bool = False,
    category: Optional[str] = None
) -> float:
    """
    Calcula el subscore ambiental [0, 100].
    - Menor CO2 -> mayor puntuación.
    - Empaque reciclable/granel -> mayor puntuación.
    - Eco-score oficial (A a E) y certificación orgánica suman valor.
    """
    ceiling = CATEGORY_CO2_CEILINGS.get(category or "", 5.0)
    # Normalización inversa de huella de carbono: si co2_kg = 0 -> 100, si co2_kg >= ceiling -> 0
    co2_ratio = max(0.0, min(1.0, co2_kg / ceiling))
    co2_score = (1.0 - co2_ratio) * 100.0

    # Puntuación de empaque (0 a 100)
    pkg_score = max(0.0, min(100.0, packaging_score))

    # Eco-score oficial (Open Food Facts)
    grade = (eco_score_grade or "c").lower()
    grade_score = ECO_SCORE_MAP.get(grade, 50.0)

    # Base ambiental ponderada
    env_base = (0.45 * co2_score) + (0.35 * pkg_score) + (0.20 * grade_score)

    # Bonus orgánico (+10 puntos)
    if is_organic:
        env_base += 10.0

    return max(0.0, min(100.0, env_base))


def calculate_social_subscore(
    origin_score: float,
    is_fair_trade: bool = False
) -> float:
    """
    Calcula el subscore social [0, 100].
    - Producción local / cooperativa campesina vs importación.
    - Comercio Justo (Fair Trade) certificado.
    """
    soc_base = max(0.0, min(100.0, origin_score))
    if is_fair_trade:
        soc_base += 15.0
    return max(0.0, min(100.0, soc_base))


def calculate_economic_subscore(
    price: float,
    category_avg_price: Optional[float] = None
) -> float:
    """
    Calcula el subscore económico [0, 100].
    - Premia la accesibilidad del precio frente al promedio de su categoría.
    - Un producto más accesible que la media obtiene mayor puntaje.
    """
    if not category_avg_price or category_avg_price <= 0:
        return 70.0  # Puntaje neutro si no hay media de categoría

    ratio = price / category_avg_price
    if ratio <= 0.8:
        return 95.0  # Muy accesible / 20%+ más barato que el promedio
    elif ratio <= 1.0:
        return 80.0  # En el promedio o ligeramente menor
    elif ratio <= 1.25:
        return 65.0  # Ligeramente más costoso (premium razonable)
    else:
        return 45.0  # Significativamente más costoso


def calculate_sustainability_score(
    co2_kg: float,
    packaging_score: float,
    origin_score: float,
    price: float,
    eco_score_grade: Optional[str] = "c",
    is_fair_trade: bool = False,
    is_organic: bool = False,
    category: Optional[str] = None,
    category_avg_price: Optional[float] = None,
    weight_env: float = 0.50,
    weight_soc: float = 0.30,
    weight_eco: float = 0.20
) -> Dict[str, float]:
    """
    Fórmula maestra de scoring ponderado:
    Score = w_env * S_env + w_soc * S_soc + w_eco * S_eco
    
    Retorna un diccionario con el total y el desglose de subscores.
    """
    s_env = calculate_environmental_subscore(
        co2_kg=co2_kg,
        packaging_score=packaging_score,
        eco_score_grade=eco_score_grade,
        is_organic=is_organic,
        category=category
    )
    s_soc = calculate_social_subscore(
        origin_score=origin_score,
        is_fair_trade=is_fair_trade
    )
    s_eco = calculate_economic_subscore(
        price=price,
        category_avg_price=category_avg_price
    )

    total_score = (weight_env * s_env) + (weight_soc * s_soc) + (weight_eco * s_eco)
    clamped_total = round(max(0.0, min(100.0, total_score)), 1)

    return {
        "sustainability_score": clamped_total,
        "environmental_score": round(s_env, 1),
        "social_score": round(s_soc, 1),
        "economic_score": round(s_eco, 1)
    }


def calculate_category_baseline(products_in_category: list) -> Dict[str, float]:
    """Calcula las medias de referencia para una categoría dada."""
    if not products_in_category:
        return {"avg_price": 0.0, "avg_co2": 0.0, "avg_score": 50.0}
    
    total_price = sum(getattr(p, "price", 0.0) for p in products_in_category)
    total_co2 = sum(getattr(p, "co2_kg", 0.0) for p in products_in_category)
    total_score = sum(getattr(p, "sustainability_score", 50.0) for p in products_in_category)
    n = len(products_in_category)

    return {
        "avg_price": round(total_price / n, 2),
        "avg_co2": round(total_co2 / n, 2),
        "avg_score": round(total_score / n, 2)
    }
