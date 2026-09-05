import sys
import os

# Add apps/api to path so we can import app.core.firebase
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.firebase import get_db

def verify_firestore():
    db = get_db()
    
    print("=== FIRESTORE VERIFICATION REPORT ===")
    
    # 1. Hospitals
    hospitals = list(db.collection("hospitals").where("status", "==", "PUBLISHED").stream())
    hospital_ids = [doc.id for doc in hospitals]
    print(f"\nHOSPITALS ({len(hospitals)}):")
    for doc in hospitals:
        data = doc.to_dict()
        print(f" - ID: {doc.id}, Name: {data.get('name')}, Origin: {data.get('dataOrigin')}")
        
    # 2. Treatments
    treatments = list(db.collection("treatments").where("status", "==", "PUBLISHED").stream())
    treatment_ids = [doc.id for doc in treatments]
    print(f"\nTREATMENTS ({len(treatments)}):")
    for doc in treatments:
        data = doc.to_dict()
        print(f" - ID: {doc.id}, Name: {data.get('name')}, Origin: {data.get('dataOrigin')}")
        
    # 3. Provider Services
    services = list(db.collection("providerServices").where("status", "==", "PUBLISHED").stream())
    print(f"\nPROVIDER SERVICES ({len(services)}):")
    for doc in services:
        data = doc.to_dict()
        pid = data.get('providerId')
        tid = data.get('treatmentId')
        
        pid_valid = pid in hospital_ids
        tid_valid = tid in treatment_ids
        
        print(f" - ID: {doc.id}, Treatment: {data.get('treatmentName')}, Origin: {data.get('dataOrigin')}")
        print(f"     -> providerId: {pid} (Valid: {pid_valid})")
        print(f"     -> treatmentId: {tid} (Valid: {tid_valid})")
        
    # 4. Reviews
    print("\nREVIEWS:")
    reviews = list(db.collection("acquisitionReviews").stream())
    status_counts = {}
    for doc in reviews:
        status = doc.to_dict().get("status")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        print(f" - {status}: {count}")
        
if __name__ == "__main__":
    verify_firestore()
