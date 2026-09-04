from enum import Enum
from typing import Tuple, Optional
from app.core.firebase import get_db
from .models.candidates import ProviderCandidate
import re

class MatchLevel(Enum):
    EXACT_MATCH = "EXACT_MATCH"
    PROBABLE_MATCH = "PROBABLE_MATCH"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    NO_MATCH = "NO_MATCH"

def normalize_string_for_match(s: str) -> str:
    if not s:
        return ""
    # Lowercase, remove punctuation, reduce spaces
    s = s.lower()
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def deduplicate_provider(candidate: ProviderCandidate) -> Tuple[MatchLevel, Optional[str]]:
    """
    Returns (MatchLevel, existing_canonical_id_if_any)
    """
    db = get_db()
    hospitals_ref = db.collection("providers")
    
    c_name = normalize_string_for_match(candidate.name)
    c_state = normalize_string_for_match(candidate.state or "")
    c_district = normalize_string_for_match(candidate.district or "")
    c_pincode = normalize_string_for_match(candidate.pincode or "")
    
    # We query by state if available to limit results, else we might have to scan more
    if candidate.state:
        query = hospitals_ref.where("state", "==", candidate.state).stream()
    else:
        # Fallback to city or just a limited scan if we don't have state
        if candidate.city:
            query = hospitals_ref.where("city", "==", candidate.city.strip().title()).stream()
        else:
            query = hospitals_ref.limit(500).stream() # Dangerous in prod, but ok for demo
            
    best_match_level = MatchLevel.NO_MATCH
    best_match_id = None
    
    for doc in query:
        data = doc.to_dict()
        e_name = normalize_string_for_match(data.get("name", ""))
        e_state = normalize_string_for_match(data.get("state", ""))
        e_district = normalize_string_for_match(data.get("district", ""))
        e_pincode = normalize_string_for_match(data.get("pincode", ""))
        
        # EXACT MATCH criteria: same name, state, district, pincode
        # If any of these are missing in source or canonical, we can't be EXACT_MATCH securely, downgrade to PROBABLE.
        name_match = (c_name == e_name and c_name != "")
        
        if name_match:
            state_match = (c_state == e_state and c_state != "")
            district_match = (c_district == e_district and c_district != "")
            pincode_match = (c_pincode == e_pincode and c_pincode != "")
            
            if state_match and district_match and pincode_match:
                # Strong Exact Match
                return MatchLevel.EXACT_MATCH, doc.id
            elif state_match and district_match:
                # Same name, state, district, different/missing pincode
                if best_match_level not in [MatchLevel.EXACT_MATCH, MatchLevel.PROBABLE_MATCH]:
                    best_match_level = MatchLevel.PROBABLE_MATCH
                    best_match_id = doc.id
            elif state_match:
                # Same name, state, different district
                if best_match_level == MatchLevel.NO_MATCH:
                    best_match_level = MatchLevel.POSSIBLE_MATCH
                    best_match_id = doc.id
        else:
            # Check substrings
            if (c_name in e_name or e_name in c_name) and len(c_name) > 5 and len(e_name) > 5:
                if best_match_level == MatchLevel.NO_MATCH:
                    best_match_level = MatchLevel.POSSIBLE_MATCH
                    best_match_id = doc.id

    return best_match_level, best_match_id
