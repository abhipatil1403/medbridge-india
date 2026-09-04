from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProviderCandidate(BaseModel):
    externalIdentifier: str
    name: str = Field(..., min_length=2)
    providerType: str = "HOSPITAL"
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
    
    # Public Reputation
    rating: Optional[float] = None
    reviewCount: Optional[int] = None
    ratingSource: Optional[str] = None
    ratingRetrievedAt: Optional[str] = None
    email: Optional[str] = None
    
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
    dataOrigin: str = "REAL_PUBLIC"

class TreatmentCandidate(BaseModel):
    externalIdentifier: str
    name: str = Field(..., min_length=2)
    slug: Optional[str] = None
    category: Optional[str] = None
    diseaseCondition: Optional[str] = None
    commonNames: List[str] = Field(default_factory=list)
    aliases: List[str] = Field(default_factory=list)
    treatmentType: Optional[str] = None
    specialtyId: Optional[str] = None
    description: Optional[str] = None
    sourceReferences: List[str] = Field(default_factory=list)
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str
    dataOrigin: str = "REAL_PUBLIC"

class ProviderServiceCandidate(BaseModel):
    externalIdentifier: str
    providerId: str
    treatmentId: str
    treatmentName: Optional[str] = None
    estimatedCostMin: Optional[float] = None
    estimatedCostMax: Optional[float] = None
    currency: Optional[str] = None
    costSource: Optional[str] = None
    costVerifiedAt: Optional[str] = None
    availabilityStatus: Optional[str] = None
    serviceDescription: Optional[str] = None
    sourceReferences: List[str] = Field(default_factory=list)
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str
    dataOrigin: str = "REAL_PUBLIC"

class LocationCandidate(BaseModel):
    externalIdentifier: str
    city: str
    state: Optional[str] = None
    country: str
    coordinates: Optional[str] = None # JSON string or format for lat/lng
    nearestAirport: Optional[str] = None
    airportCoordinates: Optional[str] = None
    connectivityInformation: Optional[str] = None
    majorAirports: List[str] = Field(default_factory=list)
    sourceReferences: List[str] = Field(default_factory=list)
    
    # Provenance fields
    sourceId: str
    rawRecordId: str
    retrievedAt: str
    dataOrigin: str = "REAL_PUBLIC"
