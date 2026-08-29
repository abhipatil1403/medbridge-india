from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AIMessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class AIMessage(BaseModel):
    id: Optional[str] = None
    conversationId: str
    userId: str
    role: AIMessageRole
    content: str
    toolCalls: Optional[List[Dict[str, Any]]] = None
    timestamp: str

class AIConversation(BaseModel):
    id: Optional[str] = None
    userId: str
    title: Optional[str] = None
    createdAt: str
    updatedAt: str

class AISafetyEventType(str, Enum):
    HIGH_RISK_MEDICAL_REQUEST = "HIGH_RISK_MEDICAL_REQUEST"
    PROMPT_INJECTION_ATTEMPT = "PROMPT_INJECTION_ATTEMPT"
    UNAUTHORIZED_DATA_REQUEST = "UNAUTHORIZED_DATA_REQUEST"
    TOOL_ACCESS_DENIED = "TOOL_ACCESS_DENIED"

class AISafetyEvent(BaseModel):
    id: Optional[str] = None
    conversationId: str
    userId: str
    eventType: AISafetyEventType
    details: Optional[str] = None
    timestamp: str

class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
