import pytest
from types import SimpleNamespace
from app.algorithms.knapsack import optimize_shopping_list, solve_knapsack_dp, solve_knapsack_greedy

def create_mock_products():
    return [
        SimpleNamespace(id=1, name="Leche Tradicional", price=1290, sustainability_score=38.5, co2_kg=2.4, water_liters=1050, product_family="leche_y_bebidas_vegetales", category="lacteos_y_vegetales"),
        SimpleNamespace(id=2, name="Leche Colún Local", price=1150, sustainability_score=79.0, co2_kg=1.45, water_liters=720, product_family="leche_y_bebidas_vegetales", category="lacteos_y_vegetales"),
        SimpleNamespace(id=3, name="Bebida de Avena Eco", price=1490, sustainability_score=92.5, co2_kg=0.55, water_liters=180, product_family="leche_y_bebidas_vegetales", category="lacteos_y_vegetales"),
        SimpleNamespace(id=4, name="Carne Molida", price=4990, sustainability_score=21.0, co2_kg=18.5, water_liters=7700, product_family="carnes_y_proteinas", category="proteinas_y_legumbres"),
        SimpleNamespace(id=5, name="Lentejas Maule 1kg", price=2190, sustainability_score=94.0, co2_kg=0.85, water_liters=650, product_family="legumbres", category="proteinas_y_legumbres"),
        SimpleNamespace(id=6, name="Detergente Algramo 3L", price=5490, sustainability_score=96.0, co2_kg=1.1, water_liters=350, product_family="detergentes", category="limpieza_y_hogar"),
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

    # El modo verde debe lograr un score promedio de sostenibilidad estrictamente mayor al modo económico
    assert result_green["average_sustainability_score"] > result_econ["average_sustainability_score"]



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


def test_knapsack_no_overbudget_with_non_multiples_of_scale():
    """
    Verifica que precios con residuos respecto a scale_factor (e.g. 1.024 CLP)
    no provoquen que la mochila supere el presupuesto debido a subestimación por redondeo.
    """
    items = [
        SimpleNamespace(id=i, name=f"Item {i}", price=1024.0, sustainability_score=80.0, co2_kg=1.0, water_liters=100.0)
        for i in range(1, 11)
    ]
    budget = 5000.0
    result = optimize_shopping_list(
        available_products=items,
        budget=budget,
        sustainability_weight=0.5
    )
    assert result["total_cost"] <= budget
    # Con ceil, 1024 pesa 21 unidades (1050 equiv). En capacidad 100 caben a lo más 4 ítems (4096 <= 5000)
    assert len(result["selected_products"]) <= 4


def test_knapsack_dp_optimality_vs_brute_force():
    """
    Verifica que el algoritmo DP logre la solución óptima exacta comparándolo
    con la búsqueda exhaustiva (fuerza bruta 2^n) en un catálogo de prueba.
    """
    import itertools
    from app.algorithms.knapsack import compute_item_utility

    items = [
        SimpleNamespace(id=1, name="P1", price=300.0, sustainability_score=80.0, co2_kg=1.0, water_liters=100.0),
        SimpleNamespace(id=2, name="P2", price=500.0, sustainability_score=40.0, co2_kg=2.0, water_liters=200.0),
        SimpleNamespace(id=3, name="P3", price=250.0, sustainability_score=90.0, co2_kg=0.5, water_liters=50.0),
        SimpleNamespace(id=4, name="P4", price=700.0, sustainability_score=60.0, co2_kg=1.5, water_liters=150.0),
        SimpleNamespace(id=5, name="P5", price=450.0, sustainability_score=75.0, co2_kg=1.2, water_liters=120.0),
        SimpleNamespace(id=6, name="P6", price=600.0, sustainability_score=85.0, co2_kg=0.8, water_liters=80.0),
        SimpleNamespace(id=7, name="P7", price=150.0, sustainability_score=30.0, co2_kg=3.0, water_liters=300.0),
    ]
    budget = 1200.0
    alpha = 0.6

    selected_dp, cost_dp, util_dp = solve_knapsack_dp(items, budget, alpha, scale_factor=50)
    assert cost_dp <= budget

    best_util = 0.0
    for r in range(len(items) + 1):
        for combo in itertools.combinations(items, r):
            c = sum(p.price for p in combo)
            if c <= budget:
                u = sum(compute_item_utility(p, alpha) for p in combo)
                if u > best_util:
                    best_util = u

    assert util_dp == pytest.approx(best_util, abs=1e-5)


def test_knapsack_slider_effect_real_seed(db_session):
    """
    Criterio de aceptación 2.1:
    Con el dataset real y presupuesto 15.000:
    average_sustainability_score(alpha=1.0) > average_sustainability_score(alpha=0.0) estrictamente,
    y total_cost(alpha=0.0) <= total_cost(alpha=1.0) con al menos 3 ítems de diferencia en la selección.
    """
    from app.db.models import Product
    products = db_session.query(Product).filter(Product.is_external.is_(False)).all()
    assert len(products) == 40

    budget = 15000.0

    res_green = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=1.0
    )
    res_econ = optimize_shopping_list(
        available_products=products,
        budget=budget,
        sustainability_weight=0.0
    )

    assert res_green["average_sustainability_score"] > res_econ["average_sustainability_score"]
    assert res_econ["total_cost"] <= res_green["total_cost"]

    green_ids = set(p.id for p in res_green["selected_products"])
    econ_ids = set(p.id for p in res_econ["selected_products"])
    diff_items = len(green_ids.symmetric_difference(econ_ids))
    assert diff_items >= 3, f"Se esperaban al menos 3 ítems de diferencia entre alpha 0 y 1, hubo {diff_items}"


def test_knapsack_baseline_savings_conventional_not_fixed_percentage(db_session):
    """
    Criterio de aceptación 2.5:
    Con el dataset real, el ahorro reportado nunca es exactamente 0.15 * total_cost;
    para una canasta compuesta solo por productos convencionales (ids 1, 4, 17, 21) el ahorro es 0.
    """
    from app.db.models import Product
    products = db_session.query(Product).all()
    res = optimize_shopping_list(
        available_products=products,
        budget=20000.0,
        sustainability_weight=0.7
    )
    assert res["total_cost"] > 0
    # No debe ser la constante fija del 15%
    assert res["estimated_savings_clp"] != pytest.approx(0.15 * res["total_cost"], rel=1e-3)

    # Para una lista donde todos los seleccionados son los más convencionales de su familia (ids 1, 4, 17, 21)
    conv_products = db_session.query(Product).filter(Product.id.in_([1, 4, 17, 21])).all()
    res_conv = optimize_shopping_list(
        available_products=conv_products,
        budget=20000.0,
        sustainability_weight=0.5
    )
    assert res_conv["estimated_savings_clp"] == 0.0
    assert res_conv["co2_avoided_kg"] == 0.0


def test_optimize_basket_cart_quantities_support(db_session, client):
    """
    Criterio de aceptación 2.6:
    Canasta [(1, 3)] (3 unidades de Leche Soprole a $1.290 c/u) con presupuesto $10.000:
    original_total_cost == 3870.0
    """
    from app.algorithms.knapsack import optimize_basket_with_substitutes
    from app.db.models import Product

    products = db_session.query(Product).all()
    p1 = db_session.query(Product).filter(Product.id == 1).first()
    assert p1 is not None

    # Prueba directa del algoritmo
    direct_res = optimize_basket_with_substitutes(
        basket_products=[p1],
        all_products=products,
        budget=10000.0,
        sustainability_weight=0.5,
        item_quantities={1: 3}
    )
    assert direct_res["original_total_cost"] == 3870.0
    assert direct_res["total_cost"] <= 10000.0

    # Prueba a través del endpoint de API
    api_res = client.post("/api/optimize/knapsack", json={
        "items": [{"product_id": 1, "quantity": 3}],
        "budget": 10000.0,
        "sustainability_weight": 0.5
    })
    assert api_res.status_code == 200
    data = api_res.json()
    assert data["original_total_cost"] == 3870.0
    assert data["total_cost"] <= 10000.0



def test_optimize_basket_with_substitutes_properties(db_session):
    """
    Criterio de auditoría 4.1:
    (a) Todas las sustituciones respetan compatibilidad (are_products_compatible_substitutes).
    (b) total_cost <= budget.
    (c) Con presupuesto insuficiente para la canasta original, se degrada al ítem más barato por slot.
    (d) Un producto marcado mandatory nunca se sustituye.
    (e) Con alpha=0 se elige siempre la opción más barata de cada slot cuando cabe.
    """
    from app.algorithms.knapsack import optimize_basket_with_substitutes
    from app.algorithms.substitution import are_products_compatible_substitutes
    from app.db.models import Product

    all_prods = db_session.query(Product).all()
    p_leche = db_session.query(Product).filter(Product.id == 1).first()    # 1290 CLP
    p_carne = db_session.query(Product).filter(Product.id == 4).first()    # 4990 CLP
    p_coca = db_session.query(Product).filter(Product.id == 17).first()    # 1890 CLP
    basket = [p_leche, p_carne, p_coca]

    # (a) y (b): Compatibilidad y cumplimiento estricto de presupuesto
    res = optimize_basket_with_substitutes(
        basket_products=basket,
        all_products=all_prods,
        budget=10000.0,
        sustainability_weight=0.7
    )
    assert res["total_cost"] <= 10000.0
    for sub in res["substitutions"]:
        orig = sub["original_product"]
        recom = sub["recommended_product"]
        assert are_products_compatible_substitutes(orig, recom) is True

    # (c) Presupuesto ajustado (5000 CLP para canasta original de 8170 CLP):
    # Con budget = 5000, no cabe Carne Molida (4990) junto al resto.
    # Debe degradar el slot de carne a un sustituto más barato (ej. Lentejas 1890 o Jurel 1490).
    res_tight = optimize_basket_with_substitutes(
        basket_products=basket,
        all_products=all_prods,
        budget=5000.0,
        sustainability_weight=0.5
    )
    assert res_tight["total_cost"] <= 5000.0
    carne_slot = [s for s in res_tight["substitutions"] if s["original_product"].id == 4]
    assert len(carne_slot) == 1
    assert carne_slot[0]["recommended_product"].price < p_carne.price

    # (d) Mandatory product nunca se sustituye
    res_mandatory = optimize_basket_with_substitutes(
        basket_products=basket,
        all_products=all_prods,
        budget=10000.0,
        sustainability_weight=1.0,
        mandatory_product_ids=[1]
    )
    sub_orig_ids = [s["original_product"].id for s in res_mandatory["substitutions"]]
    assert 1 not in sub_orig_ids, "El producto mandatory id=1 no debió ser sustituido"

    # (e) Con alpha=0 se elige la opción más barata de cada slot
    res_cheap = optimize_basket_with_substitutes(
        basket_products=basket,
        all_products=all_prods,
        budget=10000.0,
        sustainability_weight=0.0
    )
    assert res_cheap["total_cost"] <= 10000.0
    # En leche (slot 1), la opción más barata entre Soprole (1290), Colun (1150) y Vilay (1490) es Colún (1150)
    chosen_milk = next((s["recommended_product"] for s in res_cheap["substitutions"] if s["original_product"].id == 1), p_leche)
    assert chosen_milk.id == 2

