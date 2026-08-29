import csv
import io
import hashlib
import httpx
from typing import List, Dict, Any, Optional
from .base import BaseSourceAdapter
import logging

logger = logging.getLogger(__name__)

class OgdHospitalAdapter(BaseSourceAdapter):
    def __init__(self, source_url: str):
        self._source_url = source_url

    @property
    def source_id(self) -> str:
        return "ogd_national_hospital_directory"

    def fetch(self) -> str:
        logger.info(f"Fetching OGD data from {self._source_url}")
        with httpx.Client(timeout=30.0) as client:
            response = client.get(self._source_url)
            response.raise_for_status()
            # OGD datasets are usually utf-8 or utf-8-sig
            return response.content.decode('utf-8-sig', errors='replace')

    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        # Use csv module to handle quotes and embedded newlines
        reader = csv.DictReader(io.StringIO(raw_payload))
        parsed = []
        for row in reader:
            parsed.append(dict(row))
        return parsed

    def normalize(self, parsed_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        """
        Normalizes a single parsed item into a structured Candidate dictionary.
        Returns None if the record should be excluded (e.g. non-hospital care type).
        """
        def _get_val(key: str) -> Optional[str]:
            val = parsed_item.get(key)
            if not val:
                return None
            val = val.strip()
            if val == "0" or val == "":
                return None
            return val

        # Care Type Filtering
        # Explicit allowlist of hospital-like facilities
        allowed_care_types = [
            "Hospital",
            "Medical College / Institute",
            "Nursing Home",
            "Maternity Home",
            "Sub Divisional Hospital",
            "District Hospital"
        ]
        
        care_type = _get_val("Hospital_Care_Type")
        if not care_type or care_type not in allowed_care_types:
            # We raise a special exception or just return a dict that the pipeline handles?
            # To be clean, we can return {"_exclude": True, "reason": "UNSUPPORTED_CARE_TYPE", "careType": care_type}
            return {
                "_exclude": True,
                "reason": "UNSUPPORTED_CARE_TYPE",
                "careType": care_type,
                "sourceRowNumber": parsed_item.get("Sr_No")
            }

        name = _get_val("Hospital_Name") or "Unknown Hospital"
        state = _get_val("State")
        district = _get_val("District")
        pincode = _get_val("Pincode")
        address = _get_val("Address_Original_First_Line")
        
        # Calculate Deterministic ID
        id_string = f"{name}|{state or ''}|{district or ''}|{pincode or ''}"
        external_id = hashlib.sha256(id_string.encode('utf-8')).hexdigest()

        # Handle City gracefully without fabricating
        city = None
        city_source = None
        if _get_val("Town"):
            city = _get_val("Town")
            city_source = "Town"
        elif _get_val("Subtown"):
            city = _get_val("Subtown")
            city_source = "Subtown"

        # Specialties
        specialties_raw = _get_val("Specialties")
        specialties_list = []
        if specialties_raw:
            specialties_list = [s.strip() for s in specialties_raw.split(',') if s.strip()]

        normalized = {
            "externalIdentifier": external_id,
            "name": name,
            "city": city,
            "citySource": city_source,
            "state": state,
            "district": district,
            "subdistrict": _get_val("Subdistrict"),
            "town": _get_val("Town"),
            "village": _get_val("Village"),
            "pincode": pincode,
            "country": "India",
            "specialties": specialties_list,
            "treatments": [],
            "address": address,
            "website": _get_val("Website"),
            "locationDescription": _get_val("Location"),
            "coordinates": _get_val("Location_Coordinates"),
            "category": _get_val("Hospital_Category"),
            "careType": care_type,
            "systemsOfMedicine": _get_val("Discipline_Systems_of_Medicine"),
            "facilities": _get_val("Facilities"),
            "telephone": _get_val("Telephone"),
            "mobileNumber": _get_val("Mobile_Number"),
            "emergencyNumber": _get_val("Emergency_Num"),
            "ambulancePhone": _get_val("Ambulance_Phone_No"),
            "bloodbankPhone": _get_val("Bloodbank_Phone_No"),
            "emergencyServices": _get_val("Emergency_Services"),
            "totalBeds": _get_val("Total_Num_Beds"),
            "privateWardBeds": _get_val("Number_Private_Wards"),
            "economicallyWeakerSectionBeds": _get_val("Num_Bed_for_Eco_Weaker_Sec"),
            "numberOfDoctors": _get_val("Number_Doctor"),
            "numberOfConsultants": _get_val("Num_Mediconsultant_or_Expert"),
            "establishedYear": _get_val("Establised_Year"),
            "ayushSystems": _get_val("Ayush"),
            "miscellaneousFacilities": _get_val("Miscellaneous_Facilities"),
            "collaborations": _get_val("Empanelment_or_Collaboration_with"),
            "sourceStateId": _get_val("State_ID"),
            "sourceDistrictId": _get_val("District_ID"),
            "sourceRowNumber": parsed_item.get("Sr_No"),
            "sourceId": self.source_id,
            "rawRecordId": raw_record_id,
            "retrievedAt": retrieved_at
        }
        
        return normalized
