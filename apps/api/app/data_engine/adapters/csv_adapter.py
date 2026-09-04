import csv
import io
from typing import List, Dict, Any
from .base import BaseSourceAdapter

class CsvAdapter(BaseSourceAdapter):
    def __init__(self, csv_content: str, source_id: str):
        self._csv_content = csv_content
        self._source_id = source_id

    @property
    def source_id(self) -> str:
        return self._source_id

    def fetch(self) -> str:
        """Returns the CSV content provided during initialization."""
        return self._csv_content

    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        """Parses the raw CSV string into a list of dictionaries."""
        # Use csv.DictReader to parse the string
        f = io.StringIO(raw_payload)
        reader = csv.DictReader(f)
        return list(reader)

    def normalize(self, parsed_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        """Maps parsed CSV keys to Candidate model keys."""
        
        # Helper to cleanly get float
        def safe_float(val: Any) -> float | None:
            if val is None or str(val).strip() == "":
                return None
            try:
                return float(val)
            except ValueError:
                return None
                
        def safe_int(val: Any) -> int | None:
            if val is None or str(val).strip() == "":
                return None
            try:
                return int(val)
            except ValueError:
                return None

        # Helper to split arrays
        def safe_split(val: str) -> List[str]:
            if not val:
                return []
            return [x.strip() for x in str(val).split(",") if x.strip()]

        # Generate a unique external identifier if none is provided
        external_id = parsed_item.get("hospital_name", "").replace(" ", "_").lower() + "_" + parsed_item.get("city", "").replace(" ", "_").lower()
        
        return {
            "externalIdentifier": external_id,
            "name": parsed_item.get("hospital_name", ""),
            "providerType": parsed_item.get("provider_type", "HOSPITAL").upper(),
            "city": parsed_item.get("city", ""),
            "state": parsed_item.get("state", ""),
            "country": parsed_item.get("country", "India"),
            "coordinates": parsed_item.get("coordinates", None),
            "nearestAirportId": parsed_item.get("nearest_airport", None),
            "website": parsed_item.get("website", None),
            "email": parsed_item.get("contact_email", None),
            "telephone": parsed_item.get("contact_phone", None),
            "accreditations": parsed_item.get("accreditations", None),
            "rating": safe_float(parsed_item.get("rating_score")),
            "reviewCount": safe_int(parsed_item.get("rating_count")),
            "ratingSource": parsed_item.get("rating_source", None),
            "treatments": [parsed_item.get("treatment_name", "").strip()] if parsed_item.get("treatment_name") else [],
            "sourceId": self.source_id,
            "rawRecordId": raw_record_id,
            "retrievedAt": retrieved_at,
            "dataOrigin": "REAL_PUBLIC",
            # Additional metadata for services
            "_treatment_id": parsed_item.get("treatment_id", None),
            "_treatment_name": parsed_item.get("treatment_name", None),
            "_cost_min_usd": safe_float(parsed_item.get("cost_min_usd")),
            "_cost_max_usd": safe_float(parsed_item.get("cost_max_usd")),
            "_cost_source": parsed_item.get("cost_source", None),
            "_cost_verified_at": parsed_item.get("cost_verified_at", None),
        }
