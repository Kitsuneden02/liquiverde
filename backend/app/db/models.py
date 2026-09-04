from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    brand = Column(String(120), nullable=True)
    category = Column(String(120), index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)  # CLP
    unit = Column(String(50), nullable=True)
    co2_kg = Column(Float, nullable=False, default=1.0)
    water_liters = Column(Float, nullable=False, default=500.0)
    packaging_type = Column(String(120), nullable=True)
    packaging_score = Column(Float, nullable=False, default=50.0)  # 0-100
    origin = Column(String(150), nullable=True)
    origin_score = Column(Float, nullable=False, default=50.0)  # 0-100
    fair_trade = Column(Boolean, default=False)
    organic = Column(Boolean, default=False)
    eco_score = Column(String(10), default="c")  # a, b, c, d, e
    nutri_score = Column(String(10), default="c")
    sustainability_score = Column(Float, nullable=False, default=50.0)
    
    # Self-referential substitute product recommendation
    substitute_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    image_url = Column(String(500), nullable=True)

    substitute = relationship("Product", remote_side=[id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "barcode": self.barcode,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "description": self.description,
            "price": self.price,
            "unit": self.unit,
            "co2_kg": self.co2_kg,
            "water_liters": self.water_liters,
            "packaging_type": self.packaging_type,
            "packaging_score": self.packaging_score,
            "origin": self.origin,
            "origin_score": self.origin_score,
            "fair_trade": self.fair_trade,
            "organic": self.organic,
            "eco_score": self.eco_score,
            "nutri_score": self.nutri_score,
            "sustainability_score": self.sustainability_score,
            "substitute_id": self.substitute_id,
            "image_url": self.image_url
        }


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    store_type = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating_eco = Column(Float, default=4.0)
    discount_green = Column(Float, default=0.0)  # % discount on green products
    description = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "store_type": self.store_type,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "rating_eco": self.rating_eco,
            "discount_green": self.discount_green,
            "description": self.description
        }
