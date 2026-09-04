from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HospitalCandidate(BaseModel):
    externalIdentifier: str
    name: str = Field(..., min_length=2)
    city: Optional[str] = None
    citySource: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    subdistrict: Optional[str] = None
    town: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    country: str = Field(..., min_length=2)
    specialties: List[str] = Field(default_factory=list)
    treatments: List[str] = Field(default_factory=list)
    address: Optional[str] = None
    website: Optional[str] = None
    locationDescription: Optional[str] = None
    coordinates: Optional[str] = None
    category: Optional[str] = None
    careType: Optional[str] = None
    systemsOfMedicine: Optional[str] = None
    facilities: Optional[str] = None
    telephone: Optional[str] = None
    mobileNumber: Optional[str] = None
    emergencyNumber: Optional[str] = None
    ambulancePhone: Optional[str] = None
    bloodbankPhone: Optional[str] = None
    emergencyServices: Optional[str] = None
    totalBeds: Optional[str] = None
    privateWardBeds: Optional[str] = None
    economicallyWeakerSectionBeds: Optional[str] = None
    numberOfDoctors: Optional[str] = None
    numberOfConsultants: Optional[str] = None
    establishedYear: Optional[str] = None
    ayushSystems: Optional[str] = None
    miscellaneousFacilities: Optional[str] = None
    collaborations: Optional[str] = None
    
    # Logistics (Stable)
    nearestAirportId: Optional[str] = None
    localTransportAvailability: Optional[bool] = None
    accommodationReferences: List[str] = Field(default_factory=list)
    
    # Source-specific raw identities
    sourceStateId: Optional[str] = None
    sourceDistrictId: Optional[str] = None
    sourceRowNumber: Optional[str] = None
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str

class TreatmentCandidate(BaseModel):
    externalIdentifier: str
    name: str = Field(..., min_length=2)
    specialtyId: Optional[str] = None
    description: Optional[str] = None
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str

class ProviderServiceCandidate(BaseModel):
    externalIdentifier: str
    providerId: str
    treatmentId: str
    treatmentName: Optional[str] = None
    estimatedCostMin: Optional[float] = None
    estimatedCostMax: Optional[float] = None
    currency: Optional[str] = None
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str

class LocationCandidate(BaseModel):
    externalIdentifier: str
    city: str
    state: Optional[str] = None
    country: str
    coordinates: Optional[str] = None # JSON string or format for lat/lng
    majorAirports: List[str] = Field(default_factory=list)
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str
