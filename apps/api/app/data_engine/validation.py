from typing import Tuple, List, Optional
from pydantic import ValidationError
from .models.candidates import HospitalCandidate, TreatmentCandidate, ProviderServiceCandidate
from .models.jobs import NormalizationRecord
from app.core.firebase import get_db
from datetime import datetime

def validate_hospital_candidate(record: NormalizationRecord) -> Tuple[Optional[HospitalCandidate], List[str]]:
    try:
        candidate = HospitalCandidate(**record.normalizedData)
        
        # Additional custom deterministic validation
        if not candidate.name.strip():
            raise ValueError("Hospital name cannot be purely whitespace.")
        
        return candidate, []
    except ValidationError as e:
        errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return None, errors
    except ValueError as e:
        return None, [str(e)]
    except Exception as e:
        return None, [f"Unexpected error: {str(e)}"]

def validate_treatment_candidate(record: NormalizationRecord) -> Tuple[Optional[TreatmentCandidate], List[str]]:
    try:
        candidate = TreatmentCandidate(**record.normalizedData)
        if not candidate.name.strip():
            raise ValueError("Treatment name cannot be purely whitespace.")
        return candidate, []
    except ValidationError as e:
        errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return None, errors
    except ValueError as e:
        return None, [str(e)]
    except Exception as e:
        return None, [f"Unexpected error: {str(e)}"]

def validate_provider_service_candidate(record: NormalizationRecord) -> Tuple[Optional[ProviderServiceCandidate], List[str]]:
    try:
        candidate = ProviderServiceCandidate(**record.normalizedData)
        if not candidate.providerId or not candidate.treatmentId:
            raise ValueError("ProviderService requires both providerId and treatmentId.")
        return candidate, []
    except ValidationError as e:
        errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return None, errors
    except ValueError as e:
        return None, [str(e)]
    except Exception as e:
        return None, [f"Unexpected error: {str(e)}"]

def update_normalization_status(record_id: str, status: str, errors: List[str] = []) -> None:
    db = get_db()
    db.collection("normalizationRecords").document(record_id).update({
        "normalizationStatus": status,
        "validationErrors": errors,
        "updatedAt": datetime.utcnow().isoformat()
    })
