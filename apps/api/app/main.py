from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.health import router as health_router
from app.api.endpoints import ai
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in settings.CORS_ORIGINS],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "medbridge-api"}

app.include_router(health_router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
