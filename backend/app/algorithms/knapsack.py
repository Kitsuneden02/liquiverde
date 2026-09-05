"""
Módulo del Algoritmo de Mochila Multi-Objetivo (Multi-Objective Knapsack)
========================================================================
Optimiza la canasta de compras sujeta a una restricción estricta de presupuesto (B),
balanceando mediante el parámetro alpha:
  - alpha = 0.0: Prioridad máxima a la economía (mayor cantidad de productos y menor costo)
  - alpha = 1.0: Prioridad máxima a la sostenibilidad (mayor eco-score y menor huella CO2)
  - alpha = 0.5: Equilibrio óptimo entre ahorro e impacto ambiental

Implementa:
1. Programación Dinámica (0/1 Knapsack con discretización en pesos chilenos) para solución óptima.
2. Multiple-Choice Knapsack agrupado por familias para evitar redundancias en la canasta de compras.
3. Heurística Greedy basada en ratio Beneficio/Costo para alta concurrencia o presupuestos elevados.
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from app.algorithms.substitution import (
    generate_substitution_reason,
    are_products_compatible_substitutes,
    infer_product_family
)
from app.algorithms.scoring import calculate_category_baseline

def compute_item_utility(

    product: Any,
    alpha: float,
    category_avg_price: Optional[float] = None
) -> float:
    """
    Calcula el valor de utilidad de un producto en función del parámetro alpha [0.0, 1.0].
    
    alpha -> 1.0 : Pondera sostenibilidad y baja huella de carbono.
    alpha -> 0.0 : Pondera ahorro económico relativo a la media de la categoría.
    """
    price = max(1.0, float(getattr(product, "price", 1000.0)))
    score = float(getattr(product, "sustainability_score", 50.0))
    co2 = float(getattr(product, "co2_kg", 2.0))

    # Factor ecológico [0, 100]: combinación de score de sostenibilidad y CO2 normalizado
    eco_factor = (score / 100.0) * 0.7 + max(0.0, (1.0 - min(co2 / 10.0, 1.0))) * 0.3
    eco_utility = max(0.0, min(100.0, eco_factor * 100.0))

    # Factor económico [0, 100]: ahorro relativo respecto al precio promedio de la categoría
    if category_avg_price and category_avg_price > 0:
        rel_diff = (category_avg_price - price) / category_avg_price
        econ_utility = 100.0 * max(0.0, min(1.0, 0.5 + rel_diff))
    else:
        econ_utility = min(100.0, max(0.0, (2000.0 / price) * 50.0))

    return (alpha * eco_utility) + ((1.0 - alpha) * econ_utility)


def solve_knapsack_dp(
    candidates: List[Any],
    budget: float,
    alpha: float,
    scale_factor: int = 50,
    category_avg_price_map: Optional[Dict[str, float]] = None
) -> Tuple[List[Any], float, float]:
    """
    Resuelve el problema de la mochila 0/1 mediante Programación Dinámica estándar.
    Discretiza los precios dividiendo por scale_factor (e.g. 50 CLP) con math.ceil
    para garantizar cumplimiento estricto del presupuesto.
    """
    n = len(candidates)
    if n == 0 or budget <= 0:
        return [], 0.0, 0.0

    capacity = int(budget // scale_factor)
    if capacity <= 0:
        return [], 0.0, 0.0

    # Pesos discretizados con math.ceil y utilidades
    weights = [max(1, math.ceil(float(p.price) / scale_factor)) for p in candidates]
    cat_map = category_avg_price_map or {}
    utilities = [
        compute_item_utility(p, alpha, cat_map.get(getattr(p, "category", None)))
        for p in candidates
    ]

    # Matriz DP: dp[i][w] almacena la utilidad máxima usando un subconjunto de los primeros i elementos
    dp = [[0.0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        w_i = weights[i - 1]
        u_i = utilities[i - 1]
        for w in range(capacity + 1):
            if w_i <= w:
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - w_i] + u_i)
            else:
                dp[i][w] = dp[i - 1][w]

    # Reconstrucción de la solución óptima (backtracking)
    selected: List[Any] = []
    w_curr = capacity
    for i in range(n, 0, -1):
        if dp[i][w_curr] != dp[i - 1][w_curr]:
            selected.append(candidates[i - 1])
            w_curr -= weights[i - 1]

    # Post-verificación defensiva: si el costo real supera el presupuesto,
    # descartar elementos de menor ratio utilidad/precio hasta cumplir estrictamente
    total_cost = sum(float(p.price) for p in selected)
    if total_cost > budget:
        selected.sort(key=lambda p: compute_item_utility(p, alpha, cat_map.get(getattr(p, "category", None))) / max(1.0, float(p.price)))
        while selected and total_cost > budget:
            removed = selected.pop(0)
            total_cost -= float(removed.price)

    total_cost = sum(float(p.price) for p in selected)
    total_utility = sum(
        compute_item_utility(p, alpha, cat_map.get(getattr(p, "category", None)))
        for p in selected
    )

    return selected, total_cost, total_utility


def solve_knapsack_greedy(
    candidates: List[Any],
    budget: float,
    alpha: float,
    category_avg_price_map: Optional[Dict[str, float]] = None
) -> Tuple[List[Any], float, float]:
    """
    Heurística Greedy basada en densidad de beneficio/costo: Ratio_i = Utility_i / Price_i.
    Ordena los ítems en O(n log n) y selecciona vorazmente.
    """
    cat_map = category_avg_price_map or {}
    scored_items = []
    for p in candidates:
        price = max(1.0, float(p.price))
        utility = compute_item_utility(p, alpha, cat_map.get(getattr(p, "category", None)))
        ratio = utility / price
        scored_items.append((ratio, utility, price, p))

    # Ordenar por mejor ratio beneficio/costo descendente
    scored_items.sort(key=lambda x: x[0], reverse=True)

    selected: List[Any] = []
    remaining_budget = budget
    total_utility = 0.0

    for ratio, utility, price, product in scored_items:
        if price <= remaining_budget:
            selected.append(product)
            remaining_budget -= price
            total_utility += utility

    total_cost = sum(float(p.price) for p in selected)
    return selected, total_cost, total_utility


def optimize_shopping_list(
    available_products: List[Any],
    budget: float,
    sustainability_weight: float = 0.5,
    mandatory_product_ids: Optional[List[int]] = None,
    preferred_method: str = "dynamic_programming",
    scale_factor: int = 50
) -> Dict[str, Any]:
    """
    Función principal de optimización de lista de compras (modo catálogo).
    1. Asegura productos obligatorios si caben en el presupuesto.
    2. En modo catálogo con múltiples familias, aplica Multiple-Choice Knapsack (máximo 1 producto por familia)
       para generar una canasta de compras variada, realista y balanceada.
    3. Calcula ahorros económicos y CO2 evitado frente al producto convencional de referencia de cada familia.
    """
    mandatory_ids = set(mandatory_product_ids or [])
    selected_mandatory = []
    mandatory_cost = 0.0

    # Calcular precios promedio por categoría para utilidad económica relativa
    cat_products: Dict[str, List[Any]] = defaultdict(list)
    for p in available_products:
        cat = getattr(p, "category", "") or ""
        cat_products[cat].append(p)
    cat_avg = {cat: calculate_category_baseline(prods)["avg_price"] for cat, prods in cat_products.items()}

    # 1. Separar obligatorios de candidatos libres
    remaining_candidates = []
    mandatory_families = set()
    for p in available_products:
        p_fam = getattr(p, "product_family", None) or infer_product_family(p)
        if p.id in mandatory_ids:
            if mandatory_cost + float(p.price) <= budget:
                selected_mandatory.append(p)
                mandatory_cost += float(p.price)
                mandatory_families.add(p_fam)
        else:
            remaining_candidates.append(p)

    available_budget = max(0.0, budget - mandatory_cost)

    # Agrupar por familia de productos para asegurar diversidad (máximo 1 ítem por familia)
    family_groups: Dict[str, List[Any]] = defaultdict(list)
    for p in remaining_candidates:
        p_fam = getattr(p, "product_family", None) or infer_product_family(p)
        # Si la familia ya fue cubierta por un producto obligatorio, no competir con otro de la misma familia
        if p_fam not in mandatory_families:
            family_groups[p_fam].append(p)

    has_multiple_families = len(family_groups) > 1

    if preferred_method == "greedy" or available_budget > 300000:
        opt_selected, opt_cost, _ = solve_knapsack_greedy(
            remaining_candidates, available_budget, sustainability_weight, cat_avg
        )
        method_used = "greedy_ratio"
    elif has_multiple_families:
        # Multiple-Choice Knapsack DP por grupos de familia
        capacity = int(available_budget // scale_factor)
        if capacity > 0:
            # dp[w] almacena (utilidad_acumulada, lista_items_seleccionados)
            dp: List[Tuple[float, List[Any]]] = [(0.0, []) for _ in range(capacity + 1)]
            for fam, items in family_groups.items():
                new_dp = list(dp)  # Opción de no seleccionar ningún ítem de esta familia
                for p in items:
                    w_i = max(1, math.ceil(float(p.price) / scale_factor))
                    u_i = compute_item_utility(p, sustainability_weight, cat_avg.get(getattr(p, "category", "")))
                    for w in range(w_i, capacity + 1):
                        prev_u, prev_items = dp[w - w_i]
                        if prev_u + u_i > new_dp[w][0]:
                            new_dp[w] = (prev_u + u_i, prev_items + [p])
                dp = new_dp
            _, opt_selected = dp[capacity]
        else:
            opt_selected = []

        # Post-verificación defensiva
        opt_cost = sum(float(p.price) for p in opt_selected)
        if opt_cost > available_budget:
            opt_selected.sort(key=lambda p: compute_item_utility(p, sustainability_weight, cat_avg.get(getattr(p, "category", ""))) / max(1.0, float(p.price)))
            while opt_selected and opt_cost > available_budget:
                removed = opt_selected.pop(0)
                opt_cost -= float(removed.price)
        method_used = "exact_dynamic_programming"
    else:
        opt_selected, opt_cost, _ = solve_knapsack_dp(
            remaining_candidates, available_budget, sustainability_weight, scale_factor, cat_avg
        )
        method_used = "exact_dynamic_programming"

    # Unir productos seleccionados
    all_selected = selected_mandatory + opt_selected
    total_cost = sum(float(p.price) for p in all_selected)
    total_co2 = sum(float(p.co2_kg) for p in all_selected)
    total_water = sum(float(p.water_liters) for p in all_selected)

    avg_score = (
        round(sum(float(p.sustainability_score) for p in all_selected) / len(all_selected), 1)
        if all_selected else 0.0
    )

    # 3. Cálculo de línea base explicable frente a productos convencionales de cada familia
    # Encuentra para cada familia el producto convencional (mayor CO2 y menor score)
    family_all: Dict[str, List[Any]] = defaultdict(list)
    for p in available_products:
        fam = getattr(p, "product_family", None) or infer_product_family(p)
        family_all[fam].append(p)

    conventional_by_family: Dict[str, Any] = {}
    for fam, f_items in family_all.items():
        # El convencional es el que tiene mayor huella de carbono / menor sustentabilidad
        conv = max(f_items, key=lambda item: (float(item.co2_kg), -float(item.sustainability_score)))
        conventional_by_family[fam] = conv

    estimated_conventional_cost = 0.0
    estimated_conventional_co2 = 0.0
    estimated_savings = 0.0
    co2_avoided = 0.0

    for p in all_selected:
        fam = getattr(p, "product_family", None) or infer_product_family(p)
        conv = conventional_by_family.get(fam)
        if conv and getattr(conv, "id", None) != getattr(p, "id", None):
            conv_price = float(conv.price)
            conv_co2 = float(conv.co2_kg)
            estimated_conventional_cost += conv_price
            estimated_conventional_co2 += conv_co2
            estimated_savings += max(0.0, conv_price - float(p.price))
            co2_avoided += max(0.0, conv_co2 - float(p.co2_kg))
        else:
            estimated_conventional_cost += float(p.price)
            estimated_conventional_co2 += float(p.co2_kg)

    return {
        "selected_products": all_selected,
        "total_cost": round(total_cost, 2),
        "total_co2_kg": round(total_co2, 2),
        "total_water_liters": round(total_water, 1),
        "average_sustainability_score": avg_score,
        "budget_limit": round(budget, 2),
        "budget_remaining": round(max(0.0, budget - total_cost), 2),
        "estimated_savings_clp": round(estimated_savings, 0),
        "co2_avoided_kg": round(co2_avoided, 2),
        "optimization_method": method_used,
        "original_products": [],
        "original_total_cost": round(estimated_conventional_cost, 2),
        "original_total_co2_kg": round(estimated_conventional_co2, 2),
        "substitutions": []
    }


def optimize_basket_with_substitutes(
    basket_products: List[Any],
    all_products: List[Any],
    budget: float,
    sustainability_weight: float = 0.5,
    mandatory_product_ids: Optional[List[int]] = None,
    item_quantities: Optional[Dict[int, int]] = None
) -> Dict[str, Any]:
    """
    Optimiza una canasta existente de compras considerando alternativas de sustitución
    para cada producto seleccionado, balanceando entre Ahorro (alpha=0) y Planeta (alpha=1).
    Soporta cantidades exactas por producto (quantity) multiplicando costos y métricas.
    """
    if not basket_products:
        return optimize_shopping_list(all_products, budget, sustainability_weight, mandatory_product_ids)

    qty_map = item_quantities or {}
    mandatory_ids = set(mandatory_product_ids or [])

    # Calcular medias por categoría para el subscore económico
    cat_all_prods: Dict[str, List[Any]] = defaultdict(list)
    for p in all_products:
        cat = getattr(p, "category", "") or ""
        cat_all_prods[cat].append(p)
    cat_avg = {cat: calculate_category_baseline(prods)["avg_price"] for cat, prods in cat_all_prods.items()}

    # Métricas totales de la canasta original teniendo en cuenta cantidades
    original_total_cost = sum(float(p.price) * qty_map.get(p.id, 1) for p in basket_products)
    original_total_co2 = sum(float(p.co2_kg) * qty_map.get(p.id, 1) for p in basket_products)
    original_total_water = sum(float(p.water_liters) * qty_map.get(p.id, 1) for p in basket_products)

    # 1. Construir las opciones candidatas para cada producto de la canasta
    slots = []
    for orig in basket_products:
        qty = max(1, qty_map.get(orig.id, 1))
        if orig.id in mandatory_ids:
            slots.append((orig, qty, [orig]))
            continue

        candidates = [orig]
        for alt in all_products:
            if alt.id == orig.id:
                continue

            if not are_products_compatible_substitutes(orig, alt):
                continue

            is_direct = (getattr(orig, "substitute_id", None) == alt.id)

            alt_price = float(alt.price)
            alt_co2 = float(alt.co2_kg)
            alt_score = float(alt.sustainability_score)
            orig_price = float(orig.price)
            orig_co2 = float(orig.co2_kg)
            orig_score = float(orig.sustainability_score)

            price_advantage = alt_price < orig_price
            eco_advantage = (alt_co2 < orig_co2) or (alt_score > orig_score)

            if is_direct or price_advantage or eco_advantage:
                candidates.append(alt)

        slots.append((orig, qty, candidates))

    # 2. Multiple-Choice Knapsack DP: Elegir 1 candidato por slot maximizando utilidad bajo budget
    # Estado DP: current_cost -> (current_utility, [(original, chosen, quantity)])
    dp: Dict[int, Tuple[float, List[Tuple[Any, Any, int]]]] = {0: (0.0, [])}

    for orig, qty, candidates in slots:
        scored_candidates = []
        for cand in candidates:
            base_util = compute_item_utility(cand, sustainability_weight, cat_avg.get(getattr(cand, "category", "")))
            if getattr(orig, "substitute_id", None) == cand.id:
                base_util += 5.0
            # La utilidad escala con la cantidad
            scored_candidates.append((base_util * qty, cand))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        next_dp: Dict[int, Tuple[float, List[Tuple[Any, Any, int]]]] = {}
        for current_cost, (current_util, current_pairs) in dp.items():
            for util, cand in scored_candidates:
                cand_cost = int(round(float(cand.price) * qty))
                new_cost = current_cost + cand_cost
                if new_cost <= budget:
                    new_util = current_util + util
                    if new_cost not in next_dp or next_dp[new_cost][0] < new_util:
                        next_dp[new_cost] = (new_util, current_pairs + [(orig, cand, qty)])

        if next_dp:
            dp = next_dp
        else:
            # Fallback: tomar la opción más económica para el slot
            cheapest_cand = min(candidates, key=lambda c: float(c.price))
            c_cost = int(round(float(cheapest_cand.price) * qty))
            fallback_dp: Dict[int, Tuple[float, List[Tuple[Any, Any, int]]]] = {}
            for current_cost, (current_util, current_pairs) in dp.items():
                if current_cost + c_cost <= budget:
                    u_val = compute_item_utility(cheapest_cand, sustainability_weight, cat_avg.get(getattr(cheapest_cand, "category", ""))) * qty
                    fallback_dp[current_cost + c_cost] = (
                        current_util + u_val,
                        current_pairs + [(orig, cheapest_cand, qty)]
                    )
            if fallback_dp:
                dp = fallback_dp
            else:
                break

    if not dp:
        best_pairs = [(p, p, max(1, qty_map.get(p.id, 1))) for p in basket_products]
    else:
        best_cost, (best_util, best_pairs) = max(dp.items(), key=lambda item: item[1][0])

    selected_products = [pair[1] for pair in best_pairs]
    total_cost = sum(float(pair[1].price) * pair[2] for pair in best_pairs)
    total_co2 = sum(float(pair[1].co2_kg) * pair[2] for pair in best_pairs)
    total_water = sum(float(pair[1].water_liters) * pair[2] for pair in best_pairs)

    # 3. Detectar sustituciones realizadas y generar razones comprensibles
    substitutions = []
    for orig, chosen, qty in best_pairs:
        if orig.id != chosen.id:
            price_diff = (float(orig.price) - float(chosen.price)) * qty
            co2_reduction = (float(orig.co2_kg) - float(chosen.co2_kg)) * qty
            water_saved = (float(orig.water_liters) - float(chosen.water_liters)) * qty
            score_gain = float(chosen.sustainability_score) - float(orig.sustainability_score)

            reason = generate_substitution_reason(
                original=orig,
                alt=chosen,
                price_diff=price_diff,
                co2_reduction=co2_reduction,
                water_saved=water_saved
            )

            substitutions.append({
                "original_product": orig,
                "recommended_product": chosen,
                "price_difference_clp": round(price_diff, 2),
                "co2_reduction_kg": round(co2_reduction, 2),
                "water_saved_liters": round(water_saved, 1),
                "sustainability_gain": round(score_gain, 1),
                "recommendation_reason": reason
            })

    estimated_savings = max(0.0, round(original_total_cost - total_cost, 0))
    co2_avoided = max(0.0, round(original_total_co2 - total_co2, 2))
    
    total_items_count = sum(pair[2] for pair in best_pairs)
    avg_score = (
        round(sum(float(pair[1].sustainability_score) * pair[2] for pair in best_pairs) / total_items_count, 1)
        if total_items_count > 0 else 0.0
    )

    return {
        "selected_products": selected_products,
        "total_cost": round(total_cost, 2),
        "total_co2_kg": round(total_co2, 2),
        "total_water_liters": round(total_water, 1),
        "average_sustainability_score": avg_score,
        "budget_limit": round(budget, 2),
        "budget_remaining": round(max(0.0, budget - total_cost), 2),
        "estimated_savings_clp": estimated_savings,
        "co2_avoided_kg": co2_avoided,
        "optimization_method": "multiple_choice_basket_optimization",
        "original_products": basket_products,
        "original_total_cost": round(original_total_cost, 2),
        "original_total_co2_kg": round(original_total_co2, 2),
        "substitutions": substitutions
    }
