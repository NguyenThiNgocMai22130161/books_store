"""
Configuration module using pydantic-settings
Reads environment variables from .env file
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Info
    APP_NAME: str = "Books Store AI Chatbot"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    PG_DSN: str
    
    # Backend API
    BACKEND_BASE_URL: str = "http://localhost:8080"
    JWT_TOKEN: str = ""
    
    # Google Gemini
    GOOGLE_API_KEY: str
    LLM_MODEL: str = "models/gemini-1.5-flash"
    EMBED_MODEL: str = "models/text-embedding-004"
    EMBED_DIM: int = 768
    TEMPERATURE: float = 0.3
    MAX_RETRIES: int = 5
    
    # RAG Settings
    TOP_K_RESULTS: int = 8
    SCORE_THRESHOLD: float = 0.3
    KEYWORD_BOOST: float = 0.2
    RATING_BOOST: float = 0.1
    SALES_BOOST: float = 0.15
    
    # Advanced
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600
    MAX_CHAT_HISTORY: int = 10
    
    # Webhook Security
    AI_INTERNAL_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


# Global settings instance
settings = Settings()
