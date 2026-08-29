import uuid
from datetime import datetime
from app.core.firebase import get_db
from .adapters.fixture_adapter import FixtureHospitalAdapter
from .adapters.ogd_hospital_adapter import OgdHospitalAdapter
from .acquisition import calculate_content_hash, store_raw_payload, create_raw_record
from .normalization import create_normalization_record
from .validation import validate_hospital_candidate, update_normalization_status
from .deduplication import deduplicate_hospital
from .provenance import create_provenance_records

def update_job_status(job_id: str, updates: dict):
    db = get_db()
    updates["updatedAt"] = datetime.utcnow().isoformat()
    db.collection("acquisitionJobs").document(job_id).update(updates)

def run_pipeline(source_id: str):
    db = get_db()
    job_id = f"job_{uuid.uuid4().hex}"
    now = datetime.utcnow().isoformat()
    
    # 1. Create Job
    db.collection("acquisitionJobs").document(job_id).set({
        "jobId": job_id,
        "sourceId": source_id,
        "status": "RUNNING",
        "startedAt": now,
        "recordsFound": 0,
        "recordsParsed": 0,
        "recordsAccepted": 0,
        "recordsExcluded": 0,
        "recordsRejected": 0,
        "recordsChanged": 0,
        "recordsUnchanged": 0,
        "errorCount": 0,
        "errorMessage": None,
        "createdAt": now,
        "updatedAt": now
    })
    
    # Update source lastCheckedAt and lastJobId
    source_ref = db.collection("sources").document(source_id)
    source_doc = source_ref.get()
    
    if not source_doc.exists:
        # We allow fixture to run even if not in DB for dev purposes, but ideally we'd fail
        pass
    else:
        source_data = source_doc.to_dict()
        if source_data.get("status") == "INACTIVE" or source_data.get("health") == "DISABLED":
            update_job_status(job_id, {"status": "FAILED", "errorMessage": "SOURCE_DISABLED"})
            print("Source is disabled or inactive. Aborting.")
            return
            
        source_ref.update({
            "lastCheckedAt": now,
            "lastJobId": job_id
        })

    # Fetch last successful job for this source
    last_job = None
    last_jobs_query = db.collection("acquisitionJobs").where("sourceId", "==", source_id).where("status", "in", ["COMPLETED", "PARTIAL", "UNCHANGED"]).order_by("startedAt", direction="DESCENDING").limit(1).stream()
    for doc in last_jobs_query:
        last_job = doc.to_dict()
    
    # 2. Select Adapter
    if source_id == "src_fixture_001":
        adapter = FixtureHospitalAdapter()
    elif source_id == "ogd_national_hospital_directory":
        # Usually URL is kept in DB, but we fetch from a known endpoint or use the DB url if present.
        # Hardcoding the OGD url for adapter initialization if DB url isn't found.
        url = source_doc.to_dict().get("url") if source_doc.exists else "https://data.gov.in/files/ogdpv2dws/s3fs-public/hospital_directory.csv"
        adapter = OgdHospitalAdapter(url)
    else:
        error_msg = f"No adapter for source {source_id}"
        update_job_status(job_id, {"status": "FAILED", "errorMessage": error_msg})
        if source_doc.exists:
            _update_source_failure(source_ref, source_doc.to_dict(), now, error_msg)
        return
        
    try:
        # 3. Fetch
        payload = adapter.fetch()
        content_hash = calculate_content_hash(payload)
        update_job_status(job_id, {"contentHash": content_hash})
        
        # Hash change check
        if last_job and last_job.get("contentHash") == content_hash:
            update_job_status(job_id, {
                "status": "UNCHANGED", 
                "completedAt": datetime.utcnow().isoformat(),
                "recordsFound": last_job.get("recordsFound", 0),
                "recordsUnchanged": last_job.get("recordsFound", 0)
            })
            if source_doc.exists:
                _update_source_success(source_ref, now)
            print("Source content unchanged. Aborting downstream processing.")
            return
            
        # Store raw payload
        storage_path = store_raw_payload(source_id, job_id, content_hash, payload)
        
        # Create raw record
        raw_record = create_raw_record(job_id, source_id, content_hash, storage_path)
        
        # 4. Parse
        parsed_items = adapter.parse(payload)
        records_found = len(parsed_items)
        update_job_status(job_id, {"recordsFound": records_found, "recordsParsed": records_found})
        
        # Anomaly Detection
        if last_job and last_job.get("recordsFound", 0) > 0:
            last_count = last_job["recordsFound"]
            ratio = records_found / last_count
            diff = abs(records_found - last_count)
            
            if diff > 10 and (ratio < 0.2 or ratio > 5.0):
                error_msg = f"ANOMALOUS_RECORD_COUNT: Found {records_found}, previously {last_count}"
                update_job_status(job_id, {"status": "FAILED", "errorMessage": error_msg})
                if source_doc.exists:
                    _update_source_failure(source_ref, source_doc.to_dict(), now, error_msg)
                print(error_msg)
                return
            elif ratio < 0.9:
                print(f"SOURCE_DISAPPEARANCE Warning: Count dropped from {last_count} to {records_found}")
        
        accepted = 0
        rejected = 0
        excluded = 0
        errors = 0
        
        excluded_by_care_type = {}
        
        for item in parsed_items:
            try:
                # 5. Normalize
                normalized_data = adapter.normalize(item, raw_record.retrievedAt, raw_record.rawRecordId)
                if normalized_data and normalized_data.get("_exclude"):
                    excluded += 1
                    care_type = normalized_data.get("careType") or "UNKNOWN"
                    excluded_by_care_type[care_type] = excluded_by_care_type.get(care_type, 0) + 1
                    continue
                    
                norm_record = create_normalization_record(raw_record.rawRecordId, source_id, "HOSPITAL", normalized_data.get("externalIdentifier", ""), normalized_data)
                
                # 6. Validate
                candidate, val_errors = validate_hospital_candidate(norm_record)
                if val_errors:
                    update_normalization_status(norm_record.normalizationRecordId, "REJECTED", val_errors)
                    rejected += 1
                    continue
                    
                update_normalization_status(norm_record.normalizationRecordId, "VALIDATED")
                
                # 7. Deduplicate
                match_level, match_id = deduplicate_hospital(candidate)
                
                # 8. Provenance / Review Routing
                create_provenance_records(candidate, match_id, match_level.value, norm_record.normalizationRecordId)
                
                if match_level.value == "EXACT_MATCH" and match_id:
                    # Phase 7: Field-by-field conflict detection
                    from .conflict_detection import detect_and_route_conflicts
                    detect_and_route_conflicts(
                        candidate.model_dump(), 
                        match_id, 
                        candidate.retrievedAt,
                        candidate.sourceId,
                        candidate.rawRecordId
                    )
                else:
                    # Ensure it goes to acquisitionReviews for PROBABLE_MATCH, POSSIBLE_MATCH, NO_MATCH
                    # (This is already handled inside create_provenance_records)
                    pass

                accepted += 1
                
            except Exception as e:
                errors += 1
                print(f"Error processing item: {e}")
                
        # Finish Job
        status = "COMPLETED"
        if errors > 0 and accepted > 0:
            status = "PARTIAL"
        elif accepted == 0 and rejected > 0:
            status = "FAILED"
            
        update_job_status(job_id, {
            "status": status,
            "completedAt": datetime.utcnow().isoformat(),
            "recordsAccepted": accepted,
            "recordsRejected": rejected,
            "recordsExcluded": excluded,
            "excludedByCareType": excluded_by_care_type,
            "recordsChanged": accepted, # simplified for now
            "errorCount": errors
        })
        
        if source_doc.exists:
            _update_source_success(source_ref, datetime.utcnow().isoformat())
            
        print(f"Pipeline completed with status {status}. Accepted: {accepted}, Rejected: {rejected}, Excluded: {excluded}")
        
    except Exception as e:
        error_msg = str(e)
        update_job_status(job_id, {
            "status": "FAILED",
            "completedAt": datetime.utcnow().isoformat(),
            "errorMessage": error_msg
        })
        if source_doc.exists:
            _update_source_failure(source_ref, source_doc.to_dict(), datetime.utcnow().isoformat(), error_msg)
        print(f"Pipeline failed: {e}")

def _update_source_success(source_ref, now):
    source_ref.update({
        "lastSuccessfulAt": now,
        "consecutiveFailures": 0,
        "health": "HEALTHY",
        "updatedAt": now
    })

def _update_source_failure(source_ref, source_data, now, error_msg):
    failures = source_data.get("consecutiveFailures", 0) + 1
    health = "FAILING" if failures >= 3 else "WARNING"
    source_ref.update({
        "lastFailedAt": now,
        "lastError": error_msg,
        "consecutiveFailures": failures,
        "health": health,
        "updatedAt": now
    })
