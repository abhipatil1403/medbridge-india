import hashlib
import uuid
from datetime import datetime
from .models.jobs import RawRecord
from app.core.firebase import get_db, get_bucket

def calculate_content_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def store_raw_payload(source_id: str, job_id: str, content_hash: str, payload: str, is_json: bool = True) -> str:
    import os
    
    # [STAGING / DEVELOPMENT ONLY]
    # Firebase Storage is deferred because the staging project requires the Blaze plan.
    # We use local artifact storage to preserve the OGD pipeline without a paid dependency.
    ext = "json" if is_json else "html"
    base_dir = os.path.join(os.getcwd(), ".data", "raw_artifacts")
    storage_path = os.path.join(base_dir, source_id, job_id)
    os.makedirs(storage_path, exist_ok=True)
    
    file_path = os.path.join(storage_path, f"{content_hash}.{ext}")
    
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(payload)
            
    # Return a pseudo-URI for Firestore tracking
    return f"local://{source_id}/{job_id}/{content_hash}.{ext}"

def create_raw_record(job_id: str, source_id: str, content_hash: str, storage_path: str, external_identifier: str = "") -> RawRecord:
    now = datetime.utcnow().isoformat()
    record = RawRecord(
        rawRecordId=f"raw_{uuid.uuid4().hex}",
        jobId=job_id,
        sourceId=source_id,
        externalIdentifier=external_identifier,
        contentHash=content_hash,
        contentType="application/json",
        retrievedAt=now,
        storagePath=storage_path,
        createdAt=now
    )
    
    db = get_db()
    db.collection("rawRecords").document(record.rawRecordId).set(record.model_dump())
    return record
