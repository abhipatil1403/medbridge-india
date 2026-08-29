from typing import List, Dict, Any
from .get_provider import get_provider

def compare_providers(provider_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Compare up to 3 published providers. Returns a list of provider details.
    """
    if not provider_ids:
        return []
        
    # Limit to 3 providers
    safe_ids = provider_ids[:3]
    
    results = []
    for pid in safe_ids:
        prov = get_provider(pid)
        if prov:
            results.append(prov)
            
    return results
