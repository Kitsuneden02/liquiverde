"""
Motor de Recomendaciones de Sustitución Inteligente (LiquiVerde)
==============================================================
Identifica y califica alternativas para un producto dado, optimizando:
  - Reducción de huella de carbono (kg CO2e)
  - Ahorro económico directo (CLP)
  - Conservación de agua virtual (litros)
  - Mejora en score de sostenibilidad y reducción de plásticos
"""

from typing import List, Dict, Any, Optional

def generate_substitution_reason(
    original: Any,
    alt: Any,
    price_diff: float,
    co2_reduction: float,
    water_saved: float
) -> str:
    """Genera una explicación comprensible y persuasiva en lenguaje natural."""
    reasons = []
    if price_diff > 0:
        reasons.append(f"Ahorras ${int(price_diff):,}".replace(",", "."))
    elif price_diff < 0:
        reasons.append(f"Inversión de solo ${int(abs(price_diff)):,} adicionales por mayor calidad y durabilidad".replace(",", "."))
    else:
        reasons.append("Mismo precio")

    if co2_reduction > 0:
        reasons.append(f"reduces {co2_reduction:.2f} kg de CO₂e")

    if water_saved > 100:
        reasons.append(f"conservas {int(water_saved)} L de agua")

    if getattr(alt, "organic", False):
        reasons.append("cultivo 100% orgánico sin pesticidas")

    if getattr(alt, "fair_trade", False):
        reasons.append("apoyas a cooperativas locales de comercio justo")

    if "reciclable" in (getattr(alt, "packaging_type", "") or "").lower() or "granel" in (getattr(alt, "packaging_type", "") or "").lower():
        reasons.append(f"empaque eco-responsable ({alt.packaging_type})")

    return " | ".join(reasons)


def find_substitutes_for_product(
    original_product: Any,
    candidate_products: List[Any],
    max_results: int = 3
) -> List[Dict[str, Any]]:
    """
    Evalúa todos los candidatos de la misma categoría (o con enlace directo) y los ordena
    según la mejora combinada en sostenibilidad y ahorro económico.
    """
    recommendations = []
    orig_price = float(original_product.price)
    orig_co2 = float(original_product.co2_kg)
    orig_water = float(original_product.water_liters)
    orig_score = float(original_product.sustainability_score)

    for alt in candidate_products:
        if alt.id == original_product.id:
            continue

        # Debe ser de la misma categoría o ser el sustituto explícito asignado
        is_direct_substitute = (original_product.substitute_id == alt.id)
        same_category = (alt.category == original_product.category)

        if not (is_direct_substitute or same_category):
            continue

        alt_price = float(alt.price)
        alt_co2 = float(alt.co2_kg)
        alt_water = float(alt.water_liters)
        alt_score = float(alt.sustainability_score)

        price_diff = orig_price - alt_price           # Positivo = Ahorro
        co2_reduction = orig_co2 - alt_co2            # Positivo = Menos emisiones
        water_saved = orig_water - alt_water          # Positivo = Menos consumo de agua
        score_gain = alt_score - orig_score           # Positivo = Más ecológico

        # Un candidato es viable si mejora la sostenibilidad O si ahorra dinero sin empeorar drásticamente la sostenibilidad
        if score_gain > 5.0 or (price_diff > 0 and score_gain >= -5.0) or is_direct_substitute:
            # Score de sustitución compuesto
            # Normalizamos ganancia de score (0-100 -> 0-1) y beneficio de precio relativo
            norm_score_gain = score_gain / 100.0
            norm_price_gain = (price_diff / orig_price) if orig_price > 0 else 0.0

            # Ponderación 60% ganancia ecológica, 40% ahorro financiero
            sub_index = (0.60 * norm_score_gain) + (0.40 * norm_price_gain)
            if is_direct_substitute:
                sub_index += 0.5  # Prioridad alta al sustituto curado manualmente

            reason = generate_substitution_reason(
                original=original_product,
                alt=alt,
                price_diff=price_diff,
                co2_reduction=co2_reduction,
                water_saved=water_saved
            )

            recommendations.append({
                "sub_index": sub_index,
                "original_product": original_product,
                "recommended_product": alt,
                "price_difference_clp": round(price_diff, 2),
                "co2_reduction_kg": round(co2_reduction, 2),
                "water_saved_liters": round(water_saved, 1),
                "sustainability_gain": round(score_gain, 1),
                "recommendation_reason": reason
            })

    # Ordenar por índice de recomendación descendente
    recommendations.sort(key=lambda x: x["sub_index"], reverse=True)

    # Limpiar el campo interno sub_index antes de retornar
    result = []
    for r in recommendations[:max_results]:
        del r["sub_index"]
        result.append(r)

    return result
