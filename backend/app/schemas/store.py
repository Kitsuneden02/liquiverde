from typing import Optional
from pydantic import BaseModel, ConfigDict

class StoreOut(BaseModel):
    id: int
    name: str
    store_type: str
    address: str
    latitude: float
    longitude: float
    rating_eco: float
    discount_green: float
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
