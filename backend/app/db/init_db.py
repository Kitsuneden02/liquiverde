import json
import logging
import sys
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import engine, SessionLocal, Base
from app.db.models import Product, Store

logger = logging.getLogger("liquiverde.init_db")

def init_db(
    db: Session = None,
    reload_stores: bool = False,
    reload_products: bool = False,
    reset: bool = False
) -> None:
    """
    Inicializa las tablas de la base de datos y siembra los datos iniciales de forma idempotente por clave natural (barcode / store id).
    Nunca elimina productos existentes (por ejemplo, aquellos añadidos desde Open Food Facts) a menos que se invoque explícitamente con reset=True.
    """
    if reset:
        logger.info("Resetting entire database tables (Product, Store)...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        Base.metadata.create_all(bind=engine)
    
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:


        # 1. Seed Products de forma idempotente por barcode con cálculo de scoring dinámico
        if settings.PRODUCTS_SEED_FILE.exists():
            with open(settings.PRODUCTS_SEED_FILE, "r", encoding="utf-8") as f:
                products_data = json.load(f)

            # Calcular precios promedio por categoría a partir del seed para el subscore económico
            from collections import defaultdict
            from app.algorithms.scoring import calculate_sustainability_score

            category_prices = defaultdict(list)
            for item in products_data:
                category_prices[item["category"]].append(float(item["price"]))
            category_avg = {cat: sum(prices) / len(prices) for cat, prices in category_prices.items()}

            existing_products = {p.barcode: p for p in db.query(Product).all()}
            inserted_count = 0
            updated_count = 0

            for item in products_data:
                barcode = item["barcode"]
                product = existing_products.get(barcode)

                score_data = calculate_sustainability_score(
                    co2_kg=float(item.get("co2_kg", 1.0)),
                    packaging_score=float(item.get("packaging_score", 50.0)),
                    origin_score=float(item.get("origin_score", 50.0)),
                    price=float(item["price"]),
                    eco_score_grade=item.get("eco_score", "c"),
                    is_fair_trade=bool(item.get("fair_trade", False)),
                    is_organic=bool(item.get("organic", False)),
                    category=item["category"],
                    category_avg_price=category_avg.get(item["category"])
                )

                if product is None:
                    new_product = Product(
                        id=item.get("id"),
                        barcode=barcode,
                        name=item["name"],
                        brand=item.get("brand"),
                        category=item["category"],
                        product_family=item.get("product_family"),
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
                        sustainability_score=score_data["sustainability_score"],
                        environmental_score=score_data["environmental_score"],
                        social_score=score_data["social_score"],
                        economic_score=score_data["economic_score"],
                        is_external=False,
                        data_quality="verified",
                        substitute_id=item.get("substitute_id"),
                        image_url=item.get("image_url")
                    )
                    db.add(new_product)
                    existing_products[barcode] = new_product
                    inserted_count += 1
                elif reload_products:
                    product.name = item["name"]
                    product.brand = item.get("brand")
                    product.category = item["category"]
                    product.product_family = item.get("product_family")
                    product.description = item.get("description")
                    product.price = float(item["price"])
                    product.unit = item.get("unit")
                    product.co2_kg = float(item.get("co2_kg", 1.0))
                    product.water_liters = float(item.get("water_liters", 500.0))
                    product.packaging_type = item.get("packaging_type")
                    product.packaging_score = float(item.get("packaging_score", 50.0))
                    product.origin = item.get("origin")
                    product.origin_score = float(item.get("origin_score", 50.0))
                    product.fair_trade = bool(item.get("fair_trade", False))
                    product.organic = bool(item.get("organic", False))
                    product.eco_score = item.get("eco_score", "c")
                    product.nutri_score = item.get("nutri_score", "c")
                    product.sustainability_score = score_data["sustainability_score"]
                    product.environmental_score = score_data["environmental_score"]
                    product.social_score = score_data["social_score"]
                    product.economic_score = score_data["economic_score"]
                    product.is_external = False
                    product.data_quality = "verified"
                    product.substitute_id = item.get("substitute_id")
                    product.image_url = item.get("image_url")
                    updated_count += 1

            db.commit()
            if inserted_count > 0 or updated_count > 0:
                logger.info(f"Products seed: {inserted_count} inserted, {updated_count} updated.")
            else:
                logger.info(f"Products seed: all {len(products_data)} seed records already present.")

        # 2. Seed Stores de forma idempotente por id
        if settings.STORES_SEED_FILE.exists():
            with open(settings.STORES_SEED_FILE, "r", encoding="utf-8") as f:
                stores_data = json.load(f)

            existing_stores = {s.id: s for s in db.query(Store).all()}
            inserted_stores = 0
            updated_stores = 0

            for item in stores_data:
                store_id = item.get("id")
                store = existing_stores.get(store_id)

                if store is None:
                    new_store = Store(
                        id=store_id,
                        name=item["name"],
                        store_type=item["store_type"],
                        address=item["address"],
                        latitude=float(item["latitude"]),
                        longitude=float(item["longitude"]),
                        rating_eco=float(item.get("rating_eco", 4.0)),
                        discount_green=float(item.get("discount_green", 0.0)),
                        description=item.get("description")
                    )
                    db.add(new_store)
                    existing_stores[store_id] = new_store
                    inserted_stores += 1
                elif reload_stores:
                    store.name = item["name"]
                    store.store_type = item["store_type"]
                    store.address = item["address"]
                    store.latitude = float(item["latitude"])
                    store.longitude = float(item["longitude"])
                    store.rating_eco = float(item.get("rating_eco", 4.0))
                    store.discount_green = float(item.get("discount_green", 0.0))
                    store.description = item.get("description")
                    updated_stores += 1

            db.commit()
            if inserted_stores > 0 or updated_stores > 0:
                logger.info(f"Stores seed: {inserted_stores} inserted, {updated_stores} updated.")
            else:
                logger.info(f"Stores seed: all {len(stores_data)} seed records already present.")

    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    reset = "--reset" in sys.argv or "-r" in sys.argv
    reload_p = "--reload-products" in sys.argv or "-p" in sys.argv
    reload_s = "--reload-stores" in sys.argv or "-s" in sys.argv
    if "--all" in sys.argv:
        reload_p = True
        reload_s = True
    init_db(reload_products=reload_p, reload_stores=reload_s, reset=reset)
