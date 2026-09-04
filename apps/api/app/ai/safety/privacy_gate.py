import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Note: This is a prototype privacy gate using regex and heuristics.
# It is NOT a substitute for formal HIPAA/GDPR or other regulatory compliance.
# It should be replaced with a robust NLP/DLP solution in production.

class PrivacyGate:
    """
    Local privacy and safety gate.
    Inspects user input to detect and redact sensitive PII before it leaves our infrastructure.
    """
    
    # Common Regex Patterns for basic PII redaction
    PATTERNS = {
        'EMAIL': r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
        # Basic Indian/International phone number heuristics
        'PHONE': r'(?:\+?91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}',
        'GENERIC_PHONE': r'(?:\+\d{1,3}[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4}',
        # Basic Aadhaar heuristic (12 digits, often spaced 4x4x4)
        'AADHAAR': r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b',
        # Basic Indian Passport heuristic (1 letter followed by 7 digits)
        'PASSPORT': r'\b[A-Z][1-9]\d\s?\d{4}[1-9]\b'
    }

    @classmethod
    def redact_text(cls, text: str) -> str:
        """
        Redacts PII from a given string using regex patterns.
        """
        if not text:
            return text
            
        redacted = text
        
        # Redact Emails
        redacted = re.sub(cls.PATTERNS['EMAIL'], '[EMAIL_REDACTED]', redacted)
        
        # Redact Phones
        redacted = re.sub(cls.PATTERNS['PHONE'], '[PHONE_REDACTED]', redacted)
        redacted = re.sub(cls.PATTERNS['GENERIC_PHONE'], '[PHONE_REDACTED]', redacted)
        
        # Redact Aadhaar
        redacted = re.sub(cls.PATTERNS['AADHAAR'], '[ID_REDACTED]', redacted)
        
        # Redact Passport
        redacted = re.sub(cls.PATTERNS['PASSPORT'], '[ID_REDACTED]', redacted)
        
        return redacted

    @classmethod
    def sanitize_payload(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively sanitizes a JSON payload (e.g. chat messages).
        """
        sanitized = {}
        for key, value in payload.items():
            if isinstance(value, str):
                sanitized[key] = cls.redact_text(value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_payload(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.sanitize_payload(item) if isinstance(item, dict) 
                    else cls.redact_text(item) if isinstance(item, str) 
                    else item 
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized

    @classmethod
    def build_safe_context(cls, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Constructs a minimal context object containing ONLY non-sensitive information 
        required for the current conversation. Prevents leaking full profiles.
        """
        # Explicitly select allowed fields
        safe_keys = [
            'treatmentId',
            'preferredCity',
            'budgetMax',
            'accompanyingPeople',
            'requiresAccommodation',
            'requiresLocalTransport',
            'travelDuration'
        ]
        
        safe_context = {
            key: requirements.get(key) for key in safe_keys if key in requirements
        }
        
        return safe_context
