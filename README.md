# AuraLink - Custom Link Shortener & Real-Time Analytics

> A high-performance, full-stack URL shortener and telemetry platform built with **FastAPI**, **SQLAlchemy**, **React (Vite)**, and **Chart.js**.

---

## Key Highlights

- **Dynamic Relational Architecture**: 1-to-many database schema mapping `ShortLink` to granular `ClickEvent` telemetry records.
- **Sub-Millisecond Redirection**: Asynchronously captures HTTP `User-Agent`, `Referer`, and IP metrics while instantly issuing HTTP 307 temporary redirects.
- **Rich Analytics Intelligence**:
  - 7-Day interactive click velocity timeline with gradient area charts.
  - Browser distribution (Chrome, Safari, Firefox, Edge, Opera).
  - Operating System breakdown (Windows, macOS, iOS, Android, Linux).
  - Device category split (Desktop, Mobile, Tablet).
  - Top Referrer domains & channels tracking.
  - Live visitor event stream with geographic estimation.
- **Custom Branding & Controls**:
  - Custom aliases (e.g., `/r/spring-sale`).
  - Automated HTML page title scraping for target URLs.
  - Expiration dates (24h, 7d, 30d, or permanent).
  - Link categorization tags.
  - Active/Deactivated toggle.
- **Built-in QR Code Generator**: High-contrast QR codes with instant PNG export.
- **Interactive Traffic Simulator**: Built-in test simulator that generates realistic visitor traffic across browsers, devices, and referrers for instant dashboard evaluation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.14+, FastAPI, SQLAlchemy, Uvicorn, Pydantic v2, user-agents |
| **Frontend** | React 19, Vite, Chart.js, react-chartjs-2, Lucide Icons, Canvas Confetti |
| **Database** | SQLite (default zero-config) / PostgreSQL ready |

---

## Quick Start Guide

### 1. Launch the Backend Server
```powershell
# From the project root
.\run_backend.ps1

# Or manually:
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API & Swagger Docs will be live at:
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Launch the Frontend UI
```powershell
# From the project root
.\run_frontend.ps1

# Or manually:
cd frontend
npm run dev
```
Dashboard will be available at:
- **Web App**: [http://localhost:5173](http://localhost:5173)

### 3. Run Backend Test Suite
```powershell
cd backend
python -m pytest -v
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/links` | Create a shortened URL (supports custom alias, title, expiry, tags) |
| `GET` | `/api/links` | List shortened links with search & tag filtering |
| `GET` | `/api/links/{id_or_code}` | Get details for a single link |
| `PATCH` | `/api/links/{id}` | Update title, tags, expiry, or toggle active status |
| `DELETE` | `/api/links/{id}` | Delete link and its click history |
| `GET` | `/api/analytics/overview` | Global aggregated metrics & breakdown charts |
| `GET` | `/api/analytics/links/{id_or_code}` | In-depth telemetry for a specific link |
| `POST` | `/api/analytics/simulate` | Simulate synthetic traffic for demo and testing |
| `GET` | `/r/{short_code}` | Perform high-speed redirect and record visitor telemetry |
