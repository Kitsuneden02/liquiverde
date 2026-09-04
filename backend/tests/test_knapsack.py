import pytest
from types import SimpleNamespace
from app.algorithms.knapsack import optimize_shopping_list, solve_knapsack_dp, solve_knapsack_greedy

def create_mock_products():
    return [
        SimpleNamespace(id=1, name="Leche Tradicional", price=1290, sustainability_score=38.5, co2_kg=2.4, water_liters=1050),
        SimpleNamespace(id=2, name="Leche Colún Local", price=1150, sustainability_score=79.0, co2_kg=1.45, water_liters=720),
        SimpleNamespace(id=3, name="Bebida de Avena Eco", price=1490, sustainability_score=92.5, co2_kg=0.55, water_liters=180),
        SimpleNamespace(id=4, name="Carne Molida", price=4990, sustainability_score=21.0, co2_kg=18.5, water_liters=7700),
        SimpleNamespace(id=5, name="Lentejas Maule 1kg", price=2190, sustainability_score=94.0, co2_kg=0.85, water_liters=650),
        SimpleNamespace(id=6, name="Detergente Algramo 3L", price=5490, sustainability_score=96.0, co2_kg=1.1, water_liters=350),
    ]

def test_knapsack_respects_budget_strictly():
    products = create_mock_products()
    budget = 5000.0  # Presupuesto acotado

    result = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.5
    )

    assert result["total_cost"] <= budget
    assert result["budget_remaining"] >= 0.0
    assert result["total_cost"] + result["budget_remaining"] == pytest.approx(budget, abs=1.0)
    assert len(result["selected_products"]) > 0


def test_knapsack_insufficient_budget():
    products = create_mock_products()
    budget = 500.0  # El producto más barato cuesta 1150 CLP

    result = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.5
    )

    assert result["selected_products"] == []
    assert result["total_cost"] == 0.0
    assert result["budget_remaining"] == budget


def test_knapsack_sustainability_vs_economy_slider():
    products = create_mock_products()
    budget = 7000.0

    # Modo verde extremo (alpha = 1.0)
    result_green = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=1.0
    )

    # Modo ahorro económico (alpha = 0.0)
    result_econ = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.0
    )

    # El modo verde debe lograr un score promedio de sostenibilidad mayor o igual al modo económico
    assert result_green["average_sustainability_score"] >= result_econ["average_sustainability_score"]


def test_knapsack_mandatory_items():
    products = create_mock_products()
    budget = 6000.0
    # Obligar a incluir el ítem 5 (Lentejas Maule)
    result = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.5,
        mandatory_product_ids=[5]
    )

    selected_ids = [p.id for p in result["selected_products"]]
    assert 5 in selected_ids
    assert result["total_cost"] <= budget


def test_greedy_method_execution():
    products = create_mock_products()
    budget = 5000.0
    result = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.5,
        preferred_method="greedy"
    )
    assert result["optimization_method"] == "greedy_ratio"
    assert result["total_cost"] <= budget
