from typing import List, Dict, Any
from app.core.firebase import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

def get_case_status(user_id: str) -> List[Dict[str, Any]]:
    """
    Get customer-safe case statuses for the authenticated user.
    """
    db = get_db()
    
    query = db.collection("cases").where(filter=FieldFilter("patientId", "==", user_id))
    
    results = []
    for doc in query.stream():
        data = doc.to_dict()
        
        # Only return customer-safe fields
        results.append({
            "id": doc.id,
            "providerName": data.get("providerName"),
            "treatmentName": data.get("treatmentName"),
            "currentStage": data.get("currentStage"),
            "createdAt": data.get("createdAt"),
            "updatedAt": data.get("updatedAt")
        })
        
    return results
