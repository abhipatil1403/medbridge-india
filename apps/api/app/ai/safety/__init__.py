from datetime import datetime
from app.core.firebase import get_db
from app.schemas.ai import AISafetyEventType
import uuid

def log_safety_event(conversation_id: str, user_id: str, event_type: AISafetyEventType, details: str = None) -> None:
    """
    Log a safety event securely to the backend without exposing it directly to the customer.
    """
    db = get_db()
    
    event_data = {
        "conversationId": conversation_id,
        "userId": user_id,
        "eventType": event_type.value,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    db.collection("aiSafetyEvents").add(event_data)

def is_prompt_injection(message: str) -> bool:
    """
    Basic deterministic check for prompt injection.
    """
    injection_patterns = [
        "ignore previous instructions",
        "system prompt",
        "you are now a",
        "forget all rules",
        "tell me your rules"
    ]
    text = message.lower()
    return any(p in text for p in injection_patterns)

def sanitize_response(content: str) -> str:
    """
    Ensure the output doesn't contain raw HTML or unsafe formatting.
    """
    # Simple replacement, could use bleach for robust HTML escaping.
    return content.replace("<", "&lt;").replace(">", "&gt;")
