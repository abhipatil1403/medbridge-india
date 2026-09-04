from typing import Any
from app.core.firebase import get_db
from datetime import datetime

def create_provenance_records(candidate: Any, match_id: str, match_level: str, norm_record_id: str) -> None:
    """
    Creates sourceRecords and routes conflicts to acquisitionReviews if necessary.
    This implementation simulates sending the candidate to the review queue.
    """
    db = get_db()
    now = datetime.utcnow().isoformat()
    
    # Determine entity type from candidate class name
    cls_name = type(candidate).__name__
    if cls_name == "TreatmentCandidate":
        entity_type = "TREATMENT"
    elif cls_name == "ProviderServiceCandidate":
        entity_type = "PROVIDER_SERVICE"
    else:
        entity_type = "HOSPITAL"
    
    # 1. Create a sourceRecord
    # Make ID unique per candidate
    source_record_id = f"src_rec_{candidate.rawRecordId}_{candidate.externalIdentifier}"
    db.collection("sourceRecords").document(source_record_id).set({
        "sourceId": candidate.sourceId,
        "rawRecordId": candidate.rawRecordId,
        "entityType": entity_type,
        "entityId": match_id if match_level == "EXACT_MATCH" else None,
        "retrievedAt": candidate.retrievedAt,
        "verificationStatus": "UNVERIFIED",
        "createdAt": now
    })
    
    # 2. Check for existing PENDING review for this source and candidate to prevent duplicates
    if not hasattr(create_provenance_records, "_pending_cache"):
        create_provenance_records._pending_cache = set()
        existing_reviews = db.collection("acquisitionReviews") \
            .where("sourceId", "==", candidate.sourceId) \
            .where("status", "==", "PENDING") \
            .stream()
        for review_doc in existing_reviews:
            ext_id = review_doc.to_dict().get("candidateData", {}).get("externalIdentifier")
            if ext_id:
                create_provenance_records._pending_cache.add(ext_id)
                
    if candidate.externalIdentifier in create_provenance_records._pending_cache:
        return
            
    # 3. Pipeline generates an AcquisitionReview for all records, so human reviewer can approve
    # exact matches (fields might differ) or link NO_MATCH / PROBABLE_MATCH.
    
    # Phase 7 Update: EXACT_MATCHes are routed to FieldConflicts engine instead of a full entity AcquisitionReview
    if match_level == "EXACT_MATCH":
        return
        
    db.collection("acquisitionReviews").add({
        "sourceId": candidate.sourceId,
        "rawRecordId": candidate.rawRecordId,
        "normalizationRecordId": norm_record_id,
        "entityType": entity_type,
        "entityId": match_id if match_level == "EXACT_MATCH" else None,
        "matchType": match_level,
        "status": "PENDING",
        "candidateData": candidate.model_dump(),
        "retrievedAt": candidate.retrievedAt,
        "createdAt": now
    })
    create_provenance_records._pending_cache.add(candidate.externalIdentifier)

