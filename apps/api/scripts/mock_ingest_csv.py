import sys
import os
from unittest.mock import MagicMock, patch
import json

# Setup environment to skip auth
os.environ["FIREBASE_SERVICE_ACCOUNT_KEY"] = "{}"

# Mock firestore before importing app
mock_db = MagicMock()
mock_firestore = MagicMock(return_value=mock_db)

with patch("firebase_admin.firestore.client", mock_firestore), patch("firebase_admin.initialize_app"), patch("firebase_admin.credentials.Certificate"):
    from app.data_engine.pipeline import run_pipeline
    from app.data_engine.adapters.csv_adapter import CsvAdapter

    def main():
        csv_path = "apps/api/data/medbridge_initial_public_dataset.csv"
        print(f"Loading CSV from {csv_path}...")
        
        with open(csv_path, "r", encoding="utf-8") as f:
            csv_content = f.read()
            
        adapter = CsvAdapter(csv_content, "mock_source")
        
        # We need to mock the source_doc.exists for pipeline
        mock_source_doc = MagicMock()
        mock_source_doc.exists = True
        mock_source_doc.to_dict.return_value = {"status": "ACTIVE", "health": "HEALTHY"}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_source_doc
        
        # Run pipeline
        run_pipeline("mock_source", adapter=adapter)
        
        # Analyze what was written to acquisitionReviews
        reviews = []
        for call in mock_db.collection("acquisitionReviews").add.call_args_list:
            args, kwargs = call
            reviews.append(args[0] if args else kwargs)
            
        print("\n=== INGESTION REPORT ===")
        print(f"Total Acquisition Reviews generated: {len(reviews)}")
        
        treatments = set()
        providers = set()
        provider_services = set()
        
        for r in reviews:
            entity_type = r.get("entityType")
            if entity_type == "HOSPITAL" or entity_type == "CLINIC":
                providers.add(r["candidateData"].get("externalIdentifier"))
            elif entity_type == "TREATMENT":
                treatments.add(r["candidateData"].get("externalIdentifier"))
            elif entity_type == "PROVIDER_SERVICE":
                provider_services.add(r["candidateData"].get("externalIdentifier"))
        
        print(f"Providers: {len(providers)}")
        print(f"Treatments: {len(treatments)}")
        print(f"ProviderServices: {len(provider_services)}")
        
        # Check sourceRecords
        source_records = []
        for call in mock_db.collection("sourceRecords").document().set.call_args_list:
            args, kwargs = call
            source_records.append(args[0] if args else kwargs)
        
        print(f"Source Records: {len(source_records)}")
        
        print("\nReview Candidates Preview:")
        for r in reviews[:3]:
            print(f"- {r.get('entityType')}: {r['candidateData'].get('name') or r['candidateData'].get('treatmentName')}")

if __name__ == "__main__":
    main()
