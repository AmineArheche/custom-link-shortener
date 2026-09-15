import secrets
import string
import socket
import ipaddress
import urllib.parse
import httpx
import re
from typing import Optional
from sqlalchemy.orm import Session
from app.models import ShortLink
from app.config import settings

BASE62_ALPHABET = string.digits + string.ascii_letters

def generate_random_code(length: int = 6) -> str:
    """Generate a cryptographically secure random alphanumeric short code."""
    return "".join(secrets.choice(BASE62_ALPHABET) for _ in range(length))

def generate_unique_short_code(db: Session, length: int = 6, max_attempts: int = 10) -> str:
    """Generate a unique short code that does not collide with existing records."""
    for _ in range(max_attempts):
        code = generate_random_code(length)
        existing = db.query(ShortLink).filter(ShortLink.short_code == code).first()
        if not existing:
            return code
    return generate_random_code(length + 2)

def is_safe_target_ip(ip_str: str) -> bool:
    """
    Validates that a resolved IP address is not private, loopback, link-local,
    multicast, or cloud metadata reserved IP (SSRF mitigation).
    """
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            return False
        # Specific check for AWS/GCP/Azure link-local metadata (169.254.169.254)
        if str(ip_obj) == "169.254.169.254":
            return False
        return True
    except ValueError:
        return False

def validate_url_for_ssrf(url: str) -> bool:
    """
    Parses destination URL and resolves hostname via DNS to ensure it does not
    target loopback or internal private network infrastructure.
    """
    try:
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Reject common localhost aliases directly
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "metadata.google.internal"):
            return False

        # Resolve DNS to all associated IP addresses
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        if not addr_info:
            return False

        for item in addr_info:
            sockaddr = item[4]
            ip = sockaddr[0]
            if not is_safe_target_ip(ip):
                return False

        return True
    except Exception:
        return False

async def fetch_page_title(url: str) -> Optional[str]:
    """
    Safely attempts to fetch HTML <title> of the target URL with:
    - Pre-request SSRF validation (DNS & IP range checking)
    - Strict connection & read timeouts (2.5 seconds)
    - Response size limit (64 KB) to protect against decompression bombs / huge payloads
    """
    if not validate_url_for_ssrf(url):
        return None

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraLink/1.0",
            "Accept": "text/html,application/xhtml+xml",
        }
        # Max 64KB read limit
        max_bytes = 65536
        content_chunks = []
        total_read = 0

        timeout = httpx.Timeout(2.5, connect=2.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=True) as client:
            async with client.stream("GET", url, headers=headers) as response:
                if response.status_code != 200:
                    return None

                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type and "xhtml" not in content_type:
                    return None

                async for chunk in response.aiter_bytes():
                    content_chunks.append(chunk)
                    total_read += len(chunk)
                    if total_read >= max_bytes:
                        break

        html_text = b"".join(content_chunks).decode("utf-8", errors="ignore")
        match = re.search(r"<title>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
        if match:
            title = match.group(1).strip()
            title = re.sub(r"\s+", " ", title)
            return title[:200] if title else None
    except Exception:
        pass
    return None
