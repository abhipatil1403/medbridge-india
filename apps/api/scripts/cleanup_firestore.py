import os
import sys
from pathlib import Path

# Add the apps/api folder to the Python path to allow absolute imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.firebase import get_db

def cleanup_firestore():
    db = get_db()
    
    print("==================================================")
    print("FIRESTORE STAGING CLEANUP")
    print("==================================================")
    
    deleted_reviews = 0
    deleted_providers = 0
    deleted_treatments = 0
    deleted_services = 0
    
    # Step 1: Purge Pending Legacy Candidates
    # Delete all documents from acquisitionReviews where sourceId is NOT manual_csv_import.
    print("Step 1: Purging legacy pending acquisition reviews...")
    reviews = list(db.collection("acquisitionReviews").where("status", "==", "PENDING").stream())
    for doc in reviews:
        data = doc.to_dict()
        source_id = data.get("sourceId", "")
        if source_id != "manual_csv_import":
            print(f" - Deleting legacy review: {doc.id} (Source: {source_id})")
            doc.reference.delete()
            deleted_reviews += 1
            
    # Step 2: Remove Published Legacy Data
    print("\nStep 2: Removing published legacy data...")
    
    # Providers
    providers = list(db.collection("providers").stream())
    for doc in providers:
        data = doc.to_dict()
        origin = data.get("dataOrigin", "")
        source_id = data.get("sourceId", "")
        
        # Check if legacy
        if origin == "SYNTHETIC" or "ogd" in source_id.lower():
            print(f" - Deleting legacy published provider: {doc.id} (Name: {data.get('name')})")
            doc.reference.delete()
            deleted_providers += 1
            
    # Provider Services
    services = list(db.collection("providerServices").stream())
    for doc in services:
        data = doc.to_dict()
        origin = data.get("dataOrigin", "")
        source_id = data.get("sourceId", "")
        
        if origin == "SYNTHETIC" or "ogd" in source_id.lower():
            print(f" - Deleting legacy published provider service: {doc.id} (Treatment: {data.get('treatmentName')})")
            doc.reference.delete()
            deleted_services += 1
            
    # Treatments
    # Usually treatments are master data, but if any were imported via OGD, we clean them up.
    treatments = list(db.collection("treatments").stream())
    for doc in treatments:
        data = doc.to_dict()
        origin = data.get("dataOrigin", "")
        source_id = data.get("sourceId", "")
        
        if origin == "SYNTHETIC" or "ogd" in source_id.lower():
            print(f" - Deleting legacy published treatment: {doc.id} (Name: {data.get('name')})")
            doc.reference.delete()
            deleted_treatments += 1
            
    print("\n==================================================")
    print("CLEANUP SUMMARY")
    print(f"Legacy Pending Reviews Deleted: {deleted_reviews}")
    print(f"Legacy Published Providers Deleted: {deleted_providers}")
    print(f"Legacy Published Provider Services Deleted: {deleted_services}")
    print(f"Legacy Published Treatments Deleted: {deleted_treatments}")
    print("==================================================")
    print("Cleanup complete. You can now safely publish the manual_csv_import records via the Admin UI.")

if __name__ == "__main__":
    
    # Prompt for confirmation before running
    response = input("WARNING: This will delete legacy OGD and SYNTHETIC records from the staging database. Are you sure you want to proceed? (y/N): ")
    if response.lower() == 'y':
        cleanup_firestore()
    else:
        print("Cleanup aborted.")
