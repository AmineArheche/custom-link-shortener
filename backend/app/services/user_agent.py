from urllib.parse import urlparse
from user_agents import parse as parse_user_agent
from typing import Tuple, Dict, Any

# Map of test locations for realistic analytics visualization on local dev / demo
DEMO_GEO_MAP = [
    {"country": "United States", "city": "San Francisco"},
    {"country": "United Kingdom", "city": "London"},
    {"country": "Germany", "city": "Berlin"},
    {"country": "France", "city": "Paris"},
    {"country": "Canada", "city": "Toronto"},
    {"country": "Japan", "city": "Tokyo"},
    {"country": "Australia", "city": "Sydney"},
    {"country": "Morocco", "city": "Casablanca"},
]

def parse_request_headers(
    user_agent_str: str | None,
    referer_str: str | None,
    client_ip: str | None
) -> Dict[str, Any]:
    """
    Extracts structured analytics data (browser, OS, device, referrer domain, etc.)
    from incoming HTTP request headers.
    """
    # 1. Parse User-Agent
    browser = "Unknown"
    browser_version = ""
    os_name = "Unknown"
    device_type = "Desktop"

    if user_agent_str:
        try:
            ua = parse_user_agent(user_agent_str)
            browser = ua.browser.family or "Unknown"
            if ua.browser.version:
                browser_version = ".".join(str(v) for v in ua.browser.version[:2])
            os_name = ua.os.family or "Unknown"

            if ua.is_bot:
                device_type = "Bot"
            elif ua.is_mobile:
                device_type = "Mobile"
            elif ua.is_tablet:
                device_type = "Tablet"
            elif ua.is_pc:
                device_type = "Desktop"
            else:
                device_type = "Desktop"
        except Exception:
            pass

    # 2. Parse Referrer
    referrer = referer_str or "Direct"
    referrer_domain = "Direct"
    if referer_str and referer_str.strip():
        try:
            parsed = urlparse(referer_str)
            if parsed.netloc:
                domain = parsed.netloc.lower()
                if domain.startswith("www."):
                    domain = domain[4:]
                referrer_domain = domain
            else:
                referrer_domain = referer_str
        except Exception:
            referrer_domain = "Other"

    # 3. Geo location (Country / City)
    country = "Local / Dev"
    city = "Localhost"
    if client_ip and client_ip not in ("127.0.0.1", "::1", "localhost", "0.0.0.0"):
        # We can map IP or hash for demo display
        import hashlib
        h = int(hashlib.md5(client_ip.encode()).hexdigest(), 16)
        loc = DEMO_GEO_MAP[h % len(DEMO_GEO_MAP)]
        country = loc["country"]
        city = loc["city"]
    elif client_ip in ("127.0.0.1", "::1", "localhost"):
        country = "Local Network"
        city = "Local Host"

    return {
        "browser": browser,
        "browser_version": browser_version,
        "os": os_name,
        "device_type": device_type,
        "referrer": referrer[:500] if referrer else "Direct",
        "referrer_domain": referrer_domain[:120],
        "country": country,
        "city": city,
        "user_agent": (user_agent_str or "")[:500],
        "ip_address": client_ip,
    }
