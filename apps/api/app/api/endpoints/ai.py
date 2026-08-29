import time
from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.ai import ChatRequest
from app.api.dependencies import get_current_user
from app.ai.orchestrator import AIOrchestrator

router = APIRouter()
orchestrator = AIOrchestrator()

# Simple in-memory rate limiter: dict mapping user_id to list of timestamps
_rate_limits = {}
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60

@router.post("/chat")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Main chat endpoint for the AI Assistant.
    Requires authentication.
    """
    # Use the authenticated user ID from the token
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Rate Limiting Logic (Process-local)
    now = time.time()
    user_requests = _rate_limits.get(user_id, [])
    # Clean up old requests outside the window
    user_requests = [t for t in user_requests if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(user_requests) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    user_requests.append(now)
    _rate_limits[user_id] = user_requests
        
    try:
        response = orchestrator.process_message(user_id, request.message, request.conversationId)
        return response
    except Exception as e:
        # Generic error to prevent leaking stack traces
        raise HTTPException(status_code=500, detail="An error occurred processing your request.")
