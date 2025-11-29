FROM python:3.12

WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry

# Copy project files
COPY . .

RUN poetry config virtualenvs.create false \
 && poetry install --no-root


RUN mkdir -p /app/temp/uploads /app/temp/certificates /app/data/templates

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]