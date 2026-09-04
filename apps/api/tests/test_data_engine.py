import pytest
from unittest.mock import patch, MagicMock
from app.data_engine.adapters.fixture_adapter import FixtureHospitalAdapter
from app.data_engine.acquisition import calculate_content_hash
from app.data_engine.deduplication import deduplicate_provider, normalize_string_for_match, MatchLevel
from app.data_engine.models.candidates import ProviderCandidate
from pydantic import ValidationError

def test_calculate_content_hash():
    payload = "<html>test</html>"
    hash1 = calculate_content_hash(payload)
    hash2 = calculate_content_hash(payload)
    assert hash1 == hash2

def test_fixture_adapter_normalize():
    adapter = FixtureHospitalAdapter()
    raw = {
        "id": "1",
        "hospital_name": "Test Hospital",
        "location_city": "Pune",
        "specialties_offered": "A, B"
    }
    normalized = adapter.normalize(raw, "2023-01-01", "raw_1")
    assert normalized["name"] == "Test Hospital"
    assert normalized["specialties"] == ["A", "B"]
    
def test_hospital_candidate_validation():
    # Valid
    candidate = ProviderCandidate(
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
        ProviderCandidate(
            externalIdentifier="2",
            city="City",
            country="Country",
            sourceId="src_1",
            rawRecordId="raw_2",
            retrievedAt="2023-01-01"
        )

def test_deduplicate_provider():
    with patch('app.data_engine.deduplication.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_stream = MagicMock()
        
        mock_doc = MagicMock()
        mock_doc.id = "canonical_1"
        mock_doc.to_dict.return_value = {
            "name": "Apollo Hospital",
            "state": "Maharashtra",
            "district": "Pune",
            "pincode": "411001"
        }
        mock_stream.return_value = [mock_doc]
        mock_db.collection.return_value.where.return_value.stream = mock_stream
        
        # Test exact match
        candidate = ProviderCandidate(
            externalIdentifier="ext1",
            name="Apollo Hospital",
            city="Pune",
            state="Maharashtra",
            district="Pune",
            pincode="411001",
            country="India",
            sourceId="test_source",
            rawRecordId="raw1",
            retrievedAt="2023-01-01"
        )
        
        match_level, match_id = deduplicate_provider(candidate)
        
        assert match_level == MatchLevel.EXACT_MATCH
        assert match_id == "canonical_1"
        
        # Test NO_MATCH
        candidate_no_match = ProviderCandidate(
            externalIdentifier="ext2",
            name="Fortis Clinic",
            city="Mumbai",
            state="Maharashtra",
            district="Mumbai",
            pincode="400001",
            country="India",
            sourceId="test_source",
            rawRecordId="raw2",
            retrievedAt="2023-01-01"
        )
        
        mock_stream_empty = MagicMock()
        mock_stream_empty.return_value = []
        mock_db.collection.return_value.where.return_value.stream = mock_stream_empty
        
        match_level_2, match_id_2 = deduplicate_provider(candidate_no_match)
        
        assert match_level_2 == MatchLevel.NO_MATCH
        assert match_id_2 is None

def test_normalize_string_for_match():
    assert normalize_string_for_match("Apollo Hospitals (Pune)") == "apollo hospitals pune"
    assert normalize_string_for_match("  XYZ   Clinic,   Dr. John  ") == "xyz clinic dr john"
    assert normalize_string_for_match(None) == ""
