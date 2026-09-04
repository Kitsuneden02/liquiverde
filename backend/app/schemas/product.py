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
    substitute_id: Optional[int] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductFilter(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    eco_score: Optional[str] = None
    max_price: Optional[float] = None
    only_organic: Optional[bool] = False
    only_fair_trade: Optional[bool] = False
