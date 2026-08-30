from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "MedBridge India API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://medbridge-india-web.vercel.app",
        "https://medbridge-india-web-git-main-abhipatil1403-gmailcoms-projects.vercel.app"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
