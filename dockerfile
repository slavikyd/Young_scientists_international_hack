# Build stage - install dependencies
FROM python:3.12-slim as builder

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

# Install only essential system dependencies for WeasyPrint + fonts
RUN apt-get update && apt-get install -y --no-install-recommends -qq \
    fonts-dejavu \
    fonts-liberation \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    build-essential \
    gcc \
    pkg-config \
    python3-dev \
    meson \
    ninja-build \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf-xlib-2.0-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry and build dependencies
RUN pip install --no-cache-dir poetry

# Copy only dependency files first (better layer caching)
# Copy only pyproject and generate lock inside the builder
COPY pyproject.toml ./

# Generate lockfile and install dependencies so lock always matches pyproject
RUN poetry config virtualenvs.create false \
    && poetry lock \
    && poetry install --no-root

# Copy app code
COPY . .

# Final stage - runtime
FROM python:3.12-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install only runtime system dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends -qq \
    fonts-dejavu \
    fonts-liberation \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    shared-mime-info \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy everything from builder stage
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
# Copy console scripts (celery, etc.) installed into /usr/local/bin by Poetry
COPY --from=builder /usr/local/bin /usr/local/bin

# Create app directories
RUN mkdir -p /app/temp/uploads /app/temp/certificates /app/data/templates

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]