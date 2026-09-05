import json
import pytest
from app.core.config import settings
from app.services.product_service import ProductService
from app.db.models import Product
from app.db.init_db import init_db


def test_classify_product_all_seed_products():
    """
    Verifica que classify_product sobre los 40 productos del seed
    clasifique exactamente en la categoría asignada en el dataset oficial.
    """
    assert settings.PRODUCTS_SEED_FILE.exists()
    with open(settings.PRODUCTS_SEED_FILE, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    for p in products_data:
        classified = ProductService.classify_product(
            name=p["name"],
            brand=p.get("brand") or "",
            categories_tags=[],
            categories_raw=""
        )
        assert classified == p["category"], (
            f"Producto ID {p['id']} '{p['name']}' clasificado como '{classified}', "
            f"se esperaba '{p['category']}'"
        )


def test_get_by_barcode_does_not_mutate_category(client, db_session):
    """
    Verifica que un GET /api/products/barcode/{barcode} sea de solo lectura
    y no altere la categoría de los productos existentes en la base de datos.
    """
    # 7802230086648 corresponde a 'Galletas de Soda Clásica McKay' (panaderia_y_snacks)
    barcode = "7802230086648"
    product_before = db_session.query(Product).filter(Product.barcode == barcode).first()
    assert product_before is not None
    original_category = product_before.category
    assert original_category == "panaderia_y_snacks"

    # Realizar petición GET al endpoint
    response = client.get(f"/api/products/barcode/{barcode}")
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "panaderia_y_snacks"

    # Verificar directamente en la base de datos tras la petición
    db_session.expire_all()
    product_after = db_session.query(Product).filter(Product.barcode == barcode).first()
    assert product_after.category == original_category


def test_init_db_preserves_external_off_products(db_session):
    """
    Verifica que el proceso de seed sea idempotente y nunca elimine productos
    ingresados externamente (por ejemplo desde Open Food Facts) en reinicios.
    """
    # 1. Verificar conteo base de seed (40 productos)
    seed_count = db_session.query(Product).count()
    assert seed_count >= 40

    # 2. Insertar un producto simulado de Open Food Facts
    test_off_barcode = "5449000000996"
    existing_off = db_session.query(Product).filter(Product.barcode == test_off_barcode).first()
    if not existing_off:
        extra_product = Product(
            barcode=test_off_barcode,
            name="Coca-Cola Zero Azúcar OFF Test",
            brand="Coca-Cola",
            category="bebidas",
            price=1990.0,
            co2_kg=1.8,
            water_liters=600.0,
            packaging_type="Botella Plástica PET",
            packaging_score=60.0,
            origin="Chile",
            origin_score=65.0,
            fair_trade=False,
            organic=False,
            eco_score="b",
            nutri_score="b",
            sustainability_score=68.0,
            is_external=True,
            data_quality="estimated",
            product_family="bebidas_azucaradas"
        )
        db_session.add(extra_product)
        db_session.commit()


    total_with_off = db_session.query(Product).count()
    assert total_with_off == seed_count + (1 if not existing_off else 0)

    # 3. Ejecutar init_db nuevamente (simulando un reinicio de la app)
    init_db(db=db_session, reload_products=False, reload_stores=False)

    # 4. Verificar que el producto externo sigue existiendo y el total no disminuyó a 40
    persisted_off = db_session.query(Product).filter(Product.barcode == test_off_barcode).first()
    assert persisted_off is not None
    assert persisted_off.name == "Coca-Cola Zero Azúcar OFF Test"
    assert db_session.query(Product).count() == total_with_off


def test_acceptance_criteria_1_1(client):
    """
    Criterios de aceptación 1.1:
    - GET /api/substitutes/23 sigue devolviendo el id 34 después de escanear 7802230086648.
    - GET /api/products/categories sigue devolviendo exactamente las 8 categorías del seed tras escanear los 40 códigos.
    """
    from app.core.categories import CANONICAL_CATEGORIES

    with open(settings.PRODUCTS_SEED_FILE, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    # 1. Escanear Galletas de Soda (7802230086648)
    scan_res = client.get("/api/products/barcode/7802230086648")
    assert scan_res.status_code == 200

    # 2. GET /api/substitutes/23 sigue devolviendo el id 34
    sub_res = client.get("/api/substitutes/23")
    assert sub_res.status_code == 200
    subs = sub_res.json()
    sub_ids = [s["recommended_product"]["id"] for s in subs]
    assert 34 in sub_ids

    # 3. Escanear todos los 40 códigos de barra del seed
    for item in products_data:
        res = client.get(f"/api/products/barcode/{item['barcode']}")
        assert res.status_code == 200

    # 4. GET /api/products/categories sigue devolviendo exactamente las 8 categorías del seed
    cat_res = client.get("/api/products/categories")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert sorted(categories) == sorted(CANONICAL_CATEGORIES)
