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


def are_products_compatible_substitutes(orig: Any, alt: Any) -> bool:
    """
    Determina si dos productos son culinaria y funcionalmente compatibles para sustitución.
    Previene sustituciones incoherentes (ej: Aceite por Salsa de Tomate, o Spaghetti por Salsa).
    """
    if orig.id == alt.id:
        return False

    orig_cat = getattr(orig, "category", "")
    alt_cat = getattr(alt, "category", "")
    if orig_cat != alt_cat:
        return False

    orig_sub_id = getattr(orig, "substitute_id", None)
    # Si tiene enlace directo curado dentro de la misma categoría, respetarlo
    if orig_sub_id is not None and orig_sub_id == alt.id:
        return True

    orig_name = (getattr(orig, "name", "") or "").lower()
    alt_name = (getattr(alt, "name", "") or "").lower()

    # 1. Aceites: solo pueden reemplazarse por otros aceites
    if "aceite" in orig_name or "aceite" in alt_name:
        return "aceite" in orig_name and "aceite" in alt_name

    # 2. Salsas de tomate: solo por salsas o purés de tomate
    if "salsa" in orig_name or "tomate" in orig_name or "salsa" in alt_name or "tomate" in alt_name:
        return ("salsa" in orig_name or "tomate" in orig_name) and ("salsa" in alt_name or "tomate" in alt_name)

    # 3. Cremas dulces / Untables (Nutella, Pasta de Maní)
    sweet_spreads = ["nutella", "avellana", "maní", "mani", "mermelada", "cacao"]
    if any(w in orig_name for w in sweet_spreads) or any(w in alt_name for w in sweet_spreads):
        return any(w in orig_name for w in sweet_spreads) and any(w in alt_name for w in sweet_spreads)

    # 4. Pastas y fideos:
    pastas = ["spaghetti", "fideo", "pasta", "tallarín", "tallarin"]
    if any(w in orig_name for w in pastas) or any(w in alt_name for w in pastas):
        return any(w in orig_name for w in pastas) and any(w in alt_name for w in pastas)

    # 5. Arroz y granos:
    rice = ["arroz", "quinoa", "quínoa"]
    if any(w in orig_name for w in rice) or any(w in alt_name for w in rice):
        return any(w in orig_name for w in rice) and any(w in alt_name for w in rice)

    # 6. Cereales de desayuno y Avena:
    cereals = ["cereal", "avena", "chocapic", "quaker"]
    if any(w in orig_name for w in cereals) or any(w in alt_name for w in cereals):
        return any(w in orig_name for w in cereals) and any(w in alt_name for w in cereals)

    # 7. Semillas (Chía, Linaza):
    seeds = ["semilla", "chía", "chia", "linaza"]
    if any(w in orig_name for w in seeds) or any(w in alt_name for w in seeds):
        return any(w in orig_name for w in seeds) and any(w in alt_name for w in seeds)

    # 8. Bebidas:
    healthy_drinks = ["infusión", "infusion", "té", "te", "agua", "cachantun"]
    sugary_drinks = ["coca-cola", "powerade", "fanta", "sprite"]
    if any(w in orig_name for w in healthy_drinks) and any(w in alt_name for w in sugary_drinks):
        return False
    if "coca-cola" in orig_name or "powerade" in orig_name:
        return any(w in alt_name for w in ["infusión", "infusion", "té", "te", "agua", "bebida", "jugo"])

    # 9. Panes:
    if "pan" in orig_name or "pan" in alt_name:
        return "pan" in orig_name and "pan" in alt_name

    # 10. Detergentes / Limpieza:
    if "detergente" in orig_name or "detergente" in alt_name:
        return "detergente" in orig_name and "detergente" in alt_name

    # 11. Lácteos y vegetales:
    dairy = ["leche", "avena", "soya", "almendra", "vegetal"]
    if any(w in orig_name for w in dairy) or any(w in alt_name for w in dairy):
        return any(w in orig_name for w in dairy) and any(w in alt_name for w in dairy)

    # 12. Proteínas (carnes rojas, pollo, legumbres, pescado, tofu):
    proteins = ["carne", "vacuno", "hamburguesa", "lenteja", "garbanzo", "poroto", "jurel", "tofu", "soya"]
    if any(w in orig_name for w in proteins) or any(w in alt_name for w in proteins):
        return any(w in orig_name for w in proteins) and any(w in alt_name for w in proteins)

    return True


def find_substitutes_for_product(
    original_product: Any,
    candidate_products: List[Any],
    max_results: int = 3
) -> List[Dict[str, Any]]:
    """
    Evalúa todos los candidatos y los filtra con compatibilidad semántica y culinaria.
    """
    recommendations = []
    orig_price = float(original_product.price)
    orig_co2 = float(original_product.co2_kg)
    orig_water = float(original_product.water_liters)
    orig_score = float(original_product.sustainability_score)

    for alt in candidate_products:
        if not are_products_compatible_substitutes(original_product, alt):
            continue

        is_direct_substitute = (original_product.substitute_id == alt.id)

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
