import datetime
import html
import re
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, BackgroundTasks, Query
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app.config import settings
from app.database import engine, Base, get_db
from app.models import ShortLink, ClickEvent, utcnow
from app.schemas import (
    ShortenRequest,
    ShortenUpdate,
    ShortLinkResponse,
    AnalyticsOverview,
    LinkDetailedAnalytics,
    SimulateClickRequest
)
from app.services.shortener import generate_unique_short_code, fetch_page_title
from app.services.user_agent import parse_request_headers
from app.services.analytics import get_analytics_overview, get_link_detailed_analytics

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="High-performance URL Shortener with real-time browser, device, and referrer analytics",
    version="1.0.0"
)

# 1. Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 2. CORS Middleware with Explicit Origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def format_link_response(link: ShortLink, base_url: str = settings.BASE_URL) -> dict:
    d = link.to_dict()
    d["short_url"] = f"{base_url}/r/{link.short_code}"
    return d

def escape_like_pattern(pattern: str) -> str:
    """Escapes SQL LIKE wildcards (% and _) to prevent wildcard DoS and unintended matching."""
    return re.sub(r'([%_\\])', r'\\\1', pattern)

def log_click_to_db(
    db: Session,
    link: ShortLink,
    user_agent_str: str | None,
    referer_str: str | None,
    client_ip: str | None,
    timestamp: datetime.datetime | None = None
):
    """Synchronously record a click event and increment link click count."""
    try:
        parsed_data = parse_request_headers(user_agent_str, referer_str, client_ip)
        click = ClickEvent(
            link_id=link.id,
            timestamp=timestamp or utcnow(),
            browser=parsed_data["browser"],
            browser_version=parsed_data["browser_version"],
            os=parsed_data["os"],
            device_type=parsed_data["device_type"],
            referrer=parsed_data["referrer"],
            referrer_domain=parsed_data["referrer_domain"],
            country=parsed_data["country"],
            city=parsed_data["city"],
            user_agent=parsed_data["user_agent"],
            ip_address=parsed_data["ip_address"]
        )
        db.add(click)
        link.clicks_count = (link.clicks_count or 0) + 1
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging click event: {e}")

# ----------------- API ENDPOINTS ----------------- #

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": utcnow().isoformat()}

@app.post("/api/links", status_code=status.HTTP_201_CREATED)
async def create_short_link(
    payload: ShortenRequest,
    db: Session = Depends(get_db)
):
    """Creates a new shortened URL with optional custom alias and expiration."""
    # Check custom alias if provided
    short_code = payload.custom_alias
    if short_code:
        existing = db.query(ShortLink).filter(ShortLink.short_code == short_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"The alias '{html.escape(short_code)}' is already taken. Please choose another one."
            )
    else:
        short_code = generate_unique_short_code(db, length=settings.SHORT_CODE_LENGTH)

    # Scrape title if not provided (with safe SSRF defense built in)
    title = payload.title
    if not title:
        title = await fetch_page_title(payload.original_url)

    tags_str = ",".join(payload.tags) if payload.tags else ""

    short_link = ShortLink(
        original_url=payload.original_url,
        short_code=short_code,
        title=title or payload.original_url,
        tags=tags_str,
        expires_at=payload.expires_at,
        is_active=True,
        clicks_count=0
    )
    db.add(short_link)
    db.commit()
    db.refresh(short_link)

    return format_link_response(short_link)

@app.get("/api/links")
def list_links(
    query: Optional[str] = Query(None, description="Search by title, code, or URL", max_length=100),
    tag: Optional[str] = Query(None, description="Filter by tag", max_length=50),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists shortened links with search and tag filtering (sanitized against wildcard DoS)."""
    q = db.query(ShortLink)
    if query:
        escaped_query = escape_like_pattern(query.strip())
        term = f"%{escaped_query}%"
        q = q.filter(
            (ShortLink.title.ilike(term, escape='\\')) |
            (ShortLink.short_code.ilike(term, escape='\\')) |
            (ShortLink.original_url.ilike(term, escape='\\'))
        )
    if tag:
        escaped_tag = escape_like_pattern(tag.strip())
        q = q.filter(ShortLink.tags.ilike(f"%{escaped_tag}%", escape='\\'))

    total = q.count()
    links = q.order_by(ShortLink.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [format_link_response(link) for link in links]
    }

@app.get("/api/links/{id_or_code}")
def get_link(id_or_code: str, db: Session = Depends(get_db)):
    """Fetches a specific shortened link by ID or short code."""
    if id_or_code.isdigit():
        link = db.query(ShortLink).filter(ShortLink.id == int(id_or_code)).first()
    else:
        link = db.query(ShortLink).filter(ShortLink.short_code == id_or_code.lower()).first()

    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")
    return format_link_response(link)

@app.patch("/api/links/{link_id}")
def update_link(link_id: int, payload: ShortenUpdate, db: Session = Depends(get_db)):
    """Updates an existing short link's metadata or status."""
    link = db.query(ShortLink).filter(ShortLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")

    if payload.title is not None:
        link.title = payload.title
    if payload.is_active is not None:
        link.is_active = payload.is_active
    if payload.expires_at is not None:
        link.expires_at = payload.expires_at
    if payload.tags is not None:
        link.tags = ",".join(payload.tags)

    db.commit()
    db.refresh(link)
    return format_link_response(link)

@app.delete("/api/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(link_id: int, db: Session = Depends(get_db)):
    """Deletes a short link and its click history."""
    link = db.query(ShortLink).filter(ShortLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")
    db.delete(link)
    db.commit()
    return None

# ----------------- ANALYTICS ENDPOINTS ----------------- #

@app.get("/api/analytics/overview")
def get_overview(db: Session = Depends(get_db)):
    """Returns aggregated global analytics across all links."""
    return get_analytics_overview(db)

@app.get("/api/analytics/links/{id_or_code}")
def get_link_analytics(id_or_code: str, db: Session = Depends(get_db)):
    """Returns detailed analytics breakdown for a single link."""
    if id_or_code.isdigit():
        link = db.query(ShortLink).filter(ShortLink.id == int(id_or_code)).first()
    else:
        link = db.query(ShortLink).filter(ShortLink.short_code == id_or_code.lower()).first()

    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")

    data = get_link_detailed_analytics(db, link)
    data["link"] = format_link_response(link)
    return data

@app.post("/api/analytics/simulate")
def simulate_traffic(
    payload: SimulateClickRequest,
    db: Session = Depends(get_db)
):
    """Simulates realistic traffic clicks for testing and demoing analytics."""
    import random
    if payload.link_id:
        link = db.query(ShortLink).filter(ShortLink.id == payload.link_id).first()
    elif payload.short_code:
        link = db.query(ShortLink).filter(ShortLink.short_code == payload.short_code.lower()).first()
    else:
        link = db.query(ShortLink).first()

    if not link:
        raise HTTPException(status_code=404, detail="No short link found to simulate clicks for")

    browsers = ["Chrome", "Safari", "Firefox", "Edge", "Opera"]
    operating_systems = ["Windows", "macOS", "iOS", "Android", "Linux"]
    devices = ["Desktop", "Mobile", "Tablet"]
    referrers = ["https://twitter.com/post", "https://github.com/project", "https://news.ycombinator.com", "https://linkedin.com/feed", "https://reddit.com/r/programming", "Direct"]
    cities = [("New York", "United States"), ("London", "United Kingdom"), ("Tokyo", "Japan"), ("Paris", "France"), ("Berlin", "Germany"), ("Toronto", "Canada"), ("Casablanca", "Morocco"), ("Sydney", "Australia")]

    now = utcnow()

    for _ in range(payload.count):
        b = payload.browser or random.choice(browsers)
        os_name = payload.os or random.choice(operating_systems)
        dev = payload.device_type or ("Mobile" if os_name in ["iOS", "Android"] else random.choice(devices))
        ref = payload.referrer or random.choice(referrers)
        ref_domain = "Direct"
        if ref != "Direct":
            from urllib.parse import urlparse
            ref_domain = urlparse(ref).netloc or ref

        city, country = random.choice(cities)
        if payload.country:
            country = payload.country

        random_minutes = random.randint(0, 6 * 24 * 60)
        click_time = now - datetime.timedelta(minutes=random_minutes)

        click = ClickEvent(
            link_id=link.id,
            timestamp=click_time,
            browser=b,
            browser_version=f"{random.randint(110, 126)}.0",
            os=os_name,
            device_type=dev,
            referrer=ref,
            referrer_domain=ref_domain,
            country=country,
            city=city,
            user_agent=f"Mozilla/5.0 ({os_name}) AppleWebKit/537.36 {b}",
            ip_address=f"{random.randint(20, 200)}.{random.randint(10, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
        )
        db.add(click)
        link.clicks_count = (link.clicks_count or 0) + 1

    db.commit()
    return {"message": f"Successfully simulated {payload.count} clicks for '{link.short_code}'", "total_clicks": link.clicks_count}

# ----------------- REDIRECTION ENGINE ----------------- #

@app.get("/r/{short_code}")
@app.get("/{short_code}")
def redirect_short_url(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    High-speed redirection route.
    Captures visitor User-Agent, Referrer, and IP and logs click before returning HTTP 307 Redirect.
    """
    safe_code = short_code.strip().lower()

    # Exclude reserved paths
    if safe_code in ["favicon.ico", "robots.txt", "api", "docs", "redoc", "openapi.json", "health"]:
        raise HTTPException(status_code=404, detail="Not found")

    link = db.query(ShortLink).filter(ShortLink.short_code == safe_code).first()
    if not link:
        escaped_display = html.escape(short_code[:30])
        return HTMLResponse(
            status_code=404,
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Link Not Found - AuraLink</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                    .card {{ background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center; max-width: 420px; backdrop-filter: blur(12px); }}
                    h1 {{ color: #f43f5e; font-size: 24px; margin-bottom: 8px; }}
                    p {{ color: #9ca3af; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }}
                    a {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>404 - Link Not Found</h1>
                    <p>The shortened link '<code>{escaped_display}</code>' does not exist or has been removed.</p>
                    <a href="http://localhost:5173">Go to AuraLink Dashboard</a>
                </div>
            </body>
            </html>
            """
        )

    # Check active status
    if not link.is_active:
        return HTMLResponse(
            status_code=410,
            content="""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Link Inactive - AuraLink</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center; max-width: 420px; backdrop-filter: blur(12px); }
                    h1 { color: #fbbf24; font-size: 24px; margin-bottom: 8px; }
                    p { color: #9ca3af; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
                    a { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Link Disabled</h1>
                    <p>This shortened link has been deactivated by its owner.</p>
                    <a href="http://localhost:5173">Go to AuraLink Dashboard</a>
                </div>
            </body>
            </html>
            """
        )

    # Check expiration
    if link.expires_at:
        exp = link.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=datetime.timezone.utc)
        if utcnow() > exp:
            return HTMLResponse(
                status_code=410,
                content="""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Link Expired - AuraLink</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center; max-width: 420px; backdrop-filter: blur(12px); }
                        h1 { color: #f43f5e; font-size: 24px; margin-bottom: 8px; }
                        p { color: #9ca3af; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
                        a { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Link Expired</h1>
                        <p>This shortened URL has passed its expiration time and is no longer accessible.</p>
                        <a href="http://localhost:5173">Go to AuraLink Dashboard</a>
                    </div>
                </body>
                </html>
                """
            )

    # Extract headers
    user_agent = request.headers.get("user-agent")
    referer = request.headers.get("referer")
    client_ip = request.client.host if request.client else None
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    # Record click event
    log_click_to_db(
        db=db,
        link=link,
        user_agent_str=user_agent,
        referer_str=referer,
        client_ip=client_ip
    )

    return RedirectResponse(
        url=link.original_url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT
    )
