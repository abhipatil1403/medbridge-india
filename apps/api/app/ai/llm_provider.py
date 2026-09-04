import os
import json
from abc import ABC, abstractmethod
from typing import Dict, Any
from .intent import Intent

class LLMProvider(ABC):
    """
    Abstract interface for LLM operations.
    Decouples the application from any specific provider (Gemini, OpenAI, Groq, etc).
    """

    @abstractmethod
    def generate_response(self, system_prompt: str, user_prompt: str, context: Dict[str, Any] = None) -> str:
        """
        Generate a conversational response.
        """
        pass

    @abstractmethod
    def classify_intent(self, user_input: str) -> Intent:
        """
        Classify the intent of the user's message.
        """
        pass

    @abstractmethod
    def extract_requirements(self, user_input: str, current_requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured requirements from conversational input.
        """
        pass


# Concrete Implementation
class DummyLLMProvider(LLMProvider):
    """
    A dummy provider that demonstrates the abstraction and acts as a placeholder
    until a real API (like Gemini) is fully connected.
    """
    def __init__(self):
        self.api_key = os.environ.get('LLM_API_KEY')

    def generate_response(self, system_prompt: str, user_prompt: str, context: Dict[str, Any] = None) -> str:
        return f"This is a response generated based on your prompt and context: {json.dumps(context)}"

    def classify_intent(self, user_input: str) -> Intent:
        # Simple heuristic for dummy
        user_input_lower = user_input.lower()
        if 'search' in user_input_lower or 'find' in user_input_lower:
            return Intent.PROVIDER_SEARCH
        elif 'cost' in user_input_lower or 'price' in user_input_lower:
            return Intent.COST_INFORMATION
        return Intent.GENERAL_HEALTH_INFORMATION

    def extract_requirements(self, user_input: str, current_requirements: Dict[str, Any]) -> Dict[str, Any]:
        # Dummy extraction
        extracted = dict(current_requirements)
        if 'mumbai' in user_input.lower():
            extracted['preferredCity'] = 'Mumbai'
        if 'cardiology' in user_input.lower():
            extracted['treatmentName'] = 'Cardiology'
        return extracted


def get_llm_provider() -> LLMProvider:
    """
    Factory function to get the configured LLM provider.
    """
    provider_name = os.environ.get('LLM_PROVIDER', 'dummy').lower()
    
    if provider_name == 'dummy':
        return DummyLLMProvider()
    else:
        # Default fallback
        return DummyLLMProvider()
