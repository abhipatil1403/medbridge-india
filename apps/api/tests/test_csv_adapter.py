import pytest
from app.data_engine.adapters.csv_adapter import CsvAdapter

def test_csv_adapter_parsing():
    csv_content = """source_id,hospital_name,provider_type,city,country,latitude,longitude,treatment_id,treatment_name
src1,Test Hospital,HOSPITAL,Mumbai,India,19.0,72.8,cabg,CABG Surgery"""
    adapter = CsvAdapter(csv_content, "src1")
    parsed = adapter.parse(adapter.fetch())
    assert len(parsed) == 1
    assert parsed[0]["hospital_name"] == "Test Hospital"

def test_csv_adapter_normalization():
    csv_content = """source_id,hospital_name,provider_type,city,country,latitude,longitude,data_origin,rating_score,treatment_id,treatment_name
src1,Test Hospital,INVALID_TYPE,Mumbai,India,19.0,72.8,SYNTHETIC,4.5,cabg,CABG Surgery"""
    adapter = CsvAdapter(csv_content, "src1")
    parsed = adapter.parse(adapter.fetch())
    normalized = adapter.normalize(parsed[0], "2026-09-01T00:00:00Z", "raw_1")
    
    # Check invalid provider type fallback
    assert normalized["providerType"] == "HOSPITAL"
    # Check coordinates combined
    assert normalized["coordinates"] == "19.0,72.8"
    # Check data_origin parsing
    assert normalized["dataOrigin"] == "SYNTHETIC"
    # Check safe float
    assert normalized["rating"] == 4.5
    # Check treatment info mapped
    assert normalized["_treatment_id"] == "cabg"

def test_csv_adapter_missing_optionals():
    csv_content = """source_id,hospital_name,provider_type,city,country
src1,Test Clinic,CLINIC,Delhi,India"""
    adapter = CsvAdapter(csv_content, "src1")
    parsed = adapter.parse(adapter.fetch())
    normalized = adapter.normalize(parsed[0], "2026-09-01T00:00:00Z", "raw_2")
    
    assert normalized["providerType"] == "CLINIC"
    assert normalized["coordinates"] is None
    assert normalized["rating"] is None
    assert normalized["dataOrigin"] == "REAL_PUBLIC" # default

    csv_content = """source_id,hospital_name,provider_type,city,country
src1,Test Clinic,CLINIC,Delhi,India"""
    adapter = CsvAdapter(csv_content, "src1")
    parsed = adapter.parse(adapter.fetch())
    normalized = adapter.normalize(parsed[0], "2026-09-01T00:00:00Z", "raw_2")
    
    assert normalized["providerType"] == "CLINIC"
    assert normalized["coordinates"] is None
    assert normalized["rating"] is None
    assert normalized["dataOrigin"] == "REAL_PUBLIC" # default
