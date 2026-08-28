import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Root path
root = r"f:\ALL\ABHI\VIT\INDUSTRY PROJECT\MedBridge\Project\medbridge-india"

# 1. FastAPI structure
write_file(f"{root}/apps/api/app/__init__.py", "")
write_file(f"{root}/apps/api/app/api/__init__.py", "")
write_file(f"{root}/apps/api/app/api/v1/__init__.py", "")
write_file(f"{root}/apps/api/app/core/__init__.py", "")
write_file(f"{root}/apps/api/app/models/__init__.py", "")
write_file(f"{root}/apps/api/app/schemas/__init__.py", "")
write_file(f"{root}/apps/api/app/services/__init__.py", "")
write_file(f"{root}/apps/api/app/utils/__init__.py", "")
write_file(f"{root}/apps/api/tests/__init__.py", "")

# 2. FastAPI Application & 3. API Versioning
main_py_content = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "medbridge-api"}

app.include_router(health_router, prefix="/api/v1")
"""
write_file(f"{root}/apps/api/app/main.py", main_py_content)

health_py_content = """from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check_v1():
    return {"status": "ok", "service": "medbridge-api"}
"""
write_file(f"{root}/apps/api/app/api/v1/health.py", health_py_content)


# 4. Configuration
config_py_content = """from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "MedBridge India API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
"""
write_file(f"{root}/apps/api/app/core/config.py", config_py_content)

env_example_content = """APP_NAME=MedBridge India API
APP_VERSION=0.1.0
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]
"""
write_file(f"{root}/apps/api/.env.example", env_example_content)

# 6. Logging
logging_py_content = """import logging
from app.core.config import settings

def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    # Ensure sensitive info is NOT logged here.
"""
write_file(f"{root}/apps/api/app/core/logging.py", logging_py_content)

# 7. Python Dependencies (pyproject.toml)
pyproject_content = """[project]
name = "medbridge-api"
version = "0.1.0"
description = "MedBridge India API"
readme = "README.md"
requires-python = ">=3.9"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "pytest>=7.0.0",
    "httpx>=0.24.0"
]
"""
write_file(f"{root}/apps/api/pyproject.toml", pyproject_content)


# 8. Pytest
test_health_content = """from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "medbridge-api"}

def test_api_v1_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "medbridge-api"}
"""
write_file(f"{root}/apps/api/tests/test_health.py", test_health_content)

# 10. Root Project Structure
os.makedirs(f"{root}/services/ai", exist_ok=True)
os.makedirs(f"{root}/services/data-engine", exist_ok=True)
os.makedirs(f"{root}/firebase", exist_ok=True)
os.makedirs(f"{root}/docs", exist_ok=True)
os.makedirs(f"{root}/tests", exist_ok=True)
os.makedirs(f"{root}/.github/workflows", exist_ok=True)

# 11. Root .env.example
root_env_example_content = """# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend
APP_NAME=MedBridge India API
APP_VERSION=0.1.0
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]

# AI
GEMINI_API_KEY=
"""
write_file(f"{root}/.env.example", root_env_example_content)

# 12. gitignore
gitignore_content = """.env
.env.*
!.env.example

node_modules/
.next/
.venv/
__pycache__/
*.pyc

.firebase/
firebase-debug.log
firestore-debug.log

.pytest_cache/
.mypy_cache/
.ruff_cache/

.vscode/
.idea/

*.log
"""
write_file(f"{root}/.gitignore", gitignore_content)

# 13. README
readme_content = """# MedBridge India

AI-assisted international medical tourism platform.

## Panels

1. Customer Panel
2. Support Panel
3. Admin Panel

## Current Phase

Phase 1 MVP

## Technology

Frontend:
- Next.js
- TypeScript

Backend:
- FastAPI
- Python

Infrastructure:
- Firebase
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

AI:
- Gemini API
- Ollama fallback planned

Data:
- Python scraping/data-engine pipeline planned

Business features are being implemented incrementally.
"""
write_file(f"{root}/README.md", readme_content)

# 14. Docker
docker_compose_content = """version: '3.8'

services:
  api:
    build: 
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_NAME=MedBridge India API
      - APP_VERSION=0.1.0
      - ENVIRONMENT=development
      - DEBUG=true
      - CORS_ORIGINS=["http://localhost:3000"]

  web:
    build: 
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
"""
write_file(f"{root}/docker-compose.yml", docker_compose_content)

print("Files created successfully.")
