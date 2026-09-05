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

# Mapeo de familias nutricional y funcionalmente afines
AFFINE_FAMILIES: Dict[str, set] = {
    "carnes_y_proteinas": {"carnes_y_proteinas", "legumbres", "huevos"},
    "legumbres": {"legumbres", "carnes_y_proteinas"},
    "huevos": {"huevos", "carnes_y_proteinas"},
    "bebidas_azucaradas": {"bebidas_azucaradas", "infusiones_y_aguas"},
    "infusiones_y_aguas": {"infusiones_y_aguas"},
    "leche_y_bebidas_vegetales": {"leche_y_bebidas_vegetales"},
}

def infer_product_family(product: Any) -> str:
    """Infiere la familia funcional de un producto a partir de su nombre y categoría si no está explícita."""
    name = (getattr(product, "name", "") or "").lower()
    category = getattr(product, "category", "") or ""
    
    if any(k in name for k in ["detergente", "suavizante", "cloro"]):
        return "detergentes"
    if any(k in name for k in ["lavaloza", "quix", "lavavajilla"]):
        return "lavalozas"
    if any(k in name for k in ["leche", "vilay", "colún", "colun", "soprole", "bebida de avena", "bebida de soya", "bebida de almendra", "bebida vegetal"]):
        return "leche_y_bebidas_vegetales"
    if any(k in name for k in ["queso", "cheese"]):
        return "quesos"
    if any(k in name for k in ["huevo", "huevos", "egg"]):
        return "huevos"
    if any(k in name for k in ["carne", "vacuno", "molida", "hamburguesa", "pollo", "pescado", "jurel", "atún", "atun"]):
        return "carnes_y_proteinas"
    if any(k in name for k in ["lenteja", "garbanzo", "poroto", "tofu", "legumbre"]):
        return "legumbres"
    if any(k in name for k in ["aceite", "oliva"]):
        return "aceites"
    if any(k in name for k in ["salsa", "pomarola", "tuco", "pesto"]):
        return "salsas"
    if any(k in name for k in ["nutella", "maní", "mani", "mantequilla de man", "untable", "avellana"]):
        return "untables"
    if any(k in name for k in ["galleta", "cookie", "frutigran", "biscuit", "cracker"]):
        return "galletas"
    if any(k in name for k in ["pan ", "pan de", "masa madre", "molde", "tostada"]):
        return "panes"
    if any(k in name for k in ["arroz", "quinoa", "quínoa"]):
        return "arroces_y_granos"
    if any(k in name for k in ["pasta", "spaghetti", "fideo", "tallarín", "tallarin"]):
        return "pastas"
    if any(k in name for k in ["cereal", "avena", "chocapic", "quaker"]):
        return "cereales_desayuno"
    if any(k in name for k in ["semilla", "chía", "chia", "linaza"]):
        return "semillas"
    if any(k in name for k in ["infusión", "infusion", "té", "te", "agua", "café", "cafe"]):
        return "infusiones_y_aguas"
    if any(k in name for k in ["coca-cola", "powerade", "gatorade", "cola", "fanta", "sprite", "néctar", "nectar"]):
        return "bebidas_azucaradas"
    if category == "frutas_y_verduras":
        if any(k in name for k in ["manzana", "arándano", "arandano", "fruta", "plátano", "platano", "naranja"]):
            return "frutas"
        return "verduras"
    return category or "otros"


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

    pkg_str = getattr(alt, "packaging_type", "") or ""
    if "reciclable" in pkg_str.lower() or "granel" in pkg_str.lower():
        reasons.append(f"empaque eco-responsable ({pkg_str or 'sostenible'})")

    return " | ".join(reasons)


def are_products_compatible_substitutes(orig: Any, alt: Any) -> bool:
    """
    Determina si dos productos son culinaria y funcionalmente compatibles para sustitución.
    Utiliza el campo explícito product_family y relaciones de afinidad nutricional/culinaria.
    """
    if getattr(orig, "id", None) is not None and getattr(alt, "id", None) is not None:
        if orig.id == alt.id:
            return False

    orig_cat = getattr(orig, "category", "") or ""
    alt_cat = getattr(alt, "category", "") or ""
    if orig_cat and alt_cat and orig_cat != alt_cat:
        return False

    orig_sub_id = getattr(orig, "substitute_id", None)
    # Si tiene enlace directo curado dentro de la misma categoría, respetarlo
    if orig_sub_id is not None and getattr(alt, "id", None) == orig_sub_id:
        return True

    orig_family = getattr(orig, "product_family", None) or infer_product_family(orig)
    alt_family = getattr(alt, "product_family", None) or infer_product_family(alt)

    if orig_family and alt_family:
        if orig_family == alt_family:
            return True
        allowed_affines = AFFINE_FAMILIES.get(orig_family, set())
        if alt_family in allowed_affines:
            return True
        return False

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

        is_direct_substitute = (getattr(original_product, "substitute_id", None) == getattr(alt, "id", None))

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
