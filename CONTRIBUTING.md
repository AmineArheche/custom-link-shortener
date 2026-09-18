# Contributing to AuraLink

Thank you for your interest in contributing to **AuraLink**! We welcome bug fixes, performance improvements, documentation enhancements, and new feature suggestions.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a respectful and welcoming community.

---

## Development Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/auralink.git
cd auralink
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and proxy API calls to `http://localhost:8000`.

---

## Running Tests

### Backend Tests
```bash
cd backend
python -m pytest -v
```

### Frontend Build & Lint
```bash
cd frontend
npm run lint
npm run build
```

---

## Pull Request Guidelines

1. **Fork and Branch**: Create a feature branch with a descriptive name (e.g. `feature/utm-presets` or `fix/ssrf-ipv6`).
2. **Write Tests**: If you are adding a feature or fixing a bug, please include automated tests in `backend/tests/`.
3. **Commit Cleanly**: Use clear, conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
4. **Open a Pull Request**: Provide a comprehensive description of the problem solved and verification steps.
