from typing import Dict, Any, Optional
from datetime import datetime
import uuid
from app.core.firebase import get_db
from .intent import extract_intent, Intent
from .safety import is_prompt_injection, log_safety_event
from .llm_provider import OllamaProvider, FallbackProvider
from app.schemas.ai import AISafetyEventType

class AIOrchestrator:
    def __init__(self):
        self.primary_provider = OllamaProvider()
        self.fallback_provider = FallbackProvider()
        
    @property
    def db(self):
        return get_db()
        
    def process_message(self, user_id: str, message: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entry point for AI processing.
        """
        # 1. Conversation Management
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            self.db.collection("aiConversations").document(conversation_id).set({
                "userId": user_id,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            })
        else:
            # Verify ownership
            conv_doc = self.db.collection("aiConversations").document(conversation_id).get()
            if not conv_doc.exists or conv_doc.to_dict().get("userId") != user_id:
                # If malicious/invalid ID provided, create a new one to fail safely and isolate
                conversation_id = str(uuid.uuid4())
                self.db.collection("aiConversations").document(conversation_id).set({
                    "userId": user_id,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat()
                })
            
        # Store user message
        self._store_message(conversation_id, user_id, "user", message)
        
        # 2. Safety Check
        if is_prompt_injection(message):
            log_safety_event(conversation_id, user_id, AISafetyEventType.PROMPT_INJECTION_ATTEMPT, message)
            response = {
                "text": "I cannot fulfill this request.",
                "type": "TEXT"
            }
            self._store_message(conversation_id, user_id, "assistant", response["text"])
            return response
            
        # 3. Intent Extraction
        intent = extract_intent(message)
        
        if intent == Intent.HIGH_RISK_MEDICAL:
            log_safety_event(conversation_id, user_id, AISafetyEventType.HIGH_RISK_MEDICAL_REQUEST, message)
            response = {
                "text": "I am an AI assistant and cannot provide medical diagnoses, prescriptions, or individualized medical advice. Please consult a qualified healthcare professional or seek emergency medical care if you are experiencing severe symptoms.",
                "type": "TEXT"
            }
            self._store_message(conversation_id, user_id, "assistant", response["text"])
            return response
            
        # 4. Generate Response via Providers
        response = self.primary_provider.generate_response(intent, message, user_id)
        if not response:
            response = self.fallback_provider.generate_response(intent, message, user_id)
            
        # 5. Store and Return Assistant Response
        self._store_message(conversation_id, user_id, "assistant", response["text"])
        response["conversationId"] = conversation_id
        
        return response
        
    def _store_message(self, conversation_id: str, user_id: str, role: str, content: str):
        message_data = {
            "conversationId": conversation_id,
            "userId": user_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.db.collection("aiMessages").add(message_data)
        self.db.collection("aiConversations").document(conversation_id).update({
            "updatedAt": datetime.utcnow().isoformat()
        })
