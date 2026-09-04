import pytest
from app.ai.safety.privacy_gate import PrivacyGate

def test_redact_text_email():
    text = "My email is test@example.com and secondary is foo.bar@gmail.com"
    redacted = PrivacyGate.redact_text(text)
    assert "[EMAIL_REDACTED]" in redacted
    assert "test@example.com" not in redacted
    assert "foo.bar@gmail.com" not in redacted

def test_redact_text_phone():
    text = "Call me at +91 98765 43210 or 9876543210."
    redacted = PrivacyGate.redact_text(text)
    assert "[PHONE_REDACTED]" in redacted
    assert "98765 43210" not in redacted
    assert "9876543210" not in redacted

def test_redact_text_aadhaar():
    text = "My Aadhaar is 1234 5678 9012"
    redacted = PrivacyGate.redact_text(text)
    assert "[ID_REDACTED]" in redacted
    assert "1234 5678 9012" not in redacted

def test_redact_text_passport():
    text = "Passport A1234567 attached."
    redacted = PrivacyGate.redact_text(text)
    assert "[ID_REDACTED]" in redacted
    assert "A1234567" not in redacted

def test_build_safe_context():
    raw_reqs = {
        "treatmentId": "T1",
        "preferredCity": "Pune",
        "budgetMax": 100000,
        "accompanyingPeople": 2,
        "requiresAccommodation": True,
        "requiresLocalTransport": False,
        "travelDuration": "2 weeks",
        "patientName": "John Doe",  # Should be excluded
        "patientPhone": "+91 9876543210", # Should be excluded
        "internalAuthToken": "XYZ123" # Should be excluded
    }
    
    safe_ctx = PrivacyGate.build_safe_context(raw_reqs)
    
    assert "treatmentId" in safe_ctx
    assert "preferredCity" in safe_ctx
    assert safe_ctx["budgetMax"] == 100000
    assert "patientName" not in safe_ctx
    assert "patientPhone" not in safe_ctx
    assert "internalAuthToken" not in safe_ctx

def test_sanitize_payload():
    payload = {
        "message": "Hi, I'm Rahul. My phone is 9876543210.",
        "nested": {
            "email": "rahul@example.com"
        },
        "tags": ["urgent", "call 9876543210"]
    }
    
    sanitized = PrivacyGate.sanitize_payload(payload)
    
    assert "9876543210" not in sanitized["message"]
    assert "[PHONE_REDACTED]" in sanitized["message"]
    assert "rahul@example.com" not in sanitized["nested"]["email"]
    assert "[EMAIL_REDACTED]" in sanitized["nested"]["email"]
    assert "9876543210" not in sanitized["tags"][1]
    assert "[PHONE_REDACTED]" in sanitized["tags"][1]
