import os
import sys
from collections import defaultdict
from pathlib import Path

# Add the apps/api folder to the Python path to allow absolute imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.firebase import get_db

def audit():
    db = get_db()
    
    print("========================================")
    print("FULL STAGING FIRESTORE AUDIT")
    print("========================================\n")
    
    collections = [
        "sources", 
        "acquisitionJobs", 
        "rawRecords", 
        "normalizationRecords", 
        "acquisitionReviews", 
        "providers", 
        "treatments", 
        "providerServices"
    ]
    
    stats = {
        "OGD": defaultdict(int),
        "SYNTHETIC": defaultdict(int),
        "MANUAL_CSV": defaultdict(int)
    }
    
    for coll_name in collections:
        coll = list(db.collection(coll_name).stream())
        print(f"Collection: {coll_name} (Total: {len(coll)})")
        
        for doc in coll:
            data = doc.to_dict()
            origin = data.get("dataOrigin", "")
            source_id = data.get("sourceId", "")
            
            # Identify category
            category = None
            if "ogd" in source_id.lower() or "ogd" in origin.lower():
                category = "OGD"
            elif origin == "SYNTHETIC" or "synthetic" in source_id.lower():
                category = "SYNTHETIC"
            elif source_id == "manual_csv_import" or source_id == "initial_public_v1":
                category = "MANUAL_CSV"
                
            if category:
                status = data.get("status", "NO_STATUS")
                stats[category][f"{coll_name}:{status}"] += 1
                
    print("\n--- OGD RECORDS ---")
    for k, v in stats["OGD"].items():
        print(f"  {k}: {v}")
        
    print("\n--- SYNTHETIC RECORDS ---")
    for k, v in stats["SYNTHETIC"].items():
        print(f"  {k}: {v}")
        
    print("\n--- INITIAL_PUBLIC_V1 / MANUAL_CSV RECORDS ---")
    for k, v in stats["MANUAL_CSV"].items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    audit()
