from typing import Dict, Any, List
from app.core.firebase import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

def search_providers(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Deterministically search for published providers based on safe criteria.
    """
    db = get_db()
    query = db.collection("hospitals").where(filter=FieldFilter("status", "==", "PUBLISHED"))
    
    # Simple deterministic exact-match filtering
    # In a real system, we'd use Meilisearch or a text index for generic queries.
    # We will do exact matching on the fields for now.
    
    if "state" in params:
        query = query.where(filter=FieldFilter("state", "==", params["state"]))
    if "city" in params:
        query = query.where(filter=FieldFilter("city", "==", params["city"]))
    if "district" in params:
        query = query.where(filter=FieldFilter("district", "==", params["district"]))
    if "careType" in params:
        query = query.where(filter=FieldFilter("careType", "==", params["careType"]))
    if "category" in params:
        query = query.where(filter=FieldFilter("category", "==", params["category"]))
    
    results = []
    docs = query.limit(20).stream()
    
    specialty_filter = params.get("specialty")
    facility_filter = params.get("facilities")
    name_filter = params.get("query")
    
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        
        # Post-query array contains filter (since Firestore Python has limited array-contains limits per query)
        if specialty_filter and specialty_filter.lower() not in [s.lower() for s in data.get("specialties", [])]:
            continue
            
        if facility_filter and facility_filter.lower() not in [f.lower() for f in data.get("facilities", [])]:
            continue
            
        if name_filter and name_filter.lower() not in data.get("name", "").lower():
            continue
            
        # Strip unsafe fields before returning to LLM
        safe_data = {
            "id": data.get("id"),
            "name": data.get("name"),
            "city": data.get("city"),
            "state": data.get("state"),
            "district": data.get("district"),
            "specialties": data.get("specialties", []),
            "facilities": data.get("facilities", []),
            "careType": data.get("careType"),
            "category": data.get("category"),
            "beds": data.get("beds"),
            "source": data.get("source"),
            "retrievedAt": data.get("retrievedAt")
        }
        results.append(safe_data)
        
    return results[:5] # Limit results to not overload prompt
