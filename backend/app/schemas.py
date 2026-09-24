import datetime
import re
import urllib.parse
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Known dangerous or non-web schemes
DISALLOWED_SCHEMES = {
    "javascript", "data", "file", "ftp", "ftps", "vbscript", 
    "blob", "about", "tel", "sms", "mailto", "gopher", "ldap", "dict"
}

class ShortenRequest(BaseModel):
    original_url: str = Field(..., description="The original destination URL (must be valid HTTP/HTTPS)")
    custom_alias: Optional[str] = Field(None, max_length=50, description="Optional custom alias for the short link")
    title: Optional[str] = Field(None, max_length=255, description="Optional friendly title")
    expires_at: Optional[datetime.datetime] = Field(None, description="Optional link expiration datetime")
    tags: Optional[List[str]] = Field(default=[], description="List of categorizing tags")

    @field_validator("original_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("URL cannot be empty")
        
        v = v.strip()

        # 1. Reject any CRLF or control characters
        if any(c in v for c in ['\r', '\n', '\t', '\0']):
            raise ValueError("URL contains illegal control or whitespace characters")

        # 2. Check for explicit scheme or pseudo-protocols
        scheme_match = re.match(r'^([a-zA-Z0-9+.-]+):', v)
        if scheme_match:
            scheme = scheme_match.group(1).lower()
            if scheme in DISALLOWED_SCHEMES:
                raise ValueError(f"Unsafe URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.")
            if scheme not in ("http", "https"):
                raise ValueError(f"Unsupported URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.")
        else:
            # Missing scheme, default to https://
            v = "https://" + v

        try:
            parsed = urllib.parse.urlsplit(v)
        except Exception:
            raise ValueError("Invalid URL structure")

        # 3. Scheme must strictly be http or https
        if parsed.scheme.lower() not in ("http", "https"):
            raise ValueError(f"Unsafe URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

        # 4. Require valid hostname
        if not parsed.netloc or not parsed.hostname:
            raise ValueError("URL must include a valid domain or host name")

        # 5. Reject userinfo credentials embedded in URL (e.g. https://user:pass@evil.com)
        if parsed.username or parsed.password:
            raise ValueError("Embedded credentials in URLs are not permitted for security reasons")

        # 6. Reject dangerous HTML tag characters
        if any(c in v for c in ['<', '>', '"', "'"]):
            raise ValueError("URL contains invalid or dangerous characters")

        return v

    @field_validator("custom_alias")
    @classmethod
    def validate_alias(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if len(v) == 0:
                return None
            if not re.match(r'^[a-z0-9_\-]+$', v):
                raise ValueError("Custom alias can only contain alphanumeric characters, hyphens, and underscores")
            if v in [
                "api", "docs", "redoc", "openapi.json", "health", "analytics", 
                "static", "r", "admin", "login", "auth", "dashboard", "null", "undefined"
            ]:
                raise ValueError(f"'{v}' is a reserved system keyword and cannot be used as an alias")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> List[str]:
        if not v:
            return []
        cleaned = []
        for t in v[:8]: # Cap at 8 tags max
            if isinstance(t, str):
                t_clean = re.sub(r'[^a-zA-Z0-9_\-]', '', t.strip().lower())
                if t_clean and len(t_clean) <= 30 and t_clean not in cleaned:
                    cleaned.append(t_clean)
        return cleaned

class ShortenUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime.datetime] = None
    tags: Optional[List[str]] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned = []
        for t in v[:8]:
            if isinstance(t, str):
                t_clean = re.sub(r'[^a-zA-Z0-9_\-]', '', t.strip().lower())
                if t_clean and len(t_clean) <= 30 and t_clean not in cleaned:
                    cleaned.append(t_clean)
        return cleaned

class ShortLinkResponse(BaseModel):
    id: int
    original_url: str
    short_code: str
    short_url: str
    title: Optional[str]
    tags: List[str]
    created_at: Optional[datetime.datetime]
    expires_at: Optional[datetime.datetime]
    is_active: bool
    clicks_count: int

    model_config = ConfigDict(from_attributes=True)

class ClickEventResponse(BaseModel):
    id: int
    link_id: int
    timestamp: Optional[datetime.datetime]
    ip_address: Optional[str]
    browser: Optional[str]
    browser_version: Optional[str]
    os: Optional[str]
    device_type: Optional[str]
    referrer: Optional[str]
    referrer_domain: Optional[str]
    country: Optional[str]
    city: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class TimeSeriesPoint(BaseModel):
    label: str
    count: int

class DistributionItem(BaseModel):
    name: str
    count: int
    percentage: float

class AnalyticsOverview(BaseModel):
    total_links: int
    total_clicks: int
    unique_referrers: int
    top_browser: Optional[str] = "N/A"
    top_os: Optional[str] = "N/A"
    top_device: Optional[str] = "N/A"
    top_referrer: Optional[str] = "N/A"
    clicks_timeline: List[TimeSeriesPoint]
    browsers: List[DistributionItem]
    operating_systems: List[DistributionItem]
    device_types: List[DistributionItem]
    top_referrers: List[DistributionItem]
    recent_clicks: List[ClickEventResponse]

class LinkDetailedAnalytics(BaseModel):
    link: ShortLinkResponse
    total_clicks: int
    clicks_timeline: List[TimeSeriesPoint]
    browsers: List[DistributionItem]
    operating_systems: List[DistributionItem]
    device_types: List[DistributionItem]
    top_referrers: List[DistributionItem]
    recent_clicks: List[ClickEventResponse]

class SimulateClickRequest(BaseModel):
    link_id: Optional[int] = None
    short_code: Optional[str] = None
    count: int = Field(default=1, ge=1, le=100)
    browser: Optional[str] = None
    os: Optional[str] = None
    device_type: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None

class UTMParameters(BaseModel):
    utm_source: Optional[str] = Field(None, max_length=100)
    utm_medium: Optional[str] = Field(None, max_length=100)
    utm_campaign: Optional[str] = Field(None, max_length=100)
    utm_term: Optional[str] = Field(None, max_length=100)
    utm_content: Optional[str] = Field(None, max_length=100)

class BulkShortenItem(BaseModel):
    original_url: str
    custom_alias: Optional[str] = None
    title: Optional[str] = None
    tags: Optional[List[str]] = []

class BulkShortenRequest(BaseModel):
    items: List[ShortenRequest] = Field(..., max_length=50, description="List of links to shorten (up to 50 items)")

class BulkShortenResultItem(BaseModel):
    success: bool
    original_url: str
    short_code: Optional[str] = None
    short_url: Optional[str] = None
    error: Optional[str] = None

class BulkShortenResponse(BaseModel):
    total_requested: int
    total_success: int
    total_failed: int
    results: List[BulkShortenResultItem]

class ExpiredCleanupResponse(BaseModel):
    cleaned_count: int
    message: str

class DevTaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field("feature", pattern="^(feature|security|performance|docs|devops)$")
    difficulty: Optional[str] = Field("medium", pattern="^(good-first-issue|medium|advanced)$")
    points: Optional[int] = Field(10, ge=5, le=100)

class DevTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|completed)$")
    points: Optional[int] = None

class DevTaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    difficulty: str
    status: str
    points: int
    created_at: Optional[datetime.datetime]
    completed_at: Optional[datetime.datetime]

    model_config = ConfigDict(from_attributes=True)

class DevTaskListResponse(BaseModel):
    total: int
    completed_count: int
    total_points_earned: int
    items: List[DevTaskResponse]

