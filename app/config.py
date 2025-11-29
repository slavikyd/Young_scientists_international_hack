from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    # FastAPI
    APP_NAME: str = "Certificate Generation Service"
    DEBUG: bool = False
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_DECODE_RESPONSES: bool = True
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: list = ["json"]
    
    
    MAX_FILE_SIZE: int = 50 * 1024 * 1024
    UPLOAD_TEMP_DIR: str = "./temp/uploads"
    TEMPLATES_DIR: str = "./data/templates"
    CERTIFICATES_DIR: str = "./temp/certificates"
    ALLOWED_EXTENSIONS: list = [".csv", ".xlsx"]
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@sirius-certs.ru"
    SMTP_USE_TLS: bool = True
    EMAIL_RATE_LIMIT: int = 100  # emails per minute
    
    # PDF Generation
    PDF_TIMEOUT: int = 30  # seconds
    PDF_DPI: int = 300
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Data Retention
    SESSION_EXPIRATION: int = 3600  # 1 hour in seconds
    TEMP_FILES_RETENTION: int = 86400  # 24 hours in seconds

    # MinIO / S3
    MINIO_URL: str = "http://minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "certificates"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()