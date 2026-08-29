import json
import os
from typing import List, Dict, Any
from .base import BaseSourceAdapter

class FixtureHospitalAdapter(BaseSourceAdapter):
    @property
    def source_id(self) -> str:
        return "src_fixture_001"

    def fetch(self) -> str:
        """Reads the synthetic JSON fixture."""
        current_dir = os.path.dirname(__file__)
        fixture_path = os.path.join(current_dir, "..", "fixtures", "hospital_source.json")
        with open(fixture_path, "r", encoding="utf-8") as f:
            return f.read()

    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        """Parses the raw JSON string."""
        return json.loads(raw_payload)

    def normalize(self, parsed_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        """Maps parsed keys to Candidate model keys."""
        
        # Safe split function
        def safe_split(val: str) -> List[str]:
            if not val:
                return []
            return [x.strip() for x in val.split(",") if x.strip()]

        return {
            "externalIdentifier": parsed_item.get("id", ""),
            "name": parsed_item.get("hospital_name", ""),
            "city": parsed_item.get("location_city", ""),
            "country": parsed_item.get("location_country", ""),
            "specialties": safe_split(parsed_item.get("specialties_offered", "")),
            "treatments": safe_split(parsed_item.get("procedures", "")),
            "website": parsed_item.get("contact_website", None),
            "sourceId": self.source_id,
            "rawRecordId": raw_record_id,
            "retrievedAt": retrieved_at
        }
