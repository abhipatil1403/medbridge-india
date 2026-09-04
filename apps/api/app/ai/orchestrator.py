from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import json
from app.core.firebase import get_db
from .intent import extract_intent, Intent
from .safety import is_prompt_injection, log_safety_event
from .safety.privacy_gate import PrivacyGate
from .llm_provider import get_llm_provider
from app.schemas.ai import AISafetyEventType

class AIOrchestrator:
    def __init__(self):
        self.provider = get_llm_provider()
        
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
                "updatedAt": datetime.utcnow().isoformat(),
                "requirements": {}
            })
            requirements = {}
        else:
            conv_doc = self.db.collection("aiConversations").document(conversation_id).get()
            if not conv_doc.exists or conv_doc.to_dict().get("userId") != user_id:
                conversation_id = str(uuid.uuid4())
                self.db.collection("aiConversations").document(conversation_id).set({
                    "userId": user_id,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat(),
                    "requirements": {}
                })
                requirements = {}
            else:
                requirements = conv_doc.to_dict().get("requirements", {})
            
        # Store original user message
        self._store_message(conversation_id, user_id, "user", message)
        
        # 2. Safety Check (Injection)
        if is_prompt_injection(message):
            log_safety_event(conversation_id, user_id, AISafetyEventType.PROMPT_INJECTION_ATTEMPT, message)
            return self._return_static_response("I cannot fulfill this request.", conversation_id, user_id)
            
        # 3. Privacy Gate (Data Minimization & Redaction)
        safe_message = PrivacyGate.redact_text(message)
        safe_requirements = PrivacyGate.build_safe_context(requirements)
        
        # 4. Intent Classification
        intent = self.provider.classify_intent(safe_message)
        
        if intent == Intent.HIGH_RISK_MEDICAL:
            log_safety_event(conversation_id, user_id, AISafetyEventType.HIGH_RISK_MEDICAL_REQUEST, safe_message)
            return self._return_static_response(
                "I am an AI assistant and cannot provide medical diagnoses, prescriptions, or individualized medical advice. Please consult a qualified healthcare professional or seek emergency medical care if you are experiencing severe symptoms.",
                conversation_id, user_id
            )
            
        # 5. Extract Requirements
        updated_requirements = self.provider.extract_requirements(safe_message, safe_requirements)
        if updated_requirements != requirements:
            self.db.collection("aiConversations").document(conversation_id).update({
                "requirements": updated_requirements,
                "updatedAt": datetime.utcnow().isoformat()
            })
            
        # 6. Generate Response
        system_prompt = "You are an assistant helping a patient collect requirements for medical travel. You do not make medical decisions."
        llm_response = self.provider.generate_response(system_prompt, safe_message, updated_requirements)
        
        return self._return_dynamic_response(llm_response, conversation_id, user_id, updated_requirements)
        
    def _return_static_response(self, text: str, conversation_id: str, user_id: str) -> Dict[str, Any]:
        self._store_message(conversation_id, user_id, "assistant", text)
        return {
            "text": text,
            "type": "TEXT",
            "conversationId": conversation_id
        }
        
    def _return_dynamic_response(self, text: str, conversation_id: str, user_id: str, requirements: Dict[str, Any]) -> Dict[str, Any]:
        self._store_message(conversation_id, user_id, "assistant", text)
        return {
            "text": text,
            "type": "AI_REQUIREMENTS_UPDATE",
            "data": {"requirements": requirements},
            "conversationId": conversation_id
        }

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
