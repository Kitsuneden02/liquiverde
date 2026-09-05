import logging
from typing import List, Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.config import settings
from app.db.models import Product
from app.algorithms.scoring import calculate_sustainability_score
from app.algorithms.substitution import infer_product_family

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
        """
        Clasifica un producto en una de las 8 categorías canónicas de LiquiVerde.
        Evita falsos positivos y devuelve exclusivamente categorías válidas del catálogo.
        """
        categories_tags = categories_tags or []
        joined_tags = " ".join(categories_tags)
        text = f" {name} {brand} {categories_raw} {joined_tags} ".lower()

        # 1. Limpieza y hogar (captura detergentes, lavalozas y artículos de aseo)
        if any(k in text for k in [
            "clean", "detergent", "soap", "jabon", "jabón", "lavaloza", "limpieza",
            "suavizante", "cloro", "desinfectante", "shampoo", "champu", "pasta dental",
            "quix", "freemet"
        ]):
            return "limpieza_y_hogar"

        # 2. Lácteos y bebidas vegetales (evaluado antes de bebidas generales)
        if any(k in text for k in [
            "milk", "dairy", "lait", "lacteo", "lácteo", "leche", "queso", "cheese",
            "fromage", "yogurt", "yogur", "plant-based milk", "bebida de avena",
            "bebida de soya", "bebida de almendra", "bebida vegetal", "vilay", "colún", "soprole"
        ]):
            return "lacteos_y_vegetales"

        # 3. Proteínas y legumbres
        if any(k in text for k in [
            "meat", "viande", "legume", "bean", "proteina", "proteína", "carne", "vacuno",
            "lenteja", "garbanzo", "poroto", "tofu", "seitan", "pollo", "chicken",
            "hamburguesa", "burger", "pescado", "fish", "atun", "atún", "jurel",
            "huevo", "huevos", "egg"
        ]):
            return "proteinas_y_legumbres"

        # 4. Panadería y snacks (panes, galletas, snacks)
        is_bakery_or_snack = any(k in text for k in [
            "pan ", "pan de", "masa madre", "marraqueta", "hallulla", "molde", "tostada",
            "bread", "galleta", "cookie", "biscuit", "frutigran", "snack", "chips",
            "barra de cereal", "alfajor"
        ])
        if is_bakery_or_snack:
            return "panaderia_y_snacks"

        # 5. Despensa y condimentos (aceites, salsas, untables, condimentos)
        is_sauce_or_spread = any(k in text for k in [
            "salsa", "pomarola", "tuco", "pesto", "nutella", "pasta de maní", "pasta de mani",
            "mantequilla de man", "avellana", "untable", "mermelada", "mayonesa", "ketchup",
            "mostaza", "aderezo", "vinagre", "condimento", "aceite", "oil", "oliva"
        ])
        if is_sauce_or_spread:
            return "despensa_y_condimentos"

        # 6. Bebidas (gaseosas, isotónicas, aguas, té, café, jugos, infusiones)
        # Asegurar que 'soda' no clasifique como bebida si es una galleta
        has_soda = "soda" in text and not any(g in text for g in ["galleta", "cookie", "biscuit", "cracker"])
        if any(k in text for k in [
            "bebid", "beverage", "drink", "boisson", "water", "agua",
            "juice", "jugo", "cola", "energy", "isotonic", "sport", "deportiv",
            "hidrat", "powerade", "gatorade", "nectar", "refresco", "infusion", "infusión",
            "cafe", "café", "coffee", "beer", "cerveza", "vino", "wine"
        ]) or has_soda or " té " in text or " te " in text:
            return "bebidas"

        # 7. Frutas y verduras (evitar tomate cuando sea salsa/pomarola)
        if any(k in text for k in [
            "fruit", "vegetable", "legume-vert", "manzana", "platano", "plátano", "banana",
            "apple", "palta", "aguacate", "naranja", "limon", "limón", "hortaliza",
            "verdura", "fruta", "arándano", "arandano", "berry", "berries", "frutilla",
            "fresa", "primavera de verdura"
        ]) or ("tomate" in text and not any(s in text for s in ["salsa", "pure", "puré", "pomarola", "pasta"])):
            return "frutas_y_verduras"

        # 8. Abarrotes y cereales (arroz, pasta, fideos, harinas, cereales, semillas)
        if any(k in text for k in [
            "rice", "arroz", "pasta", "spaghetti", "fideo", "noodle", "flour", "harina",
            "avena", "cereal", "chocapic", "chía", "chia", "semilla", "quinoa", "azucar", "azúcar"
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
        # 1. Búsqueda local (operación GET de solo lectura, sin modificar datos existentes)
        local_product = db.query(Product).filter(Product.barcode == clean_code).first()
        if local_product:
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

                        # Estimación de packaging_score a partir de los datos de empaque reportados por OFF
                        pkg_str = f"{' '.join(raw.get('packaging_tags', []))} {raw.get('packaging', '')}".lower()
                        if any(k in pkg_str for k in ["granel", "bulk", "vidrio", "glass", "verre", "carton", "cartón", "cardboard"]):
                            packaging_score = 85.0
                            packaging_type = raw.get("packaging") or "Vidrio / Cartón / Reciclable"
                        elif any(k in pkg_str for k in ["plastic", "plastique", "plástico", "plastico", "sachet", "pouch", "pet", "hdpe"]):
                            packaging_score = 35.0
                            packaging_type = raw.get("packaging") or "Envase plástico estándar"
                        else:
                            packaging_score = 55.0
                            packaging_type = raw.get("packaging") or "Empaque comercial mixto"

                        # Estimación de origin_score a partir de países y orígenes reportados
                        origin_str = f"{' '.join(raw.get('countries_tags', []))} {raw.get('origins', '')}".lower()
                        if any(c in origin_str for c in ["chile", "chili", "cl"]):
                            origin_score = 85.0
                            origin_name = raw.get("origins") or "Chile / Nacional"
                        elif any(c in origin_str for c in ["argentina", "peru", "perú", "brasil", "brazil", "mercosur", "latinoamerica"]):
                            origin_score = 65.0
                            origin_name = raw.get("origins") or "Sudamérica / Regional"
                        else:
                            origin_score = 40.0
                            origin_name = raw.get("origins") or "Importado / Internacional"

                        # Estimación de CO2: usar Agribalyse si está disponible, o inferir por eco-score grade
                        agribalyse_co2 = raw.get("ecoscore_data", {}).get("agribalyse", {}).get("co2_total")
                        if agribalyse_co2 is not None and float(agribalyse_co2) > 0:
                            co2_est = round(float(agribalyse_co2), 2)
                        else:
                            if eco_grade == "a":
                                co2_est = 0.6
                            elif eco_grade == "b":
                                co2_est = 1.3
                            elif eco_grade == "c":
                                co2_est = 2.0
                            elif eco_grade == "d":
                                co2_est = 3.5
                            else:
                                co2_est = 5.0

                        # Precio estimado según la línea base promedio de la categoría en el catálogo existente
                        from app.algorithms.scoring import calculate_category_baseline
                        cat_prods = db.query(Product).filter(Product.category == category).all()
                        if cat_prods:
                            cat_baseline = calculate_category_baseline(cat_prods)
                            estimated_price = cat_baseline["avg_price"]
                        else:
                            estimated_price = 1990.0

                        # Inferencia de familia de producto
                        temp_obj = Product(name=name, category=category)
                        product_family = infer_product_family(temp_obj)


                        score_calc = calculate_sustainability_score(
                            co2_kg=co2_est,
                            packaging_score=packaging_score,
                            origin_score=origin_score,
                            price=estimated_price,
                            eco_score_grade=eco_grade,
                            category=category,
                            category_avg_price=estimated_price
                        )

                        new_product = Product(
                            barcode=clean_code,
                            name=name[:250],
                            brand=brand[:100],
                            category=category,
                            product_family=product_family,
                            description=raw.get("ingredients_text_es") or raw.get("ingredients_text") or "Obtenido en tiempo real desde Open Food Facts.",
                            price=estimated_price,
                            unit="Unidad",
                            co2_kg=co2_est,
                            water_liters=600.0,
                            packaging_type=packaging_type,
                            packaging_score=packaging_score,
                            origin=origin_name,
                            origin_score=origin_score,
                            fair_trade=False,
                            organic="bio" in raw.get("labels_tags", []) or "organic" in raw.get("labels_tags", []),
                            eco_score=eco_grade if eco_grade in ["a", "b", "c", "d", "e"] else "c",
                            nutri_score=nutri_grade if nutri_grade in ["a", "b", "c", "d", "e"] else "c",
                            sustainability_score=score_calc["sustainability_score"],
                            environmental_score=score_calc["environmental_score"],
                            social_score=score_calc["social_score"],
                            economic_score=score_calc["economic_score"],
                            is_external=True,
                            data_quality="estimated",
                            image_url=image
                        )
                        db.add(new_product)
                        db.commit()
                        db.refresh(new_product)
                        logger.info(f"Ingested external product {clean_code} from Open Food Facts with estimated data quality.")
                        return new_product

        except Exception as exc:
            logger.warning(f"Error fetching product {clean_code} from Open Food Facts: {exc}")

        return None
