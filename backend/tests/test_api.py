from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_suggest_endpoint():
    resp = client.post("/suggest", json={"name": "Chicken Biryani"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["category"] == "Biryani & Rice"
    assert body["type"] == "non-veg"


def test_autocomplete_endpoint():
    resp = client.get("/autocomplete", params={"q": "Chicken Bir"})
    assert resp.status_code == 200
    assert any(row["name"] == "Chicken Biryani" for row in resp.json())


def test_bulk_text_endpoint():
    resp = client.post("/bulk/text", json={"text": "Chicken Biryani - 249\nMasala Dosa 120"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["ready_count"] == 2
    assert body["rows"][0]["suggestion"]["category"] == "Biryani & Rice"


def test_feedback_then_suggest_uses_learned_override():
    correction = {"type": "veg", "category": "Regional Specials", "subcategory": "Thali", "gst": 5, "source": "manual", "confidence": 1.0}
    resp = client.post("/feedback", json={"restaurant_id": "resto-42", "name": "Sadya", "corrected": correction})
    assert resp.status_code == 204

    resp = client.post("/suggest", json={"name": "Sadya", "restaurant_id": "resto-42"})
    body = resp.json()
    assert body["source"] == "learned"
    assert body["category"] == "Regional Specials"

    # A different restaurant never sees another restaurant's correction.
    resp = client.post("/suggest", json={"name": "Sadya", "restaurant_id": "some-other-restaurant"})
    assert resp.json()["source"] != "learned"


def test_duplicate_check_endpoint():
    resp = client.post("/duplicates/check", json={"name": "Chicken Biryani (Full)", "existing_item_names": ["Chicken Biryani"]})
    assert resp.status_code == 200
    assert resp.json()[0]["existing_item_name"] == "Chicken Biryani"


def test_price_check_endpoint():
    resp = client.post("/pricing/check", json={"category": "Biryani & Rice", "price": 5})
    body = resp.json()
    assert body["is_outlier"] is True
