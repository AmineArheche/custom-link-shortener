# Changelog

All notable changes to **AuraLink** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-18

### Added
- **UTM Campaign Builder**: Visual campaign URL composer (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`).
- **Bulk Link Shortener**: Batch URL creation endpoint and UI for shortening lists of links at once.
- **Data Export Suite**: Full CSV and JSON export for link records and click event telemetry.
- **QR Studio Themes**: Multi-palette QR code generator with high-resolution PNG & SVG export.
- **Docker Compose Setup**: Full multi-container configuration with Nginx reverse proxy and persistence.
- **CI/CD Pipeline**: GitHub Actions workflows for multi-version Python and Node testing.
- **Expired Link Management**: Server-side cleanup endpoint and filtering by link lifecycle status.

---

## [1.0.0] - 2026-09-18

### Added
- High-performance FastAPI backend with SQLite / PostgreSQL support.
- Real-time visitor telemetry tracking (Browser, OS, Device category, Referrer domain, Geo-estimation).
- 7-Day interactive Chart.js click velocity timeline.
- Custom alias management, HTML title auto-scraping, and SSRF defense.
- Interactive Traffic Simulator for instant dashboard evaluation.
- Responsive dark-mode glassmorphic UI built with React 19, Vite, and Lucide icons.
