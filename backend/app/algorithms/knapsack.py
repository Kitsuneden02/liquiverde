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
2. Heurística Greedy basada en ratio Beneficio/Costo para alta concurrencia o catálogos masivos.
"""

from typing import List, Dict, Any, Optional, Tuple
from app.algorithms.substitution import generate_substitution_reason, are_products_compatible_substitutes

def compute_item_utility(product: Any, alpha: float) -> float:
    """
    Calcula el valor de utilidad de un producto en función del parámetro alpha [0.0, 1.0].
    
    alpha -> 1.0 : Pondera sostenibilidad y baja huella de carbono.
    alpha -> 0.0 : Pondera eficiencia económica (valor por peso gastado).
    """
    price = max(1.0, float(getattr(product, "price", 1000.0)))
    score = float(getattr(product, "sustainability_score", 50.0))
    co2 = float(getattr(product, "co2_kg", 2.0))

    # Factor ecológico: combinación de score de sostenibilidad y CO2 normalizado
    eco_factor = (score / 100.0) * 0.7 + max(0.0, (1.0 - min(co2 / 10.0, 1.0))) * 0.3
    eco_utility = eco_factor * 100.0

    # Factor económico: rentabilidad por peso invertido (normalizado frente a canasta estándar de ~2000 CLP)
    econ_utility = min(100.0, (2000.0 / price) * 50.0)

    # Utilidad combinada según la preferencia del consumidor
    return (alpha * eco_utility) + ((1.0 - alpha) * econ_utility)


def solve_knapsack_dp(
    candidates: List[Any],
    budget: float,
    alpha: float,
    scale_factor: int = 50
) -> Tuple[List[Any], float, float]:
    """
    Resuelve el problema de la mochila 0/1 mediante Programación Dinámica.
    Discretiza los precios dividiendo por scale_factor (e.g. 50 CLP) para mantener
    la tabla DP de tamaño acotado y computación en milisegundos.
    """
    n = len(candidates)
    if n == 0 or budget <= 0:
        return [], 0.0, 0.0

    capacity = int(budget // scale_factor)
    if capacity <= 0:
        return [], 0.0, 0.0

    # Pesos discretizados y utilidades
    weights = [max(1, int(round(float(p.price) / scale_factor))) for p in candidates]
    utilities = [compute_item_utility(p, alpha) for p in candidates]

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

    total_cost = sum(float(p.price) for p in selected)
    total_utility = sum(compute_item_utility(p, alpha) for p in selected)

    return selected, total_cost, total_utility


def solve_knapsack_greedy(
    candidates: List[Any],
    budget: float,
    alpha: float
) -> Tuple[List[Any], float, float]:
    """
    Heurística Greedy basada en densidad de beneficio/costo: Ratio_i = Utility_i / Price_i.
    Ordena los ítems en O(n log n) y selecciona vorazmente.
    """
    scored_items = []
    for p in candidates:
        price = max(1.0, float(p.price))
        utility = compute_item_utility(p, alpha)
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
    preferred_method: str = "dynamic_programming"
) -> Dict[str, Any]:
    """
    Función principal de optimización de lista de compras.
    1. Asegura productos obligatorios si caben en el presupuesto.
    2. Optimiza el presupuesto remanente entre el resto de candidatos.
    3. Calcula ahorros económicos y de CO2 proyectados frente a alternativas tradicionales.
    """
    mandatory_ids = set(mandatory_product_ids or [])
    selected_mandatory = []
    mandatory_cost = 0.0

    # 1. Separar obligatorios de candidatos libres
    remaining_candidates = []
    for p in available_products:
        if p.id in mandatory_ids:
            if mandatory_cost + float(p.price) <= budget:
                selected_mandatory.append(p)
                mandatory_cost += float(p.price)
            # Si no cabe, no se incluye
        else:
            remaining_candidates.append(p)

    available_budget = max(0.0, budget - mandatory_cost)

    # 2. Ejecutar optimizador en el presupuesto remanente
    if preferred_method == "greedy" or available_budget > 300000:
        opt_selected, opt_cost, _ = solve_knapsack_greedy(
            remaining_candidates, available_budget, sustainability_weight
        )
        method_used = "greedy_ratio"
    else:
        opt_selected, opt_cost, _ = solve_knapsack_dp(
            remaining_candidates, available_budget, sustainability_weight
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

    # 3. Calcular métricas de ahorro y mitigación ambiental
    # Comparar con comprar el equivalente convencional promedio de cada categoría seleccionada
    estimated_conventional_cost = sum(float(p.price) * 1.15 for p in all_selected)
    estimated_conventional_co2 = sum(max(float(p.co2_kg), 2.5) for p in all_selected)

    co2_avoided = max(0.0, round(estimated_conventional_co2 - total_co2, 2))
    estimated_savings = max(0.0, round(estimated_conventional_cost - total_cost, 0))

    return {
        "selected_products": all_selected,
        "total_cost": round(total_cost, 2),
        "total_co2_kg": round(total_co2, 2),
        "total_water_liters": round(total_water, 1),
        "average_sustainability_score": avg_score,
        "budget_limit": round(budget, 2),
        "budget_remaining": round(max(0.0, budget - total_cost), 2),
        "estimated_savings_clp": estimated_savings,
        "co2_avoided_kg": co2_avoided,
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
    mandatory_product_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Optimiza una canasta existente de compras considerando alternativas de sustitución
    para cada producto seleccionado, balanceando entre Ahorro (alpha=0) y Planeta (alpha=1).
    
    Aplica una variante de Multiple-Choice Knapsack para seleccionar exactamente la mejor
    opción (producto original o sustituto) por cada ítem de la canasta, respetando el presupuesto.
    """
    if not basket_products:
        return optimize_shopping_list(all_products, budget, sustainability_weight, mandatory_product_ids)

    mandatory_ids = set(mandatory_product_ids or [])
    original_total_cost = sum(float(p.price) for p in basket_products)
    original_total_co2 = sum(float(p.co2_kg) for p in basket_products)
    original_total_water = sum(float(p.water_liters) for p in basket_products)

    # 1. Construir las opciones candidatas para cada producto de la canasta
    slots = []
    for orig in basket_products:
        if orig.id in mandatory_ids:
            slots.append((orig, [orig]))
            continue

        candidates = [orig]
        for alt in all_products:
            if alt.id == orig.id:
                continue

            if not are_products_compatible_substitutes(orig, alt):
                continue

            is_direct = (orig.substitute_id == alt.id)

            # Es un sustituto viable si aporta ventaja en precio, CO2, o puntuación
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

        slots.append((orig, candidates))

    # 2. Multiple-Choice Knapsack DP: Elegir 1 candidato por slot maximizando utilidad bajo budget
    # Estado DP: current_cost -> (current_utility, [(original, chosen)])
    dp: Dict[int, Tuple[float, List[Tuple[Any, Any]]]] = {0: (0.0, [])}

    for orig, candidates in slots:
        # Ponderar candidatos con compute_item_utility
        scored_candidates = []
        for cand in candidates:
            base_util = compute_item_utility(cand, sustainability_weight)
            # Si es un sustituto directo curado, dar un pequeño incentivo
            if orig.substitute_id == cand.id:
                base_util += 5.0
            scored_candidates.append((base_util, cand))

        # Ordenar por utilidad descendente
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        next_dp: Dict[int, Tuple[float, List[Tuple[Any, Any]]]] = {}
        for current_cost, (current_util, current_pairs) in dp.items():
            for util, cand in scored_candidates:
                cand_cost = int(round(float(cand.price)))
                new_cost = current_cost + cand_cost
                if new_cost <= budget:
                    new_util = current_util + util
                    if new_cost not in next_dp or next_dp[new_cost][0] < new_util:
                        next_dp[new_cost] = (new_util, current_pairs + [(orig, cand)])

        if next_dp:
            dp = next_dp
        else:
            # Si el presupuesto no permite todas las opciones preferidas, tomar la opción más económica
            cheapest_cand = min(candidates, key=lambda c: float(c.price))
            c_cost = int(round(float(cheapest_cand.price)))
            fallback_dp: Dict[int, Tuple[float, List[Tuple[Any, Any]]]] = {}
            for current_cost, (current_util, current_pairs) in dp.items():
                if current_cost + c_cost <= budget:
                    fallback_dp[current_cost + c_cost] = (
                        current_util + compute_item_utility(cheapest_cand, sustainability_weight),
                        current_pairs + [(orig, cheapest_cand)]
                    )
            if fallback_dp:
                dp = fallback_dp
            else:
                break

    if not dp:
        # Fallback: devolver los productos originales si no hubo solución posible
        best_pairs = [(p, p) for p in basket_products]
    else:
        # Seleccionar la solución con mayor utilidad acumulada
        best_cost, (best_util, best_pairs) = max(dp.items(), key=lambda item: item[1][0])

    selected_products = [pair[1] for pair in best_pairs]
    total_cost = sum(float(p.price) for p in selected_products)
    total_co2 = sum(float(p.co2_kg) for p in selected_products)
    total_water = sum(float(p.water_liters) for p in selected_products)

    # 3. Detectar sustituciones realizadas y generar razones comprensibles
    substitutions = []
    for orig, chosen in best_pairs:
        if orig.id != chosen.id:
            price_diff = float(orig.price) - float(chosen.price)
            co2_reduction = float(orig.co2_kg) - float(chosen.co2_kg)
            water_saved = float(orig.water_liters) - float(chosen.water_liters)
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
    avg_score = (
        round(sum(float(p.sustainability_score) for p in selected_products) / len(selected_products), 1)
        if selected_products else 0.0
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
