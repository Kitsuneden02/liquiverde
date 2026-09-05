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
    environmental_score = Column(Float, nullable=False, default=50.0)
    social_score = Column(Float, nullable=False, default=50.0)
    economic_score = Column(Float, nullable=False, default=50.0)
    
    # Clasificación por familia de productos para sustitución y optimizador
    product_family = Column(String(120), index=True, nullable=True)
    
    # Metadata de procedencia y calidad de datos (OFF vs Seed verificado)
    is_external = Column(Boolean, default=False)
    data_quality = Column(String(50), default="verified")  # "verified" o "estimated"
    
    # Self-referential substitute product recommendation
    substitute_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    image_url = Column(String(500), nullable=True)

    substitute = relationship("Product", remote_side=[id], lazy="joined")


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

