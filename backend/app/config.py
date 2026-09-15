import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "AuraLink - Custom Link Shortener & Analytics"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./link_shortener.db")
    
    # Secure CORS configuration with explicit origins
    cors_env = os.getenv("CORS_ORIGINS", "")
    if cors_env:
        CORS_ORIGINS: list[str] = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    else:
        CORS_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ]
        
    SHORT_CODE_LENGTH: int = int(os.getenv("SHORT_CODE_LENGTH", "6"))
    ALLOW_CUSTOM_ALIASES: bool = True

settings = Settings()
