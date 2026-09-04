import pytest
from types import SimpleNamespace
from app.algorithms.substitution import find_substitutes_for_product

def test_substitution_finds_better_alternative():
    original = SimpleNamespace(
        id=1,
        name="Leche Tradicional Plástica",
        category="lacteos_y_vegetales",
        price=1290.0,
        co2_kg=2.4,
        water_liters=1050.0,
        sustainability_score=38.5,
        substitute_id=2,
        packaging_type="Plástico No Reciclable",
        organic=False,
        fair_trade=False
    )
    alt1 = SimpleNamespace(
        id=2,
        name="Leche Colún Local Tetra Pak",
        category="lacteos_y_vegetales",
        price=1150.0,
        co2_kg=1.45,
        water_liters=720.0,
        sustainability_score=79.0,
        substitute_id=None,
        packaging_type="Tetra Pak Reciclable FSC",
        organic=False,
        fair_trade=True
    )
    alt2 = SimpleNamespace(
        id=3,
        name="Bebida Avena Eco",
        category="lacteos_y_vegetales",
        price=1490.0,
        co2_kg=0.55,
        water_liters=180.0,
        sustainability_score=92.5,
        substitute_id=None,
        packaging_type="Tetra Brik Bio-based",
        organic=True,
        fair_trade=True
    )
    candidates = [original, alt1, alt2]

    substitutes = find_substitutes_for_product(original, candidates, max_results=2)

    assert len(substitutes) >= 1
    top = substitutes[0]
    # Comprobar que no se recomienda a sí mismo
    assert top["recommended_product"].id != original.id
    # Alt1 es más barata y más ecológica
    assert top["recommended_product"].id == 2
    assert top["price_difference_clp"] == 140.0  # Ahorro de 140 CLP
    assert top["co2_reduction_kg"] > 0.0         # Reducción de CO2
    assert "Ahorras $140" in top["recommendation_reason"]


def test_substitution_no_false_categories():
    original = SimpleNamespace(
        id=1,
        name="Leche",
        category="lacteos_y_vegetales",
        price=1290.0,
        co2_kg=2.4,
        water_liters=1050.0,
        sustainability_score=38.5,
        substitute_id=None
    )
    unrelated = SimpleNamespace(
        id=9,
        name="Detergente",
        category="limpieza_y_hogar",
        price=5000.0,
        co2_kg=1.0,
        water_liters=200.0,
        sustainability_score=95.0,
        substitute_id=None
    )
    substitutes = find_substitutes_for_product(original, [original, unrelated])
    # No debe sugerir un detergente como reemplazo de la leche
    assert len(substitutes) == 0
