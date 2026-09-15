import pytest
from pydantic import ValidationError
from app.schemas import ShortenRequest, ShortenUpdate
from app.services.shortener import validate_url_for_ssrf, is_safe_target_ip

# ----------------- 1. SSRF PREVENTION TESTS ----------------- #

def test_ssrf_rejects_loopback_and_private_ips():
    # Loopback IP
    assert is_safe_target_ip("127.0.0.1") is False
    assert is_safe_target_ip("127.0.0.2") is False
    assert is_safe_target_ip("::1") is False

    # Private RFC 1918 ranges
    assert is_safe_target_ip("10.0.0.1") is False
    assert is_safe_target_ip("172.16.0.1") is False
    assert is_safe_target_ip("192.168.1.1") is False

    # Cloud link-local metadata IP (AWS/GCP/Azure)
    assert is_safe_target_ip("169.254.169.254") is False

    # Multicast & Broadcast
    assert is_safe_target_ip("224.0.0.1") is False
    assert is_safe_target_ip("255.255.255.255") is False

    # Public safe IP
    assert is_safe_target_ip("8.8.8.8") is True
    assert is_safe_target_ip("1.1.1.1") is True

def test_ssrf_rejects_internal_domains():
    assert validate_url_for_ssrf("http://localhost:8000/api/links") is False
    assert validate_url_for_ssrf("http://127.0.0.1:5432") is False
    assert validate_url_for_ssrf("http://169.254.169.254/latest/meta-data") is False
    assert validate_url_for_ssrf("http://metadata.google.internal") is False

# ----------------- 2. PROTOCOL & SCHEME VALIDATION TESTS ----------------- #

def test_scheme_validation_blocks_unsafe_protocols():
    # JavaScript scheme
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="javascript:alert(document.cookie)")

    # Local file protocol
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="file:///etc/passwd")

    # Data URI scheme
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")

    # FTP protocol
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="ftp://ftp.example.com/file.zip")

    # VBScript protocol
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="vbscript:msgbox(1)")

# ----------------- 3. CRLF / HEADER INJECTION TESTS ----------------- #

def test_crlf_and_control_character_injection_blocked():
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="https://example.com\r\nSet-Cookie:admin=1")

    with pytest.raises(ValidationError):
        ShortenRequest(original_url="https://example.com\nLocation:https://evil.com")

    with pytest.raises(ValidationError):
        ShortenRequest(original_url="https://example.com\t/path")

# ----------------- 4. CREDENTIALS & XSS CHARACTERS IN URL ----------------- #

def test_embedded_credentials_and_tags_rejected():
    # Embedded credentials
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="https://admin:password123@target.com")

    # Raw HTML tags in URL
    with pytest.raises(ValidationError):
        ShortenRequest(original_url="https://example.com/<script>alert(1)</script>")

# ----------------- 5. CUSTOM ALIAS SECURITY CONSTRAINTS ----------------- #

def test_reserved_keywords_rejected_for_alias():
    reserved = ["api", "admin", "docs", "redoc", "health", "analytics", "r", "login"]
    for keyword in reserved:
        with pytest.raises(ValidationError):
            ShortenRequest(original_url="https://example.com", custom_alias=keyword)

def test_alias_special_characters_blocked():
    invalid_aliases = ["alias/slash", "alias space", "alias#hash", "alias?query", "<script>"]
    for alias in invalid_aliases:
        with pytest.raises(ValidationError):
            ShortenRequest(original_url="https://example.com", custom_alias=alias)

# ----------------- 6. HTTP SECURITY HEADERS TESTS ----------------- #

def test_security_headers_present_on_responses(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert response.headers.get("x-xss-protection") == "1; mode=block"

# ----------------- 7. SQL WILDCARD SEARCH SAFETY TESTS ----------------- #

def test_sql_wildcard_search_safety(client):
    # Create sample link
    client.post("/api/links", json={"original_url": "https://example.com/search-test", "title": "Test 100% Guaranteed"})
    
    # Test queries with raw %, _, and \ characters
    res1 = client.get("/api/links?query=%25")
    assert res1.status_code == 200

    res2 = client.get("/api/links?query=_")
    assert res2.status_code == 200

    res3 = client.get("/api/links?query=\\")
    assert res3.status_code == 200
