import json
import logging
import sys
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import engine, SessionLocal, Base
from app.db.models import Product, Store

logger = logging.getLogger("liquiverde.init_db")

def init_db(db: Session = None, reload_stores: bool = False, reload_products: bool = False) -> None:
    """Creates database tables and loads initial seed data if tables are empty, count differs, or reload requested."""
    Base.metadata.create_all(bind=engine)
    
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # 1. Seed Products if empty, count differs, or reload requested
        product_count = db.query(Product).count()
        if settings.PRODUCTS_SEED_FILE.exists():
            with open(settings.PRODUCTS_SEED_FILE, "r", encoding="utf-8") as f:
                products_data = json.load(f)
            
            should_reload_products = reload_products or product_count == 0 or product_count != len(products_data)
            if should_reload_products:
                logger.info(f"Loading products seed from {settings.PRODUCTS_SEED_FILE} (current in DB: {product_count}, seed file: {len(products_data)})...")
                db.query(Product).delete()
                db.commit()
            
                for item in products_data:
                    product = Product(
                        id=item.get("id"),
                        barcode=item["barcode"],
                        name=item["name"],
                        brand=item.get("brand"),
                        category=item["category"],
                        description=item.get("description"),
                        price=float(item["price"]),
                        unit=item.get("unit"),
                        co2_kg=float(item.get("co2_kg", 1.0)),
                        water_liters=float(item.get("water_liters", 500.0)),
                        packaging_type=item.get("packaging_type"),
                        packaging_score=float(item.get("packaging_score", 50.0)),
                        origin=item.get("origin"),
                        origin_score=float(item.get("origin_score", 50.0)),
                        fair_trade=bool(item.get("fair_trade", False)),
                        organic=bool(item.get("organic", False)),
                        eco_score=item.get("eco_score", "c"),
                        nutri_score=item.get("nutri_score", "c"),
                        sustainability_score=float(item.get("sustainability_score", 50.0)),
                        substitute_id=item.get("substitute_id"),
                        image_url=item.get("image_url")
                    )
                    db.add(product)
                db.commit()
                logger.info(f"Successfully seeded {len(products_data)} products.")
            else:
                logger.info(f"Products table already contains {product_count} records. Skipping seed.")

        # 2. Seed Stores (reload if requested, empty, or count differs)
        store_count = db.query(Store).count()
        if settings.STORES_SEED_FILE.exists():
            with open(settings.STORES_SEED_FILE, "r", encoding="utf-8") as f:
                stores_data = json.load(f)
            
            should_reload_stores = reload_stores or store_count == 0 or store_count != len(stores_data)
            if should_reload_stores:
                logger.info(f"Loading stores seed from {settings.STORES_SEED_FILE} (current in DB: {store_count}, seed file: {len(stores_data)})...")
                db.query(Store).delete()
                db.commit()

                for item in stores_data:
                    store = Store(
                        id=item.get("id"),
                        name=item["name"],
                        store_type=item["store_type"],
                        address=item["address"],
                        latitude=float(item["latitude"]),
                        longitude=float(item["longitude"]),
                        rating_eco=float(item.get("rating_eco", 4.0)),
                        discount_green=float(item.get("discount_green", 0.0)),
                        description=item.get("description")
                    )
                    db.add(store)
                db.commit()
                logger.info(f"Successfully seeded {len(stores_data)} stores.")
            else:
                logger.info(f"Stores table already contains {store_count} records. Skipping seed.")

    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    reload_p = "--reload-products" in sys.argv or "-p" in sys.argv
    reload_s = "--reload-stores" in sys.argv or "-s" in sys.argv
    if len(sys.argv) == 1 or "--all" in sys.argv:
        reload_p = True
        reload_s = True
    init_db(reload_products=reload_p, reload_stores=reload_s)
