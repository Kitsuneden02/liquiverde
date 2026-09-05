import pytest
from types import SimpleNamespace
from app.algorithms.substitution import (
    find_substitutes_for_product,
    are_products_compatible_substitutes
)
from app.db.models import Product

def test_substitution_finds_better_alternative():
    original = SimpleNamespace(
        id=1,
        name="Leche Tradicional Plástica",
        category="lacteos_y_vegetales",
        product_family="leche_y_bebidas_vegetales",
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
        product_family="leche_y_bebidas_vegetales",
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
        product_family="leche_y_bebidas_vegetales",
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
        product_family="leche_y_bebidas_vegetales",
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
        product_family="detergentes",
        price=5000.0,
        co2_kg=1.0,
        water_liters=200.0,
        sustainability_score=95.0,
        substitute_id=None
    )
    substitutes = find_substitutes_for_product(original, [original, unrelated])
    # No debe sugerir un detergente como reemplazo de la leche
    assert len(substitutes) == 0


@pytest.mark.parametrize(
    "orig_id,alt_id,expected_compatible",
    [
        (1, 3, True),    # Leche Soprole -> Bebida de Avena
        (2, 3, True),    # Leche Colún -> Bebida de Avena
        (4, 5, True),    # Carne Molida -> Lentejas
        (4, 14, True),   # Carne Molida -> Jurel
        (4, 32, True),   # Carne Molida -> Huevos
        (17, 18, True),  # Coca-Cola -> Té Supremo
        (11, 20, False), # Aceite Chef -> Salsa Pomarola
        (9, 37, False),  # Detergente Foca -> Lavaloza Quix
        (1, 36, False),  # Leche Soprole -> Queso Ranco Colún
        (23, 34, True),  # Galletas de Soda -> Galletas Frutigran
        (24, 25, True),  # Pan Blanco Ideal -> Pan Masa Madre
    ]
)
def test_substitution_audit_compatibility_table(db_session, orig_id, alt_id, expected_compatible):
    """
    Verifica los 11 pares exactos estipulados en la auditoría 2.4 usando productos reales del seed.
    """
    orig = db_session.query(Product).filter(Product.id == orig_id).first()
    alt = db_session.query(Product).filter(Product.id == alt_id).first()

    assert orig is not None, f"Producto {orig_id} no encontrado en la base de datos"
    assert alt is not None, f"Producto {alt_id} no encontrado en la base de datos"

    is_compatible = are_products_compatible_substitutes(orig, alt)
    assert is_compatible == expected_compatible, (
        f"Compatibilidad esperada entre #{orig_id} ({orig.name} / {orig.product_family}) y "
        f"#{alt_id} ({alt.name} / {alt.product_family}) era {expected_compatible}, pero dio {is_compatible}"
    )


def test_get_substitutes_api_includes_oat_milk(client):
    """
    Criterio de aceptación 2.4:
    GET /api/substitutes/1 incluye la Bebida de Avena (id 3) entre los candidatos recomendados.
    """
    response = client.get("/api/substitutes/1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    recommended_ids = [sub["recommended_product"]["id"] for sub in data]
    assert 3 in recommended_ids, (
        f"La Bebida de Avena (id 3) debe estar incluida en las recomendaciones para Leche Soprole (id 1). "
        f"IDs recomendados: {recommended_ids}"
    )

