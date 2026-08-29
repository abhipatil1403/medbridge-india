from datetime import datetime
from app.core.firebase import get_db
import uuid

def detect_and_route_conflicts(candidate: dict, canonical_id: str, retrieved_at: str, source_id: str, raw_record_id: str) -> None:
    """
    Compares candidate fields against the canonical entity field-by-field.
    """
    db = get_db()
    canonical_ref = db.collection("hospitals").document(canonical_id)
    canonical_doc = canonical_ref.get()
    
    if not canonical_doc.exists:
        return
        
    canonical = canonical_doc.to_dict()
    now = datetime.utcnow().isoformat()
    
    # Define which fields we want to check for conflicts
    fields_to_check = [
        "name", "city", "state", "district", "pincode", "address", 
        "website", "telephone", "mobileNumber", "emergencyNumber", 
        "totalBeds", "category", "careType"
    ]
    
    has_conflicts = False
    
    for field in fields_to_check:
        cand_val = candidate.get(field)
        can_val = canonical.get(field)
        
        # We only care if candidate provided something useful. "0" usually means missing in OGD.
        if cand_val is None or cand_val == "" or cand_val == "0":
            continue
            
        if can_val is None or can_val == "" or can_val == "0":
            # Canonical is empty, candidate has a value -> treat as PENDING conflict to let reviewer approve
            _create_conflict(db, "HOSPITAL", canonical_id, field, can_val, cand_val, source_id, raw_record_id, retrieved_at, now)
            has_conflicts = True
        elif str(cand_val).strip().lower() != str(can_val).strip().lower():
            # Disagreement -> PENDING conflict
            _create_conflict(db, "HOSPITAL", canonical_id, field, can_val, cand_val, source_id, raw_record_id, retrieved_at, now)
            has_conflicts = True
        else:
            # Agreement -> Do nothing (or we could update provenance evidence array)
            # The prompt says: "Not every repeated value should create a conflict. AGREEMENT -> Increase source evidence. Do not create a conflict."
            _add_source_evidence(db, canonical_id, field, source_id, retrieved_at)
            
    # For list fields like specialties, treatments
    # For simplicity, if they differ, we can create a conflict on the entire array or handle individually.
    # The prompt doesn't strictly demand array merging conflict engine right now, but let's do it as a stringified list.
    
    list_fields = ["specialties", "treatments"]
    for field in list_fields:
        cand_val = candidate.get(field, [])
        can_val = canonical.get(field, [])
        
        if not cand_val:
            continue
            
        if not can_val:
            _create_conflict(db, "HOSPITAL", canonical_id, field, can_val, cand_val, source_id, raw_record_id, retrieved_at, now)
            has_conflicts = True
        else:
            # Compare sets
            cand_set = set([str(x).strip().lower() for x in cand_val])
            can_set = set([str(x).strip().lower() for x in can_val])
            
            # If candidate has anything not in canonical, it's a conflict
            if not cand_set.issubset(can_set):
                _create_conflict(db, "HOSPITAL", canonical_id, field, can_val, cand_val, source_id, raw_record_id, retrieved_at, now)
                has_conflicts = True
            else:
                _add_source_evidence(db, canonical_id, field, source_id, retrieved_at)
                
def _create_conflict(db, entity_type, entity_id, field_name, can_val, cand_val, source_id, raw_record_id, retrieved_at, now):
    # Check if a pending conflict already exists for this field
    query = db.collection("fieldConflicts") \
        .where("entityId", "==", entity_id) \
        .where("fieldName", "==", field_name) \
        .where("status", "==", "PENDING") \
        .limit(1).stream()
        
    existing_conflict = None
    for doc in query:
        existing_conflict = doc
        break
        
    candidate_val_obj = {
        "sourceId": source_id,
        "value": cand_val,
        "sourceRecordId": f"src_rec_{raw_record_id}",
        "retrievedAt": retrieved_at
    }
        
    if existing_conflict:
        # Append to existing
        doc_ref = existing_conflict.reference
        data = existing_conflict.to_dict()
        candidate_values = data.get("candidateValues", [])
        
        # Deduplicate identical source submissions
        exists = False
        for cv in candidate_values:
            if cv.get("sourceId") == source_id and cv.get("value") == cand_val:
                exists = True
                break
                
        if not exists:
            candidate_values.append(candidate_val_obj)
            doc_ref.update({"candidateValues": candidate_values})
    else:
        # Create new
        db.collection("fieldConflicts").add({
            "entityType": entity_type,
            "entityId": entity_id,
            "fieldName": field_name,
            "canonicalValue": can_val,
            "candidateValues": [candidate_val_obj],
            "status": "PENDING",
            "detectedAt": now
        })

def _add_source_evidence(db, entity_id, field_name, source_id, retrieved_at):
    """
    Records that a source agreed with the canonical value.
    Updates the _provenance map on the canonical hospital.
    """
    doc_ref = db.collection("hospitals").document(entity_id)
    doc_snap = doc_ref.get()
    
    if doc_snap.exists:
        data = doc_snap.to_dict()
        provenance = data.get("_provenance", {})
        
        # Structure: { fieldName: { sourceId: retrievedAt, ... } }
        # Let's keep it simple: provenance[field_name] = { ... }
        field_prov = provenance.get(field_name, {})
        
        if field_prov.get("sourceId") != source_id:
            # If we want a list, we'd do it differently. 
            # To match the frontend expectation: Object.values(hospital._provenance).map(p => p.sourceId)
            # This implies _provenance is something like:
            # { "someKey": { "sourceId": "x", "retrievedAt": "y" } }
            # So let's use a unique key for the evidence
            evidence_key = f"{field_name}_{source_id}"
            provenance[evidence_key] = {
                "sourceId": source_id,
                "retrievedAt": retrieved_at,
                "field": field_name
            }
            doc_ref.update({"_provenance": provenance})
