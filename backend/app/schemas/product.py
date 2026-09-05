from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    barcode: str
    name: str
    brand: Optional[str] = None
    category: str
    description: Optional[str] = None
    price: float
    unit: Optional[str] = None
    co2_kg: float
    water_liters: float = 500.0
    packaging_type: Optional[str] = None
    packaging_score: float = 50.0
    origin: Optional[str] = None
    origin_score: float = 50.0
    fair_trade: bool = False
    organic: bool = False
    eco_score: Optional[str] = "c"
    nutri_score: Optional[str] = "c"
    sustainability_score: float = 50.0
    environmental_score: float = 50.0
    social_score: float = 50.0
    economic_score: float = 50.0
    product_family: Optional[str] = None
    is_external: bool = False
    data_quality: str = "verified"
    substitute_id: Optional[int] = None
    image_url: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

