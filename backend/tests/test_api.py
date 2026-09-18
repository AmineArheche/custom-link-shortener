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

def test_bulk_shorten_links(client):
    payload = {
        "items": [
            {"original_url": "https://python.org", "custom_alias": "python-lang"},
            {"original_url": "https://react.dev", "title": "React Docs"},
            {"original_url": "https://python.org", "custom_alias": "python-lang"} # duplicate alias test
        ]
    }
    res = client.post("/api/links/bulk", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_requested"] == 3
    assert data["total_success"] == 2
    assert data["total_failed"] == 1
    assert data["results"][0]["success"] is True
    assert data["results"][2]["success"] is False

def test_list_links_filtering_and_sorting(client):
    client.post("/api/links", json={"original_url": "https://site-a.com", "title": "Alpha"})
    client.post("/api/links", json={"original_url": "https://site-b.com", "title": "Beta"})

    # Sorting
    res_asc = client.get("/api/links?sort_by=title_asc")
    assert res_asc.status_code == 200
    items = res_asc.json()["items"]
    assert len(items) >= 2

    # Status filtering
    res_active = client.get("/api/links?status_filter=active")
    assert res_active.status_code == 200

def test_export_endpoints_csv(client):
    # Create sample link
    client.post("/api/links", json={"original_url": "https://export-test.com", "custom_alias": "export-code"})

    # Export links
    res_links = client.get("/api/links/export/csv")
    assert res_links.status_code == 200
    assert "text/csv" in res_links.headers["content-type"]
    assert "export-code" in res_links.text

    # Export analytics
    res_analytics = client.get("/api/analytics/export/csv")
    assert res_analytics.status_code == 200
    assert "text/csv" in res_analytics.headers["content-type"]

def test_cleanup_expired_links(client):
    import datetime
    past_date = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).isoformat()
    client.post("/api/links", json={
        "original_url": "https://expired-site.com",
        "custom_alias": "already-expired",
        "expires_at": past_date
    })

    res = client.post("/api/links/cleanup-expired")
    assert res.status_code == 200
    assert res.json()["cleaned_count"] >= 1

