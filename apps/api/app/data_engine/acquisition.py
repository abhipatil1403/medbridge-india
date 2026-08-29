import hashlib
import uuid
from datetime import datetime
from .models.jobs import RawRecord
from app.core.firebase import get_db, get_bucket

def calculate_content_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def store_raw_payload(source_id: str, job_id: str, content_hash: str, payload: str, is_json: bool = True) -> str:
    bucket = get_bucket()
    ext = "json" if is_json else "html"
    storage_path = f"raw-data/{source_id}/{job_id}/{content_hash}.{ext}"
    blob = bucket.blob(storage_path)
    
    if not blob.exists():
        blob.upload_from_string(payload, content_type="application/json" if is_json else "text/html")
        
    return storage_path

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
