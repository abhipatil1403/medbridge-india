import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.core.firebase import get_db

def delete_collection(db, coll_ref, batch_size=400):
    deleted_total = 0
    while True:
        docs = list(coll_ref.limit(batch_size).stream())
        if not docs:
            break
            
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
            
        batch.commit()
        deleted_total += len(docs)
        print(f"  -> Deleted {deleted_total} records so far from {coll_ref.id}...")
        
    return deleted_total

def main():
    if os.environ.get("ENVIRONMENT") != "staging":
        print("ERROR: ENVIRONMENT variable is not set to 'staging'. Aborting.")
        sys.exit(1)
        
    if os.environ.get("CONFIRM_STAGING_WIPE") != "true":
        print("ERROR: CONFIRM_STAGING_WIPE is not set to 'true'. Aborting.")
        sys.exit(1)

    db = get_db()
    project_id = db.project
    print(f"TARGET PROJECT ID: {project_id}")
    
    if "staging" not in project_id.lower() and "dev" not in project_id.lower():
        print("CRITICAL ERROR: Project ID does not contain 'staging' or 'dev'. Aborting.")
        sys.exit(1)

    collections_to_delete = [
        "acquisitionJobs",
        "rawRecords",
        "normalizationRecords",
        "acquisitionReviews",
        "providers",
        "treatments",
        "providerServices",
        "locations",
        "sources"
    ]
    
    print("\nStarting STAGING DATA ENGINE RESET...\n")
    
    for coll_name in collections_to_delete:
        print(f"--- Purging Collection: {coll_name} ---")
        coll_ref = db.collection(coll_name)
        count = delete_collection(db, coll_ref)
        print(f"  -> Finished: Deleted {count} total records from {coll_name}.\n")
        
    print("\nStaging Reset Complete. Legacy OGD and previous public research data has been wiped.")

if __name__ == "__main__":
    main()
