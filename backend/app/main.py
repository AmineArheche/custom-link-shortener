import csv
import datetime
import html
import io
import re
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, BackgroundTasks, Query
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional

from app.config import settings
from app.database import engine, Base, get_db
from app.models import ShortLink, ClickEvent, DevTask, utcnow
from app.schemas import (
    ShortenRequest,
    ShortenUpdate,
    ShortLinkResponse,
    AnalyticsOverview,
    LinkDetailedAnalytics,
    SimulateClickRequest,
    BulkShortenRequest,
    BulkShortenResponse,
    BulkShortenResultItem,
    ExpiredCleanupResponse,
    DevTaskCreate,
    DevTaskUpdate,
    DevTaskResponse,
    DevTaskListResponse
)
from app.services.shortener import generate_unique_short_code, fetch_page_title
from app.services.user_agent import parse_request_headers
from app.services.analytics import get_analytics_overview, get_link_detailed_analytics

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="High-performance URL Shortener with real-time browser, device, and referrer analytics",
    version="1.1.0"
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

@app.post("/api/links/bulk", response_model=BulkShortenResponse, status_code=status.HTTP_200_OK)
async def bulk_create_short_links(
    payload: BulkShortenRequest,
    db: Session = Depends(get_db)
):
    """Creates multiple shortened URLs in batch with isolated item validation."""
    results = []
    success_count = 0
    failed_count = 0

    for item in payload.items:
        try:
            short_code = item.custom_alias
            if short_code:
                existing = db.query(ShortLink).filter(ShortLink.short_code == short_code).first()
                if existing:
                    results.append(BulkShortenResultItem(
                        success=False,
                        original_url=item.original_url,
                        error=f"Alias '{short_code}' is already in use"
                    ))
                    failed_count += 1
                    continue
            else:
                short_code = generate_unique_short_code(db, length=settings.SHORT_CODE_LENGTH)

            title = item.title or item.original_url
            tags_str = ",".join(item.tags) if item.tags else ""

            short_link = ShortLink(
                original_url=item.original_url,
                short_code=short_code,
                title=title,
                tags=tags_str,
                expires_at=item.expires_at,
                is_active=True,
                clicks_count=0
            )
            db.add(short_link)
            db.commit()
            db.refresh(short_link)

            success_count += 1
            results.append(BulkShortenResultItem(
                success=True,
                original_url=item.original_url,
                short_code=short_code,
                short_url=f"{settings.BASE_URL}/r/{short_code}"
            ))
        except Exception as e:
            db.rollback()
            failed_count += 1
            results.append(BulkShortenResultItem(
                success=False,
                original_url=item.original_url,
                error=str(e)
            ))

    return BulkShortenResponse(
        total_requested=len(payload.items),
        total_success=success_count,
        total_failed=failed_count,
        results=results
    )

@app.get("/api/links")
def list_links(
    query: Optional[str] = Query(None, description="Search by title, code, or URL", max_length=100),
    tag: Optional[str] = Query(None, description="Filter by tag", max_length=50),
    status_filter: Optional[str] = Query("all", description="Filter by status (all, active, disabled, expired)"),
    sort_by: Optional[str] = Query("created_desc", description="Sort order (created_desc, created_asc, clicks_desc, title_asc)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists shortened links with search, tag filtering, lifecycle status, and sorting."""
    now = utcnow()
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

    # Status filter
    if status_filter == "active":
        q = q.filter(ShortLink.is_active == True, (ShortLink.expires_at == None) | (ShortLink.expires_at > now))
    elif status_filter == "disabled":
        q = q.filter(ShortLink.is_active == False)
    elif status_filter == "expired":
        q = q.filter(ShortLink.expires_at != None, ShortLink.expires_at <= now)

    # Sorting
    if sort_by == "created_asc":
        q = q.order_by(ShortLink.created_at.asc())
    elif sort_by == "clicks_desc":
        q = q.order_by(ShortLink.clicks_count.desc(), ShortLink.created_at.desc())
    elif sort_by == "title_asc":
        q = q.order_by(ShortLink.title.asc())
    else:
        q = q.order_by(ShortLink.created_at.desc())

    total = q.count()
    links = q.offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [format_link_response(link) for link in links]
    }

@app.get("/api/links/export/csv")
def export_links_csv(db: Session = Depends(get_db)):
    """Exports all shortened link records in CSV format."""
    links = db.query(ShortLink).order_by(ShortLink.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Short Code", "Short URL", "Original URL", "Title", "Tags", "Clicks", "Is Active", "Created At", "Expires At"])
    
    for l in links:
        writer.writerow([
            l.id,
            l.short_code,
            f"{settings.BASE_URL}/r/{l.short_code}",
            l.original_url,
            l.title or "",
            l.tags or "",
            l.clicks_count or 0,
            "Yes" if l.is_active else "No",
            l.created_at.isoformat() if l.created_at else "",
            l.expires_at.isoformat() if l.expires_at else ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=auralink_links_export.csv"}
    )

@app.get("/api/analytics/export/csv")
def export_analytics_csv(db: Session = Depends(get_db)):
    """Exports all click telemetry events in CSV format."""
    events = db.query(ClickEvent).order_by(ClickEvent.timestamp.desc()).limit(5000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Event ID", "Link ID", "Timestamp (UTC)", "Browser", "Version", "OS", "Device", "Referrer Domain", "Full Referrer", "Country", "City", "IP Address"])
    
    for e in events:
        writer.writerow([
            e.id,
            e.link_id,
            e.timestamp.isoformat() if e.timestamp else "",
            e.browser or "Unknown",
            e.browser_version or "",
            e.os or "Unknown",
            e.device_type or "Desktop",
            e.referrer_domain or "Direct",
            e.referrer or "Direct",
            e.country or "Global",
            e.city or "Unknown",
            e.ip_address or ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=auralink_telemetry_export.csv"}
    )

@app.post("/api/links/cleanup-expired", response_model=ExpiredCleanupResponse)
def cleanup_expired_links(db: Session = Depends(get_db)):
    """Deactivates all links whose expiration timestamp has passed."""
    now = utcnow()
    expired_links = db.query(ShortLink).filter(
        ShortLink.expires_at != None,
        ShortLink.expires_at <= now,
        ShortLink.is_active == True
    ).all()

    count = len(expired_links)
    for l in expired_links:
        l.is_active = False

    db.commit()
    return ExpiredCleanupResponse(
        cleaned_count=count,
        message=f"Successfully deactivated {count} expired link(s)"
    )

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

# ----------------- CONTRIBUTOR & DEV TASKS ----------------- #

DEFAULT_DEV_TASKS = [
    {
        "title": "Geo-IP Country and City Telemetry Map",
        "description": "Integrate MaxMind GeoLite2 or IP-API to render a high-resolution world heatmap of visitor geolocations in dashboard.",
        "category": "feature",
        "difficulty": "medium",
        "points": 25,
    },
    {
        "title": "Sub-Millisecond Redis Caching Layer",
        "description": "Implement Redis cache for high-frequency short link lookups to achieve sub-millisecond redirect response latency.",
        "category": "performance",
        "difficulty": "advanced",
        "points": 35,
    },
    {
        "title": "Password-Protected Short URL Redirection",
        "description": "Add optional bcrypt password hashing to short links with an interactive PIN entry unlock screen before redirect.",
        "category": "security",
        "difficulty": "medium",
        "points": 20,
    },
    {
        "title": "Webhook Event Notification Dispatcher",
        "description": "Broadcast real-time HTTP Webhook POST notifications to Slack, Discord, or custom server endpoints whenever a link is clicked.",
        "category": "feature",
        "difficulty": "advanced",
        "points": 30,
    },
    {
        "title": "Docker Multi-Stage Optimization with Alpine",
        "description": "Refactor Dockerfile to use multi-stage builds and Alpine base to minimize final container image footprint under 80MB.",
        "category": "devops",
        "difficulty": "good-first-issue",
        "points": 15,
    },
    {
        "title": "Automated OWASP Security Audit CI/CD Workflow",
        "description": "Add GitHub Actions workflow running automated Bandit, Safety, and OWASP ZAP security checks on every pull request.",
        "category": "security",
        "difficulty": "medium",
        "points": 25,
    },
    {
        "title": "Interactive OpenAPI Client SDK Generators",
        "description": "Provide auto-generated Python (httpx) and TypeScript (axios/fetch) SDK packages from the OpenAPI 3.1 specification.",
        "category": "docs",
        "difficulty": "good-first-issue",
        "points": 15,
    },
    {
        "title": "A/B Split URL Traffic Weight Testing Engine",
        "description": "Support multiple destination URLs per short code with customizable percentage traffic distribution weighting.",
        "category": "feature",
        "difficulty": "advanced",
        "points": 35,
    },
    {
        "title": "Rate Limiting IP Whitelist & Token Bucket",
        "description": "Add sliding-window token bucket rate limiter with configurable IP whitelists and custom tier headers.",
        "category": "security",
        "difficulty": "medium",
        "points": 20,
    },
    {
        "title": "Custom Domain CNAME Mapping & SSL Auto-Cert",
        "description": "Support custom organization domains (e.g. go.brand.com) mapped via CNAME with automatic Let's Encrypt SSL.",
        "category": "devops",
        "difficulty": "advanced",
        "points": 40,
    },
]

@app.get("/api/tasks", response_model=DevTaskListResponse)
def get_tasks(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List developer contribution tasks and roadmap items"""
    # Seed default tasks if empty
    task_count = db.query(DevTask).count()
    if task_count == 0:
        for t in DEFAULT_DEV_TASKS:
            db_task = DevTask(
                title=t["title"],
                description=t["description"],
                category=t["category"],
                difficulty=t["difficulty"],
                points=t["points"],
                status="todo"
            )
            db.add(db_task)
        db.commit()

    query = db.query(DevTask)
    if category and category != "all":
        query = query.filter(DevTask.category == category)
    if difficulty and difficulty != "all":
        query = query.filter(DevTask.difficulty == difficulty)
    if status_filter and status_filter != "all":
        query = query.filter(DevTask.status == status_filter)

    all_tasks = db.query(DevTask).all()
    completed_tasks = [t for t in all_tasks if t.status == "completed"]
    total_points = sum(t.points for t in completed_tasks)

    items = query.order_by(DevTask.id.asc()).all()
    return {
        "total": len(all_tasks),
        "completed_count": len(completed_tasks),
        "total_points_earned": total_points,
        "items": items
    }

@app.post("/api/tasks", response_model=DevTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: DevTaskCreate, db: Session = Depends(get_db)):
    """Create a new developer task or open source milestone"""
    task = DevTask(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        category=payload.category,
        difficulty=payload.difficulty,
        points=payload.points or 10,
        status="todo"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.patch("/api/tasks/{task_id}", response_model=DevTaskResponse)
def update_task(task_id: int, payload: DevTaskUpdate, db: Session = Depends(get_db)):
    """Update a developer task status, category, or difficulty"""
    task = db.query(DevTask).filter(DevTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title.strip()
    if payload.description is not None:
        task.description = payload.description.strip()
    if payload.category is not None:
        task.category = payload.category
    if payload.difficulty is not None:
        task.difficulty = payload.difficulty
    if payload.points is not None:
        task.points = payload.points
    if payload.status is not None:
        task.status = payload.status
        if payload.status == "completed":
            task.completed_at = utcnow()
        else:
            task.completed_at = None

    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a developer task"""
    task = db.query(DevTask).filter(DevTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

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
