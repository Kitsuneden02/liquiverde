import pytest
from app.algorithms.scoring import (
    calculate_sustainability_score,
    calculate_environmental_subscore,
    calculate_social_subscore,
    calculate_economic_subscore
)

def test_environmental_subscore_bounds():
    # Caso excelente: 0 CO2, 100 empaque, eco-score 'a', orgánico
    score_high = calculate_environmental_subscore(
        co2_kg=0.1,
        packaging_score=100.0,
        eco_score_grade="a",
        is_organic=True,
        category="lacteos_y_vegetales"
    )
    assert 90.0 <= score_high <= 100.0

    # Caso muy malo: alto CO2, empaque no reciclable, eco-score 'e'
    score_low = calculate_environmental_subscore(
        co2_kg=20.0,
        packaging_score=10.0,
        eco_score_grade="e",
        is_organic=False,
        category="lacteos_y_vegetales"
    )
    assert 0.0 <= score_low <= 30.0


def test_social_subscore_fair_trade_bonus():
    score_standard = calculate_social_subscore(origin_score=70.0, is_fair_trade=False)
    score_fair = calculate_social_subscore(origin_score=70.0, is_fair_trade=True)
    assert score_fair == score_standard + 15.0
    assert score_fair <= 100.0


def test_economic_subscore_relative_price():
    # Más barato que el promedio (r <= 0.8) -> puntaje 95
    score_cheap = calculate_economic_subscore(price=1000, category_avg_price=1500)
    assert score_cheap == 95.0

    # Mucho más caro que el promedio (r > 1.25) -> puntaje 45
    score_expensive = calculate_economic_subscore(price=2500, category_avg_price=1500)
    assert score_expensive == 45.0


def test_calculate_sustainability_score_overall():
    result = calculate_sustainability_score(
        co2_kg=0.55,
        packaging_score=90.0,
        origin_score=95.0,
        price=1490,
        eco_score_grade="a",
        is_fair_trade=True,
        is_organic=True,
        category="lacteos_y_vegetales",
        category_avg_price=1300
    )
    assert "sustainability_score" in result
    assert "environmental_score" in result
    assert "social_score" in result
    assert "economic_score" in result
    assert 0.0 <= result["sustainability_score"] <= 100.0
    assert result["sustainability_score"] >= 85.0  # Producto altamente ecológico


def test_persisted_scores_match_formula(db_session):
    """
    Criterio de aceptación 2.2:
    Para cada producto del seed, el score persistido en la base coincide con
    calculate_sustainability_score(...) +- 0.1 y los subscores corresponden a la fórmula.
    """
    from collections import defaultdict
    from app.db.models import Product

    # Filtrar solo los 40 productos del seed (excluyendo cualquier producto OFF insertado en tests de OFF)
    products = db_session.query(Product).filter(Product.id <= 40).all()
    assert len(products) == 40



    cat_prices = defaultdict(list)
    for p in products:
        cat_prices[p.category].append(float(p.price))
    cat_avg = {cat: sum(prices) / len(prices) for cat, prices in cat_prices.items()}

    for p in products:
        calc = calculate_sustainability_score(
            co2_kg=float(p.co2_kg),
            packaging_score=float(p.packaging_score),
            origin_score=float(p.origin_score),
            price=float(p.price),
            eco_score_grade=p.eco_score or "c",
            is_fair_trade=bool(p.fair_trade),
            is_organic=bool(p.organic),
            category=p.category,
            category_avg_price=cat_avg.get(p.category)
        )

        assert p.sustainability_score == pytest.approx(calc["sustainability_score"], abs=0.1), (
            f"Producto {p.id} ({p.name}): score persistido {p.sustainability_score} != calculado {calc['sustainability_score']}"
        )
        if p.environmental_score is not None:
            assert p.environmental_score == pytest.approx(calc["environmental_score"], abs=0.1)
        if p.social_score is not None:
            assert p.social_score == pytest.approx(calc["social_score"], abs=0.1)
        if p.economic_score is not None:
            assert p.economic_score == pytest.approx(calc["economic_score"], abs=0.1)


def test_curated_substitute_pairs_have_higher_sustainability(db_session):
    """
    Criterio de aceptación 2.2:
    Para cada par curado (original, sustituto) del seed, score(sustituto) > score(original).
    """
    from app.db.models import Product

    products_with_sub = db_session.query(Product).filter(Product.substitute_id.isnot(None)).all()
    assert len(products_with_sub) == 17, f"Se esperaban 17 pares curados, se encontraron {len(products_with_sub)}"

    for orig in products_with_sub:
        sub = db_session.query(Product).filter(Product.id == orig.substitute_id).first()
        assert sub is not None, f"Sustituto {orig.substitute_id} para producto {orig.id} no existe"
        assert sub.sustainability_score > orig.sustainability_score, (
            f"Inversión de score detectada: Original {orig.name} (id {orig.id}) tiene score {orig.sustainability_score}, "
            f"pero sustituto {sub.name} (id {sub.id}) tiene score {sub.sustainability_score}"
        )

