"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging

# Setup logging
logger = setup_logging(debug=settings.DEBUG)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI Chatbot for Books Store using RAG (Retrieval-Augmented Generation)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"[OK] Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"[OK] Database: {settings.PG_DSN.split('@')[1].split('/')[0] if '@' in settings.PG_DSN else 'Not configured'}")
    logger.info(f"[OK] LLM Model: {settings.LLM_MODEL}")
    logger.info(f"[OK] Embedding Model: {settings.EMBED_MODEL}")
    logger.info(f"[OK] Debug Mode: {settings.DEBUG}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f" Shutting down {settings.APP_NAME}")

# Register routers
from app.routers import ingest, chat

app.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion"])
app.include_router(chat.router, prefix="/api", tags=["Chat & Search"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
