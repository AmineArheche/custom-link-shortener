import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class ShortLink(Base):
    __tablename__ = "short_links"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(Text, nullable=False)
    short_code = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    clicks_count = Column(Integer, default=0)

    # Relational link to tracked clicks
    clicks = relationship("ClickEvent", back_populates="short_link", cascade="all, delete-orphan", order_by="desc(ClickEvent.timestamp)")

    def to_dict(self):
        return {
            "id": self.id,
            "original_url": self.original_url,
            "short_code": self.short_code,
            "title": self.title,
            "tags": [t.strip() for t in self.tags.split(",") if t.strip()] if self.tags else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "clicks_count": self.clicks_count,
        }

class ClickEvent(Base):
    __tablename__ = "click_events"

    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("short_links.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    ip_address = Column(String(64), nullable=True)
    browser = Column(String(64), nullable=True)
    browser_version = Column(String(32), nullable=True)
    os = Column(String(64), nullable=True)
    device_type = Column(String(32), nullable=True) # Desktop, Mobile, Tablet, Bot
    referrer = Column(String(512), nullable=True)
    referrer_domain = Column(String(128), nullable=True)
    country = Column(String(64), nullable=True)
    city = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)

    short_link = relationship("ShortLink", back_populates="clicks")

    def to_dict(self):
        return {
            "id": self.id,
            "link_id": self.link_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "ip_address": self.ip_address,
            "browser": self.browser,
            "browser_version": self.browser_version,
            "os": self.os,
            "device_type": self.device_type,
            "referrer": self.referrer,
            "referrer_domain": self.referrer_domain,
            "country": self.country,
            "city": self.city,
            "user_agent": self.user_agent,
        }

class DevTask(Base):
    __tablename__ = "dev_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(64), default="feature") # feature, security, performance, docs, devops
    difficulty = Column(String(32), default="medium") # good-first-issue, medium, advanced
    status = Column(String(32), default="todo") # todo, in_progress, completed
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "difficulty": self.difficulty,
            "status": self.status,
            "points": self.points,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
