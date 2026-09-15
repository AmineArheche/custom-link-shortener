import pytest

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_short_link_auto_code(client):
    payload = {
        "original_url": "https://example.com/very/long/url",
        "title": "Example Test Page",
        "tags": ["test", "example"]
    }
    response = client.post("/api/links", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["original_url"] == "https://example.com/very/long/url"
    assert len(data["short_code"]) == 6
    assert data["clicks_count"] == 0
    assert "test" in data["tags"]

def test_create_custom_alias(client):
    payload = {
        "original_url": "https://fastapi.tiangolo.com",
        "custom_alias": "fastapi-docs",
        "title": "FastAPI Docs"
    }
    response = client.post("/api/links", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["short_code"] == "fastapi-docs"

    # Test duplicate alias rejection (409 Conflict)
    duplicate_res = client.post("/api/links", json=payload)
    assert duplicate_res.status_code == 409

def test_redirect_and_click_tracking(client):
    # Create link first
    client.post("/api/links", json={
        "original_url": "https://fastapi.tiangolo.com",
        "custom_alias": "fastapi-docs"
    })

    # Perform redirect request with simulated headers
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://twitter.com/mypost"
    }
    redirect_res = client.get("/r/fastapi-docs", headers=headers, follow_redirects=False)
    assert redirect_res.status_code == 307
    assert redirect_res.headers["location"] == "https://fastapi.tiangolo.com"

    # Verify analytics updated
    analytics_res = client.get("/api/analytics/links/fastapi-docs")
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_clicks"] >= 1
    assert any(b["name"] == "Chrome" for b in data["browsers"])

def test_simulate_clicks(client):
    # Create link first
    client.post("/api/links", json={
        "original_url": "https://fastapi.tiangolo.com",
        "custom_alias": "fastapi-docs"
    })

    res = client.post("/api/analytics/simulate", json={"short_code": "fastapi-docs", "count": 5})
    assert res.status_code == 200
    assert res.json()["total_clicks"] == 5
