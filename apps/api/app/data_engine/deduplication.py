from enum import Enum
from typing import Tuple, Optional
from app.core.firebase import get_db
from .models.candidates import HospitalCandidate
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

def deduplicate_hospital(candidate: HospitalCandidate) -> Tuple[MatchLevel, Optional[str]]:
    """
    Returns (MatchLevel, existing_canonical_id_if_any)
    This is a deterministic first-pass matching strategy.
    """
    db = get_db()
    hospitals_ref = db.collection("hospitals")
    
    # 1. Search by exact city and normalized name
    c_name = normalize_string_for_match(candidate.name)
    c_city = normalize_string_for_match(candidate.city)
    
    # For a real implementation, we would query by city and iterate through results to find matches.
    # Since Firestore doesn't support complex text search, we pull by city and compare locally.
    
    # Capitalize city for Firestore standard query (assuming canonical cities are Title Case)
    city_query_val = candidate.city.strip().title()
    query = hospitals_ref.where("city", "==", city_query_val).limit(100)
    
    results = query.stream()
    
    best_match_level = MatchLevel.NO_MATCH
    best_match_id = None
    
    for doc in results:
        data = doc.to_dict()
        existing_name = normalize_string_for_match(data.get("name", ""))
        
        if existing_name == c_name:
            return MatchLevel.EXACT_MATCH, doc.id
            
        # Probable Match logic (e.g. one string is completely inside another)
        if c_name in existing_name or existing_name in c_name:
            if best_match_level != MatchLevel.PROBABLE_MATCH:
                best_match_level = MatchLevel.PROBABLE_MATCH
                best_match_id = doc.id
    
    return best_match_level, best_match_id
