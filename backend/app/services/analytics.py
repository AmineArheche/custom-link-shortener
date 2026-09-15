from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional
import datetime
from app.models import ShortLink, ClickEvent, utcnow

def get_distribution(query_result, total: int) -> List[Dict[str, Any]]:
    """Helper to convert SQL group by counts into percentage distribution list."""
    if total == 0:
        return []
    items = []
    for name, count in query_result:
        label = name if name and str(name).strip() else "Unknown"
        pct = round((count / total) * 100, 1)
        items.append({
            "name": label,
            "count": count,
            "percentage": pct
        })
    return items

def get_clicks_timeline(db: Session, link_id: Optional[int] = None, days: int = 7) -> List[Dict[str, Any]]:
    """Calculates chronological click counts grouped by day/date."""
    now = datetime.datetime.now(datetime.timezone.utc)
    start_date = (now - datetime.timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Initialize empty bucket map for all days in range
    buckets = {}
    for i in range(days):
        d = start_date + datetime.timedelta(days=i)
        label = d.strftime("%b %d")
        buckets[label] = 0

    query = db.query(
        func.date(ClickEvent.timestamp).label("click_date"),
        func.count(ClickEvent.id).label("count")
    ).filter(ClickEvent.timestamp >= start_date)

    if link_id is not None:
        query = query.filter(ClickEvent.link_id == link_id)

    results = query.group_by(func.date(ClickEvent.timestamp)).all()

    for r in results:
        if r.click_date:
            try:
                # Handle string or date return
                if isinstance(r.click_date, str):
                    parsed_d = datetime.date.fromisoformat(r.click_date)
                else:
                    parsed_d = r.click_date
                label = parsed_d.strftime("%b %d")
                buckets[label] = r.count
            except Exception:
                pass

    return [{"label": label, "count": count} for label, count in buckets.items()]

def get_analytics_overview(db: Session) -> Dict[str, Any]:
    """Computes global analytics overview across all shortened links."""
    total_links = db.query(func.count(ShortLink.id)).scalar() or 0
    total_clicks = db.query(func.count(ClickEvent.id)).scalar() or 0
    unique_referrers = db.query(func.count(func.distinct(ClickEvent.referrer_domain))).scalar() or 0

    # Top stats
    top_browser_row = db.query(ClickEvent.browser, func.count(ClickEvent.id)).group_by(ClickEvent.browser).order_by(desc(func.count(ClickEvent.id))).first()
    top_os_row = db.query(ClickEvent.os, func.count(ClickEvent.id)).group_by(ClickEvent.os).order_by(desc(func.count(ClickEvent.id))).first()
    top_device_row = db.query(ClickEvent.device_type, func.count(ClickEvent.id)).group_by(ClickEvent.device_type).order_by(desc(func.count(ClickEvent.id))).first()
    top_ref_row = db.query(ClickEvent.referrer_domain, func.count(ClickEvent.id)).group_by(ClickEvent.referrer_domain).order_by(desc(func.count(ClickEvent.id))).first()

    # Distributions
    browsers_query = db.query(ClickEvent.browser, func.count(ClickEvent.id)).group_by(ClickEvent.browser).order_by(desc(func.count(ClickEvent.id))).limit(6).all()
    os_query = db.query(ClickEvent.os, func.count(ClickEvent.id)).group_by(ClickEvent.os).order_by(desc(func.count(ClickEvent.id))).limit(6).all()
    device_query = db.query(ClickEvent.device_type, func.count(ClickEvent.id)).group_by(ClickEvent.device_type).order_by(desc(func.count(ClickEvent.id))).limit(5).all()
    ref_query = db.query(ClickEvent.referrer_domain, func.count(ClickEvent.id)).group_by(ClickEvent.referrer_domain).order_by(desc(func.count(ClickEvent.id))).limit(8).all()

    # Recent clicks
    recent_events = db.query(ClickEvent).order_by(desc(ClickEvent.timestamp)).limit(20).all()

    return {
        "total_links": total_links,
        "total_clicks": total_clicks,
        "unique_referrers": unique_referrers,
        "top_browser": top_browser_row[0] if top_browser_row else "N/A",
        "top_os": top_os_row[0] if top_os_row else "N/A",
        "top_device": top_device_row[0] if top_device_row else "N/A",
        "top_referrer": top_ref_row[0] if top_ref_row else "N/A",
        "clicks_timeline": get_clicks_timeline(db, days=7),
        "browsers": get_distribution(browsers_query, total_clicks),
        "operating_systems": get_distribution(os_query, total_clicks),
        "device_types": get_distribution(device_query, total_clicks),
        "top_referrers": get_distribution(ref_query, total_clicks),
        "recent_clicks": [e.to_dict() for e in recent_events]
    }

def get_link_detailed_analytics(db: Session, short_link: ShortLink) -> Dict[str, Any]:
    """Computes detailed analytics specific to one ShortLink instance."""
    total_clicks = short_link.clicks_count or 0

    browsers_query = db.query(ClickEvent.browser, func.count(ClickEvent.id)).filter(ClickEvent.link_id == short_link.id).group_by(ClickEvent.browser).order_by(desc(func.count(ClickEvent.id))).limit(6).all()
    os_query = db.query(ClickEvent.os, func.count(ClickEvent.id)).filter(ClickEvent.link_id == short_link.id).group_by(ClickEvent.os).order_by(desc(func.count(ClickEvent.id))).limit(6).all()
    device_query = db.query(ClickEvent.device_type, func.count(ClickEvent.id)).filter(ClickEvent.link_id == short_link.id).group_by(ClickEvent.device_type).order_by(desc(func.count(ClickEvent.id))).limit(5).all()
    ref_query = db.query(ClickEvent.referrer_domain, func.count(ClickEvent.id)).filter(ClickEvent.link_id == short_link.id).group_by(ClickEvent.referrer_domain).order_by(desc(func.count(ClickEvent.id))).limit(8).all()

    recent_events = db.query(ClickEvent).filter(ClickEvent.link_id == short_link.id).order_by(desc(ClickEvent.timestamp)).limit(25).all()

    return {
        "link": short_link.to_dict(),
        "total_clicks": total_clicks,
        "clicks_timeline": get_clicks_timeline(db, link_id=short_link.id, days=7),
        "browsers": get_distribution(browsers_query, total_clicks),
        "operating_systems": get_distribution(os_query, total_clicks),
        "device_types": get_distribution(device_query, total_clicks),
        "top_referrers": get_distribution(ref_query, total_clicks),
        "recent_clicks": [e.to_dict() for e in recent_events]
    }
