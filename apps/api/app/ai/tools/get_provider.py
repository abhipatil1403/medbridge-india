from typing import Dict, Any, Optional
from app.core.firebase import get_db

import re

def get_provider(provider_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed customer-safe information for a specific published provider.
    """
    # Sanitize provider_id to prevent path traversal
    if not re.match(r'^[a-zA-Z0-9_-]+$', provider_id):
        return None
        
    db = get_db()
    doc = db.collection("hospitals").document(provider_id).get()
    
    if not doc.exists:
        return None
        
    data = doc.to_dict()
    
    # Must be published
    if data.get("status") != "PUBLISHED":
        return None
        
    # Return sanitized fields
    return {
        "id": doc.id,
        "name": data.get("name"),
        "city": data.get("city"),
        "state": data.get("state"),
        "district": data.get("district"),
        "town": data.get("town"),
        "village": data.get("village"),
        "specialties": data.get("specialties", []),
        "facilities": data.get("facilities", []),
        "systemsOfMedicine": data.get("systemsOfMedicine", []),
        "careType": data.get("careType"),
        "category": data.get("category"),
        "beds": data.get("beds"),
        "website": data.get("website"),
        "telephone": data.get("telephone"),
        "emergencyNumber": data.get("emergencyNumber"),
        "source": data.get("source"),
        "retrievedAt": data.get("retrievedAt")
    }
