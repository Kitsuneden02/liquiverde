import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_health():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "LiquiVerde API"


def test_get_products():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0
    assert "barcode" in products[0]
    assert "sustainability_score" in products[0]


def test_search_products_filter():
    response = client.get("/api/products?q=Leche")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert any("Leche" in p["name"] for p in products)


def test_get_categories():
    response = client.get("/api/products/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert "lacteos_y_vegetales" in categories


def test_get_by_barcode():
    barcode = "7802900001308"
    response = client.get(f"/api/products/barcode/{barcode}")
    assert response.status_code == 200
    data = response.json()
    assert data["barcode"] == barcode
    assert "Leche" in data["name"]


def test_optimize_knapsack_api():
    payload = {
        "budget": 6000.0,
        "sustainability_weight": 0.5,
        "mandatory_product_ids": []
    }
    response = client.post("/api/optimize/knapsack", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "selected_products" in data
    assert data["total_cost"] <= 6000.0
    assert data["budget_remaining"] >= 0.0
    assert data["co2_avoided_kg"] >= 0.0


def test_get_substitutes_api():
    product_id = 1  # Leche tradicional con plástico
    response = client.get(f"/api/substitutes/{product_id}")
    assert response.status_code == 200
    subs = response.json()
    assert isinstance(subs, list)
    assert len(subs) > 0
    first_sub = subs[0]
    assert "recommended_product" in first_sub
    assert "price_difference_clp" in first_sub
    assert "co2_reduction_kg" in first_sub
    assert "recommendation_reason" in first_sub


def test_get_stores_api():
    response = client.get("/api/stores")
    assert response.status_code == 200
    stores = response.json()
    assert len(stores) >= 5
    assert "latitude" in stores[0]
    assert "longitude" in stores[0]


def test_get_impact_summary_api():
    response = client.get("/api/impact/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_catalog_products" in data
    assert "trees_equivalent_annual" in data
    assert "potential_basket_co2_savings_kg" in data
