from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class AcquisitionJob(BaseModel):
    jobId: str
    sourceId: str
    status: str = Field(..., description="QUEUED, RUNNING, COMPLETED, PARTIAL, FAILED")
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    recordsFound: int = 0
    recordsParsed: int = 0
    recordsAccepted: int = 0
    recordsExcluded: int = 0
    excludedByCareType: dict = Field(default_factory=dict)
    recordsRejected: int = 0
    recordsChanged: int = 0
    recordsUnchanged: int = 0
    errorCount: int = 0
    errorMessage: Optional[str] = None
    createdAt: str

class RawRecord(BaseModel):
    rawRecordId: str
    jobId: str
    sourceId: str
    externalIdentifier: str
    contentHash: str
    contentType: str
    retrievedAt: str
    storagePath: str
    createdAt: str

class NormalizationRecord(BaseModel):
    normalizationRecordId: str
    rawRecordId: str
    sourceId: str
    entityType: str = Field(..., description="E.g., HOSPITAL")
    externalIdentifier: str
    normalizedData: dict
    validationErrors: List[str] = []
    normalizationStatus: str = Field(..., description="PENDING, VALIDATED, REJECTED, NEEDS_REVIEW")
    createdAt: str
    updatedAt: str
