# LABEL LENS AI — Root Production Dockerfile for Render / Cloud Deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by OpenCV & RapidOCR ONNXRuntime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies
COPY backend/requirements.txt ./requirements.txt

# Install python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV ENVIRONMENT=production
ENV PYTHONPATH=/app

EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-8000}/health || exit 1

# Server startup command
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
