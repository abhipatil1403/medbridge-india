from typing import Dict, Any, Optional
from app.core.firebase import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

import re

def get_cost(provider_id: str, treatment_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Get published cost estimates for a provider.
    """
    if not re.match(r'^[a-zA-Z0-9_-]+$', provider_id):
        return {"status": "INVALID_PROVIDER_ID", "estimates": []}
        
    db = get_db()
    
    query = db.collection("costEstimates").where(filter=FieldFilter("hospitalId", "==", provider_id)).where(filter=FieldFilter("status", "==", "PUBLISHED"))
    
    estimates = []
    for doc in query.stream():
        data = doc.to_dict()
        
        # If treatment_name is provided, do a basic fuzzy match
        if treatment_name:
            t_name = data.get("treatmentName", "").lower()
            if treatment_name.lower() not in t_name:
                continue
                
        estimates.append({
            "id": doc.id,
            "treatmentName": data.get("treatmentName"),
            "currency": data.get("currency"),
            "minAmount": data.get("minAmount"),
            "maxAmount": data.get("maxAmount"),
            "inclusions": data.get("inclusions", []),
            "exclusions": data.get("exclusions", [])
        })
        
    if not estimates:
        return {"status": "NO_PUBLISHED_ESTIMATE", "estimates": []}
        
    return {"status": "SUCCESS", "estimates": estimates}
