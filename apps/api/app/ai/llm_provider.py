import os
import requests
from typing import Dict, Any, List
import json
from .intent import Intent, extract_search_params, extract_provider_name_for_quote
from .tools.search_providers import search_providers
from .tools.get_provider import get_provider
from .tools.compare_providers import compare_providers
from .tools.get_cost import get_cost
from .tools.get_case_status import get_case_status

class LLMProvider:
    def generate_response(self, intent: Intent, message: str, user_id: str) -> Dict[str, Any]:
        raise NotImplementedError

class FallbackProvider(LLMProvider):
    def generate_response(self, intent: Intent, message: str, user_id: str) -> Dict[str, Any]:
        """
        Deterministic fallback response generation.
        """
        if intent == Intent.PROVIDER_SEARCH:
            params = extract_search_params(message)
            providers = search_providers(params)
            return {
                "text": f"I found {len(providers)} published providers matching your search." if providers else "I could not find any published providers matching your criteria.",
                "data": {"providers": providers},
                "type": "PROVIDER_SEARCH_RESULT"
            }
            
        elif intent == Intent.PROVIDER_DETAILS:
            return {
                "text": "Please click 'View Profile' on a provider card to see details.",
                "type": "TEXT"
            }
            
        elif intent == Intent.PROVIDER_COMPARISON:
            return {
                "text": "Please use the 'Compare' functionality on the provider cards.",
                "type": "TEXT"
            }
            
        elif intent == Intent.COST_INFORMATION:
            return {
                "text": "To view cost estimates, please go to the provider's profile page.",
                "type": "TEXT"
            }
            
        elif intent == Intent.CASE_STATUS:
            cases = get_case_status(user_id)
            if not cases:
                return {
                    "text": "You do not have any open requests.",
                    "type": "TEXT"
                }
            return {
                "text": "Here is the status of your recent requests.",
                "data": {"cases": cases},
                "type": "CASE_STATUS_RESULT"
            }
            
        elif intent == Intent.QUOTE_HANDOFF:
            provider_name = extract_provider_name_for_quote(message)
            return {
                "text": f"I can help you request a quote from {provider_name}." if provider_name else "I can help you request a quote. Please navigate to the provider profile.",
                "data": {"action": "QUOTE_REQUEST", "providerName": provider_name},
                "type": "ACTION"
            }
            
        elif intent == Intent.GENERAL_HEALTH_INFORMATION:
            return {
                "text": "MedBridge provides general health information. For specific conditions, please consult a healthcare professional.",
                "type": "TEXT"
            }
            
        elif intent == Intent.HIGH_RISK_MEDICAL:
            return {
                "text": "I am an AI assistant and cannot provide medical diagnoses, prescriptions, or individualized medical advice. Please consult a qualified healthcare professional or seek emergency medical care if you are experiencing severe symptoms.",
                "type": "TEXT"
            }
            
        return {
            "text": "I am a MedBridge assistant. I can help you find providers, check case status, and request quotes.",
            "type": "TEXT"
        }

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.environ.get("OLLAMA_MODEL", "llama3.2:1b")
        
    def generate_response(self, intent: Intent, message: str, user_id: str) -> Dict[str, Any]:
        """
        Connects to local Ollama if available.
        """
        # We can implement a simple prompt structure.
        # But for reliability, if Ollama fails, we return None to let orchestrator fallback.
        try:
            # We won't strictly depend on Ollama succeeding.
            # In a full implementation, we'd format a system prompt with tool output.
            # Here, we will just use the Fallback for deterministic reliability if Ollama isn't active.
            
            # Simulated check
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            if response.status_code == 200:
                # We could call generate here. For this phase, if it's "available", 
                # we just use fallback for structured data anyway, as per instructions:
                # "Do not use LLMs for provider filtering... These must remain deterministic."
                # We'll just fall back directly for this implementation to ensure safety.
                pass
                
        except Exception:
            pass
            
        return None # Triggers fallback
