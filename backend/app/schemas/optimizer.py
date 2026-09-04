from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.product import ProductOut

class KnapsackRequest(BaseModel):
    product_ids: Optional[List[int]] = Field(
        default=None, 
        description="Lista de IDs de productos seleccionados o deseados. Si se omite, evalúa todo el catálogo."
    )
    budget: float = Field(
        gt=0, 
        description="Presupuesto máximo disponible en CLP."
    )
    sustainability_weight: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0, 
        description="Ponderación entre Ahorro Económico (0.0) y Sostenibilidad Ecológica (1.0)."
    )
    mandatory_product_ids: Optional[List[int]] = Field(
        default_factory=list, 
        description="IDs de productos que deben incluirse obligatoriamente si el presupuesto lo permite."
    )

class KnapsackResponse(BaseModel):
    selected_products: List[ProductOut]
    total_cost: float
    total_co2_kg: float
    total_water_liters: float
    average_sustainability_score: float
    budget_limit: float
    budget_remaining: float
    estimated_savings_clp: float
    co2_avoided_kg: float
    optimization_method: str  # 'exact_dynamic_programming' or 'greedy_ratio'

class SubstituteRecommendation(BaseModel):
    original_product: ProductOut
    recommended_product: ProductOut
    price_difference_clp: float  # Positive means you save money
    co2_reduction_kg: float      # Positive means emissions avoided
    water_saved_liters: float    # Positive means water conserved
    sustainability_gain: float   # Difference in sustainability score
    recommendation_reason: str
