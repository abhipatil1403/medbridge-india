import pytest
from app.data_engine.adapters.fixture_adapter import FixtureHospitalAdapter
from app.data_engine.acquisition import calculate_content_hash
from app.data_engine.deduplication import deduplicate_hospital, normalize_string_for_match, MatchLevel
from app.data_engine.models.candidates import HospitalCandidate
from pydantic import ValidationError

def test_calculate_content_hash():
    payload = "<html>test</html>"
    hash1 = calculate_content_hash(payload)
    hash2 = calculate_content_hash(payload)
    hash3 = calculate_content_hash("<html>test2</html>")
    assert hash1 == hash2
    assert hash1 != hash3

def test_fixture_adapter_parse_and_normalize():
    adapter = FixtureHospitalAdapter()
    # Mock payload
    payload = '[{"id": "1", "hospital_name": "Test Hospital", "location_city": "City", "location_country": "IN", "specialties_offered": "A, B", "procedures": "X, Y"}]'
    parsed = adapter.parse(payload)
    assert len(parsed) == 1
    
    normalized = adapter.normalize(parsed[0], "2023-01-01T00:00:00Z", "raw_123")
    assert normalized["name"] == "Test Hospital"
    assert normalized["city"] == "City"
    assert normalized["specialties"] == ["A", "B"]
    
def test_hospital_candidate_validation():
    # Valid
    candidate = HospitalCandidate(
        externalIdentifier="1",
        name="Valid Hospital",
        city="City",
        country="Country",
        sourceId="src_1",
        rawRecordId="raw_1",
        retrievedAt="2023-01-01T00:00:00Z"
    )
    assert candidate.name == "Valid Hospital"
    
    # Invalid missing name
    with pytest.raises(ValidationError):
        HospitalCandidate(
            externalIdentifier="1",
            city="City",
            country="Country",
            sourceId="src_1",
            rawRecordId="raw_1",
            retrievedAt="2023-01-01T00:00:00Z"
        )
        
    # Invalid too short name
    with pytest.raises(ValidationError):
        HospitalCandidate(
            externalIdentifier="1",
            name="A",
            city="City",
            country="Country",
            sourceId="src_1",
            rawRecordId="raw_1",
            retrievedAt="2023-01-01T00:00:00Z"
        )

def test_normalize_string_for_match():
    assert normalize_string_for_match("  Test  Hospital, Inc.  ") == "test hospital inc"
    assert normalize_string_for_match("Apollo Hospitals Chennai") == "apollo hospitals chennai"
