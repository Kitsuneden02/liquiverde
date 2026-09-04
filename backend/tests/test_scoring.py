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
