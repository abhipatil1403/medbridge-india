from typing import List, Optional
from pydantic import BaseModel, Field

class HospitalCandidate(BaseModel):
    externalIdentifier: str
    name: str = Field(..., min_length=2)
    city: str = Field(..., min_length=2)
    country: str = Field(..., min_length=2)
    specialties: List[str] = Field(default_factory=list)
    treatments: List[str] = Field(default_factory=list)
    address: Optional[str] = None
    website: Optional[str] = None
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str
