import datetime
import random
from app.database import SessionLocal, engine, Base
from app.models import ShortLink, ClickEvent

Base.metadata.create_all(bind=engine)

DEMO_LINKS = [
    {
        "original_url": "https://github.com/fastapi/fastapi",
        "short_code": "fastapi-repo",
        "title": "FastAPI GitHub Repository",
        "tags": "dev,github,python",
        "clicks": 42
    },
    {
        "original_url": "https://react.dev",
        "short_code": "react-docs",
        "title": "React Official Documentation",
        "tags": "frontend,docs,javascript",
        "clicks": 68
    },
    {
        "original_url": "https://news.ycombinator.com",
        "short_code": "hackernews",
        "title": "Hacker News Tech Aggregator",
        "tags": "news,tech",
        "clicks": 95
    },
    {
        "original_url": "https://stripe.com/docs/api",
        "short_code": "stripe-api",
        "title": "Stripe API Reference",
        "tags": "payments,docs,api",
        "clicks": 31
    }
]

BROWSERS = [("Chrome", "124.0", 0.55), ("Safari", "17.4", 0.22), ("Firefox", "125.0", 0.12), ("Edge", "124.0", 0.08), ("Opera", "109.0", 0.03)]
OS_LIST = [("Windows", 0.42), ("macOS", 0.30), ("iOS", 0.16), ("Android", 0.08), ("Linux", 0.04)]
REFERRERS = [("https://twitter.com/feed", "twitter.com"), ("https://linkedin.com/posts", "linkedin.com"), ("https://github.com", "github.com"), ("https://news.ycombinator.com", "news.ycombinator.com"), ("Direct", "Direct")]
CITIES = [
    ("San Francisco", "United States"),
    ("New York", "United States"),
    ("London", "United Kingdom"),
    ("Berlin", "Germany"),
    ("Paris", "France"),
    ("Tokyo", "Japan"),
    ("Toronto", "Canada"),
    ("Casablanca", "Morocco")
]

def weighted_choice(choices):
    r = random.random()
    cumulative = 0.0
    for item, weight in choices:
        cumulative += weight
        if r <= cumulative:
            return item
    return choices[0][0]

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(ShortLink).count() > 0:
            print("Database already contains links. Skipping seed.")
            return

        print("Seeding demo short links and rich analytics...")
        now = datetime.datetime.utcnow()

        for item in DEMO_LINKS:
            link = ShortLink(
                original_url=item["original_url"],
                short_code=item["short_code"],
                title=item["title"],
                tags=item["tags"],
                created_at=now - datetime.timedelta(days=7),
                is_active=True,
                clicks_count=item["clicks"]
            )
            db.add(link)
            db.flush()

            for _ in range(item["clicks"]):
                b_name = weighted_choice([(b[0], b[2]) for b in BROWSERS])
                os_name = weighted_choice(OS_LIST)
                ref_url, ref_domain = random.choice(REFERRERS)
                city, country = random.choice(CITIES)
                dev_type = "Mobile" if os_name in ["iOS", "Android"] else ("Tablet" if random.random() < 0.08 else "Desktop")

                # Spread timestamp across past 7 days
                delta_minutes = random.randint(0, 7 * 24 * 60)
                click_time = now - datetime.timedelta(minutes=delta_minutes)

                click = ClickEvent(
                    link_id=link.id,
                    timestamp=click_time,
                    browser=b_name,
                    browser_version="124.0",
                    os=os_name,
                    device_type=dev_type,
                    referrer=ref_url,
                    referrer_domain=ref_domain,
                    country=country,
                    city=city,
                    user_agent=f"Mozilla/5.0 ({os_name}) AppleWebKit/537.36 {b_name}",
                    ip_address=f"{random.randint(50, 190)}.{random.randint(10, 200)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
                )
                db.add(click)

        db.commit()
        print("Database seeded successfully with realistic traffic!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
