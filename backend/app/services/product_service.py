import logging
from typing import List, Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.db.models import Product
from app.algorithms.scoring import calculate_sustainability_score

logger = logging.getLogger("liquiverde.product_service")

class ProductService:
    @staticmethod
    def get_products(
        db: Session,
        query: Optional[str] = None,
        category: Optional[str] = None,
        eco_score: Optional[str] = None,
        max_price: Optional[float] = None,
        only_organic: bool = False,
        only_fair_trade: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        q = db.query(Product)

        if query:
            search_term = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.barcode.ilike(search_term)
                )
            )

        if category:
            q = q.filter(Product.category == category)

        if eco_score:
            q = q.filter(Product.eco_score.ilike(eco_score.strip()))

        if max_price is not None and max_price > 0:
            q = q.filter(Product.price <= max_price)

        if only_organic:
            q = q.filter(Product.organic.is_(True))

        if only_fair_trade:
            q = q.filter(Product.fair_trade.is_(True))

        return q.offset(skip).limit(limit).all()

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_categories(db: Session) -> List[str]:
        results = db.query(Product.category).distinct().all()
        return sorted([r[0] for r in results if r[0]])


    @staticmethod
    def classify_product(name: str, brand: str, categories_tags: list, categories_raw: str = "") -> str:
        text = f"{name} {brand} {categories_raw} {' '.join(categories_tags)}".lower()

        # 1. Limpieza y hogar (primero para capturar detergentes y jabones)
        if any(k in text for k in [
            "clean", "detergent", "soap", "jabon", "jabón", "lavaloza", "limpieza",
            "suavizante", "cloro", "desinfectante", "shampoo", "champu", "pasta dental"
        ]):
            return "limpieza_y_hogar"

        # 2. Bebidas (gaseosas, isotónicas, jugos, aguas, té, café, etc.)
        if any(k in text for k in [
            "bebid", "beverage", "drink", "boisson", "water", "agua",
            "juice", "jugo", "soda", "cola", "energy", "isotonic", "sport", "deportiv",
            "hidrat", "powerade", "gatorade", "nectar", "refresco", "infusion", "infusión",
            "cafe", "café", "coffee", "beer", "cerveza", "vino", "wine"
        ]) or " té " in f" {text} ":
            return "bebidas"

        # 3. Lácteos y bebidas vegetales
        if any(k in text for k in [
            "milk", "dairy", "lait", "lacteo", "lácteo", "leche", "queso", "cheese",
            "fromage", "yogurt", "yogur", "plant-based milk"
        ]):
            return "lacteos_y_vegetales"

        # 4. Proteínas y legumbres
        if any(k in text for k in [
            "meat", "viande", "legume", "bean", "proteina", "proteína", "carne", "vacuno",
            "lenteja", "garbanzo", "poroto", "tofu", "seitan", "pollo", "chicken",
            "hamburguesa", "burger", "pescado", "fish", "atun", "atún"
        ]):
            return "proteinas_y_legumbres"

        # 5. Frutas y verduras
        if any(k in text for k in [
            "fruit", "vegetable", "legume-vert", "manzana", "platano", "plátano", "banana",
            "apple", "tomate", "verdura", "fruta", "palta", "aguacate", "naranja", "limon",
            "limón", "hortaliza"
        ]):
            return "frutas_y_verduras"

        # 6. Desayuno y snacks
        if any(k in text for k in [
            "breakfast", "snack", "cookie", "galleta", "chocolate", "nutella",
            "mantequilla de man", "peanut", "mani", "maní", "barra", "chips", "dulce", "mermelada"
        ]):
            return "desayuno_y_snacks"

        # 7. Abarrotes y cereales
        if any(k in text for k in [
            "rice", "arroz", "pasta", "spaghetti", "fideo", "noodle", "flour", "harina",
            "aceite", "oil", "vinagre", "sal", "azucar", "azúcar", "avena", "cereal"
        ]):
            return "abarrotes_y_cereales"

        return "abarrotes_y_cereales"

    @staticmethod
    async def get_by_barcode(db: Session, barcode: str) -> Optional[Product]:
        """
        Busca primero en la base de datos local.
        Si no existe, consulta la API de Open Food Facts en vivo.
        Si se encuentra en OFF, se procesa, se calcula su score y se persiste localmente en SQLite.
        """
        clean_code = barcode.strip()
        # 1. Búsqueda local
        local_product = db.query(Product).filter(Product.barcode == clean_code).first()
        if local_product:
            # Auto-corregir categoría si era un producto previamente mal categorizado
            corrected_cat = ProductService.classify_product(
                local_product.name, local_product.brand or "", [], local_product.category or ""
            )
            if corrected_cat != local_product.category:
                local_product.category = corrected_cat
                db.commit()
                db.refresh(local_product)
            return local_product

        # 2. Consulta asíncrona a Open Food Facts
        off_url = f"https://world.openfoodfacts.org/api/v0/product/{clean_code}.json"
        headers = {"User-Agent": settings.OFF_USER_AGENT}

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(off_url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == 1 and "product" in data:
                        raw = data["product"]
                        name = raw.get("product_name") or raw.get("generic_name") or f"Producto {clean_code}"
                        brand = raw.get("brands") or "Marca General"
                        eco_grade = (raw.get("ecoscore_grade") or "c").lower()
                        nutri_grade = (raw.get("nutriscore_grade") or "c").lower()
                        image = raw.get("image_url") or raw.get("image_front_url")

                        # Categorización inteligente
                        categories_tags = raw.get("categories_tags", [])
                        categories_raw = raw.get("categories", "")
                        category = ProductService.classify_product(name, brand, categories_tags, categories_raw)

                        # Estimación de métricas de sostenibilidad
                        co2_est = 2.0
                        if eco_grade == "a":
                            co2_est = 0.6
                        elif eco_grade == "b":
                            co2_est = 1.3
                        elif eco_grade in ["d", "e"]:
                            co2_est = 4.5

                        score_calc = calculate_sustainability_score(
                            co2_kg=co2_est,
                            packaging_score=60.0,
                            origin_score=65.0,
                            price=1990.0,
                            eco_score_grade=eco_grade,
                            category=category
                        )

                        new_product = Product(
                            barcode=clean_code,
                            name=name[:250],
                            brand=brand[:100],
                            category=category,
                            description=raw.get("ingredients_text_es") or raw.get("ingredients_text") or "Obtenido en tiempo real desde Open Food Facts.",
                            price=1990.0,  # Precio estimado CLP de referencia
                            unit="Unidad",
                            co2_kg=co2_est,
                            water_liters=600.0,
                            packaging_type=raw.get("packaging", "Empaque comercial estándar"),
                            packaging_score=60.0,
                            origin=raw.get("origins", "Chile / Distribución"),
                            origin_score=65.0,
                            fair_trade=False,
                            organic="bio" in raw.get("labels_tags", []) or "organic" in raw.get("labels_tags", []),
                            eco_score=eco_grade if eco_grade in ["a", "b", "c", "d", "e"] else "c",
                            nutri_score=nutri_grade if nutri_grade in ["a", "b", "c", "d", "e"] else "c",
                            sustainability_score=score_calc["sustainability_score"],
                            image_url=image
                        )
                        db.add(new_product)
                        db.commit()
                        db.refresh(new_product)
                        logger.info(f"Ingested external product {clean_code} from Open Food Facts.")
                        return new_product

        except Exception as exc:
            logger.warning(f"Error fetching product {clean_code} from Open Food Facts: {exc}")

        return None
