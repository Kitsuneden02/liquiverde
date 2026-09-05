"""
Definición canónica centralizada de categorías y techos de CO2 para LiquiVerde.
Garantiza coherencia entre clasificación heurística, cálculo de scoring, seed y frontend.
"""
from typing import List, Dict

CANONICAL_CATEGORIES: List[str] = [
    "abarrotes_y_cereales",
    "bebidas",
    "despensa_y_condimentos",
    "frutas_y_verduras",
    "lacteos_y_vegetales",
    "limpieza_y_hogar",
    "panaderia_y_snacks",
    "proteinas_y_legumbres",
]

CATEGORY_CO2_CEILINGS: Dict[str, float] = {
    "proteinas_y_legumbres": 20.0,
    "lacteos_y_vegetales": 3.5,
    "abarrotes_y_cereales": 4.5,
    "limpieza_y_hogar": 6.0,
    "despensa_y_condimentos": 4.0,
    "panaderia_y_snacks": 3.0,
    "frutas_y_verduras": 2.0,
    "bebidas": 3.0,
}
