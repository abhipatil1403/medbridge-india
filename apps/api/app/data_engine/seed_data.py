import json
import uuid
from datetime import datetime
from app.core.firebase import get_db
from app.data_engine.models.candidates import (
    ProviderCandidate,
    TreatmentCandidate,
    ProviderServiceCandidate,
    LocationCandidate
)

def generate_synthetic_data():
    db = get_db()
    now = datetime.utcnow().isoformat()
    source_id = "src_synthetic_dev"
    
    print("Generating SYNTHETIC development dataset...")
    
    # 1. Locations
    locations = [
        {
            "externalIdentifier": "loc_synth_pune",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "coordinates": '{"lat": 18.5204, "lng": 73.8567}',
            "nearestAirport": "Pune International Airport (PNQ)",
            "airportCoordinates": '{"lat": 18.5822, "lng": 73.9197}',
            "connectivityInformation": "Well connected by road to Mumbai. Direct flights to major hubs.",
            "majorAirports": ["PNQ"],
            "sourceId": source_id,
            "rawRecordId": "raw_loc_1",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        },
        {
            "externalIdentifier": "loc_synth_mumbai",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "coordinates": '{"lat": 19.0760, "lng": 72.8777}',
            "nearestAirport": "Chhatrapati Shivaji Maharaj International Airport (BOM)",
            "airportCoordinates": '{"lat": 19.0896, "lng": 72.8656}',
            "connectivityInformation": "Major international hub. High connectivity.",
            "majorAirports": ["BOM"],
            "sourceId": source_id,
            "rawRecordId": "raw_loc_2",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        }
    ]
    
    loc_candidates = [LocationCandidate(**l) for l in locations]
    for lc in loc_candidates:
        db.collection("locations").document(lc.externalIdentifier).set(lc.model_dump())
    
    # 2. Treatments
    treatments = [
        {
            "externalIdentifier": "trt_synth_cabg",
            "name": "Coronary Artery Bypass Grafting (CABG)",
            "slug": "coronary-artery-bypass-grafting",
            "category": "Cardiology",
            "diseaseCondition": "Coronary Artery Disease",
            "commonNames": ["Heart Bypass", "CABG"],
            "aliases": ["Bypass Surgery"],
            "treatmentType": "SURGICAL",
            "specialtyId": "spec_cardiology",
            "description": "Surgical procedure to restore normal blood flow to an obstructed coronary artery.",
            "sourceId": source_id,
            "rawRecordId": "raw_trt_1",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        },
        {
            "externalIdentifier": "trt_synth_knee",
            "name": "Total Knee Replacement",
            "slug": "total-knee-replacement",
            "category": "Orthopedics",
            "diseaseCondition": "Severe Knee Osteoarthritis",
            "commonNames": ["Knee Replacement", "TKR"],
            "aliases": ["Knee Arthroplasty"],
            "treatmentType": "SURGICAL",
            "specialtyId": "spec_orthopedics",
            "description": "Surgical procedure to replace the weight-bearing surfaces of the knee joint.",
            "sourceId": source_id,
            "rawRecordId": "raw_trt_2",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        }
    ]
    
    trt_candidates = [TreatmentCandidate(**t) for t in treatments]
    for tc in trt_candidates:
        # Save directly to treatments for demo (in reality goes through normalization/validation/approval)
        t_data = tc.model_dump()
        t_data["status"] = "PUBLISHED"
        t_data["createdAt"] = now
        t_data["updatedAt"] = now
        db.collection("treatments").document(tc.externalIdentifier).set(t_data)

    # 3. Providers
    providers = [
        {
            "externalIdentifier": "prov_synth_apollo_pune",
            "name": "Apollo Clinic Pune",
            "providerType": "CLINIC",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "rating": 4.2,
            "reviewCount": 150,
            "ratingSource": "Google Maps",
            "ratingRetrievedAt": now,
            "localTransportAvailability": True,
            "accommodationReferences": ["acc_oyo_1", "acc_taj_2"],
            "sourceId": source_id,
            "rawRecordId": "raw_prov_1",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        },
        {
            "externalIdentifier": "prov_synth_fortis_mumbai",
            "name": "Fortis Hospital Mumbai",
            "providerType": "HOSPITAL",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "rating": 4.6,
            "reviewCount": 850,
            "ratingSource": "Google Maps",
            "ratingRetrievedAt": now,
            "localTransportAvailability": True,
            "accommodationReferences": ["acc_marriott_1"],
            "sourceId": source_id,
            "rawRecordId": "raw_prov_2",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        }
    ]
    
    prov_candidates = [ProviderCandidate(**p) for p in providers]
    for pc in prov_candidates:
        p_data = pc.model_dump()
        p_data["status"] = "PUBLISHED"
        p_data["createdAt"] = now
        p_data["updatedAt"] = now
        db.collection("providers").document(pc.externalIdentifier).set(p_data)

    # 4. ProviderServices
    services = [
        {
            "externalIdentifier": "ps_synth_1",
            "providerId": "prov_synth_fortis_mumbai",
            "treatmentId": "trt_synth_cabg",
            "treatmentName": "Coronary Artery Bypass Grafting (CABG)",
            "estimatedCostMin": 300000.0,
            "estimatedCostMax": 500000.0,
            "currency": "INR",
            "costSource": "Provider Website",
            "costVerifiedAt": now,
            "availabilityStatus": "AVAILABLE",
            "serviceDescription": "Comprehensive CABG package including 5 days ward stay.",
            "sourceId": source_id,
            "rawRecordId": "raw_ps_1",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        },
        {
            "externalIdentifier": "ps_synth_2",
            "providerId": "prov_synth_apollo_pune",
            "treatmentId": "trt_synth_knee",
            "treatmentName": "Total Knee Replacement",
            "estimatedCostMin": 250000.0,
            "estimatedCostMax": 350000.0,
            "currency": "INR",
            "costSource": "Clinic Brochure",
            "costVerifiedAt": now,
            "availabilityStatus": "AVAILABLE",
            "serviceDescription": "Outpatient consultation and referral for surgery.",
            "sourceId": source_id,
            "rawRecordId": "raw_ps_2",
            "retrievedAt": now,
            "dataOrigin": "SYNTHETIC"
        }
    ]
    
    ps_candidates = [ProviderServiceCandidate(**s) for s in services]
    for sc in ps_candidates:
        s_data = sc.model_dump()
        s_data["status"] = "PUBLISHED"
        s_data["createdAt"] = now
        s_data["updatedAt"] = now
        db.collection("providerServices").document(sc.externalIdentifier).set(s_data)
        
    print("Synthetic data generation complete.")

if __name__ == "__main__":
    import os
    # Ensure this runs only if explicitly called
    if os.environ.get("ALLOW_SYNTHETIC_SEED") == "true":
        generate_synthetic_data()
    else:
        print("Set ALLOW_SYNTHETIC_SEED=true to run this script.")
