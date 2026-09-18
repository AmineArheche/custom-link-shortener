FROM python:3.12-slim

WORKDIR /app

# Install security updates and build requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /data && chown -R appuser:appuser /data /app

# Copy application source
COPY app/ app/
COPY seed_demo.py .

USER appuser

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
