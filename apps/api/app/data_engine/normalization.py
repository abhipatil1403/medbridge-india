import uuid
from datetime import datetime
from typing import Dict, Any
from .models.jobs import NormalizationRecord
from app.core.firebase import get_db

def create_normalization_record(raw_record_id: str, source_id: str, entity_type: str, external_id: str, normalized_data: Dict[str, Any]) -> NormalizationRecord:
    now = datetime.utcnow().isoformat()
    record = NormalizationRecord(
        normalizationRecordId=f"norm_{uuid.uuid4().hex}",
        rawRecordId=raw_record_id,
        sourceId=source_id,
        entityType=entity_type,
        externalIdentifier=external_id,
        normalizedData=normalized_data,
        normalizationStatus="PENDING",
        createdAt=now,
        updatedAt=now
    )
    
    db = get_db()
    db.collection("normalizationRecords").document(record.normalizationRecordId).set(record.model_dump())
    return record
