Write-Host "Starting AuraLink FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
