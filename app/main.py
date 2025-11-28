from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import get_settings
from app.api.v1.endpoints import participants, templates, certificates
from app.storage.redis_storage import init_redis, close_redis


settings = get_settings()

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown."""
    # Startup
    logger.info("Starting Certificate Generation Service")
    await init_redis()
    yield
    # Shutdown
    logger.info("Shutting down Certificate Generation Service")
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Service for generating digital certificates",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(participants.router, prefix="/api/v1", tags=["participants"])
app.include_router(templates.router, prefix="/api/v1", tags=["templates"])
app.include_router(certificates.router, prefix="/api/v1", tags=["certificates"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Certificate Generation Service", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )