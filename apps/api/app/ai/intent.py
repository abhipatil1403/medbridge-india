from enum import Enum
import re
from typing import Dict, Any

class Intent(str, Enum):
    PROVIDER_SEARCH = "PROVIDER_SEARCH"
    PROVIDER_DETAILS = "PROVIDER_DETAILS"
    PROVIDER_COMPARISON = "PROVIDER_COMPARISON"
    COST_INFORMATION = "COST_INFORMATION"
    CASE_STATUS = "CASE_STATUS"
    QUOTE_HANDOFF = "QUOTE_HANDOFF"
    GENERAL_HEALTH_INFORMATION = "GENERAL_HEALTH_INFORMATION"
    HIGH_RISK_MEDICAL = "HIGH_RISK_MEDICAL"
    UNSUPPORTED = "UNSUPPORTED"

def extract_intent(message: str) -> Intent:
    """
    Deterministic intent extraction.
    """
    text = message.lower()
    
    # 1. High risk medical (safety first)
    high_risk_patterns = [
        "diagnose", "prescription", "dosage", "what medicine", 
        "which drug", "symptoms", "i feel dizzy", "chest pain"
    ]
    if any(p in text for p in high_risk_patterns):
        return Intent.HIGH_RISK_MEDICAL
        
    # 2. Case status
    case_patterns = ["my request", "my case", "status of my quote", "what happened to my request", "case status"]
    if any(p in text for p in case_patterns):
        return Intent.CASE_STATUS
        
    # 3. Quote handoff
    quote_patterns = ["i want a quote from", "request a quote", "get a quote from"]
    if any(p in text for p in quote_patterns):
        return Intent.QUOTE_HANDOFF
        
    # 4. Cost
    cost_patterns = ["cost", "price", "estimate", "how much"]
    if any(p in text for p in cost_patterns):
        return Intent.COST_INFORMATION
        
    # 5. Comparison
    compare_patterns = ["compare", "difference between"]
    if any(p in text for p in compare_patterns):
        return Intent.PROVIDER_COMPARISON
        
    # 6. Provider Search
    search_patterns = ["find hospital", "hospitals in", "doctors in", "show hospitals", "find cardiology"]
    if any(p in text for p in search_patterns):
        return Intent.PROVIDER_SEARCH
        
    # 7. General Health
    health_patterns = ["what is", "how does", "what does"]
    if any(p in text for p in health_patterns):
        return Intent.GENERAL_HEALTH_INFORMATION
        
    return Intent.UNSUPPORTED

def extract_search_params(message: str) -> Dict[str, Any]:
    """
    Extract basic search parameters deterministically.
    """
    params = {}
    text = message.lower()
    
    # Simple extraction for demo purposes
    if "pune" in text:
        params["city"] = "Pune"
    if "chennai" in text:
        params["city"] = "Chennai"
    if "cardiology" in text:
        params["specialty"] = "Cardiology"
    if "oncology" in text:
        params["specialty"] = "Oncology"
        
    return params

def extract_provider_name_for_quote(message: str) -> str:
    """
    Extract provider name for quote request.
    Example: "I want a quote from Apollo Hospital" -> "Apollo Hospital"
    """
    # Dummy implementation for deterministic fallback
    match = re.search(r'quote from ([\w\s]+)', message, re.IGNORECASE)
    if match:
        return match.group(1).strip().title()
    return ""
