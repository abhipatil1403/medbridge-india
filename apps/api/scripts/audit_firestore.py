import os
from collections import defaultdict
from app.core.firebase import get_db

def audit_firestore():
    db = get_db()
    
    print("==================================================")
    print("FIRESTORE STAGING AUDIT REPORT")
    print("==================================================")
    
    # 1. Audit Providers
    providers = db.collection("providers").stream()
    published_providers = 0
    ogd_providers = 0
    synthetic_providers = 0
    manual_providers = 0
    
    for doc in providers:
        data = doc.to_dict()
        if data.get("status") == "PUBLISHED":
            published_providers += 1
        origin = data.get("dataOrigin", "")
        if origin == "REAL_PUBLIC" and "ogd" in data.get("sourceId", "").lower():
            ogd_providers += 1
        elif origin == "SYNTHETIC":
            synthetic_providers += 1
        elif data.get("sourceId") == "manual_csv_import":
            manual_providers += 1
            
    print(f"PROVIDERS (Total Published: {published_providers})")
    print(f" - OGD Records: {ogd_providers}")
    print(f" - Synthetic Records: {synthetic_providers}")
    print(f" - Manual CSV Records: {manual_providers}")
    
    # 2. Audit Treatments
    treatments = db.collection("treatments").stream()
    published_treatments = 0
    for doc in treatments:
        if doc.to_dict().get("status") == "PUBLISHED":
            published_treatments += 1
            
    print(f"\nTREATMENTS (Total Published: {published_treatments})")

    # 3. Audit Provider Services
    services = db.collection("providerServices").stream()
    published_services = 0
    for doc in services:
        if doc.to_dict().get("status") == "PUBLISHED":
            published_services += 1
            
    print(f"\nPROVIDER SERVICES (Total Published: {published_services})")
    
    # 4. Audit Acquisition Reviews (Pending Candidates)
    reviews = db.collection("acquisitionReviews").stream()
    pending_reviews_by_source = defaultdict(int)
    
    for doc in reviews:
        data = doc.to_dict()
        if data.get("status") == "PENDING":
            source = data.get("sourceId", "UNKNOWN")
            pending_reviews_by_source[source] += 1
            
    print(f"\nPENDING ACQUISITION REVIEWS")
    for source, count in pending_reviews_by_source.items():
        print(f" - {source}: {count} candidates waiting for review")
        
    print("==================================================")
    print("RECOMMENDED CLEANUP STRATEGY:")
    print("1. OGD & Synthetic Data: Since these were experiments and we are now moving to accurate PUBLIC_RESEARCH data, we should archive or delete all older acquisitionReviews with sourceId 'ogd_national_hospital_directory' and any 'SYNTHETIC' data records.")
    print("2. Ensure no overlapping duplicates were published. We can safely remove unpublished OGD candidates to clean the admin queue.")
    print("3. manual_csv_import candidates should be reviewed and published.")
    print("==================================================")

if __name__ == "__main__":
    audit_firestore()
