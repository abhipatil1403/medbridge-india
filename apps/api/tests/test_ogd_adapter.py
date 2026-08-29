import pytest
import io
import csv
from unittest.mock import patch, MagicMock
from app.data_engine.adapters.ogd_hospital_adapter import OgdHospitalAdapter

MOCK_CSV = """Sr_No,Hospital_Name,State,District,Pincode,Address_Original_First_Line,Town,Subtown,Village,Specialties,Hospital_Care_Type,Location_Coordinates,Total_Num_Beds
1,Good Health Hospital,Delhi,New Delhi,110001,123 Health St,New Delhi,,0,"Cardiology, Neurology",Hospital,"28.6139, 77.2090",100
2,City Care Clinic,Delhi,New Delhi,110001,456 Care Ave,0,0,0,0,Dispensary,0,0
3,Same Name Hospital,Delhi,New Delhi,110001,789 Similar St,New Delhi,0,0,"Orthopedics",Hospital,"28.6139, 77.2090",50
4,Same Name Hospital,Maharashtra,Pune,411001,123 Pune St,Pune,0,0,0,Hospital,0,50
"""

@pytest.fixture
def mock_httpx_client():
    with patch("httpx.Client") as mock_client:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.content = MOCK_CSV.encode("utf-8-sig")
        mock_instance.get.return_value = mock_response
        mock_client.return_value.__enter__.return_value = mock_instance
        yield mock_instance

def test_ogd_adapter_fetch(mock_httpx_client):
    adapter = OgdHospitalAdapter("http://fake-url.com")
    payload = adapter.fetch()
    assert "Good Health Hospital" in payload

def test_ogd_adapter_parse_and_normalize(mock_httpx_client):
    adapter = OgdHospitalAdapter("http://fake-url.com")
    payload = adapter.fetch()
    parsed = adapter.parse(payload)
    
    assert len(parsed) == 4
    
    # Test valid hospital
    norm1 = adapter.normalize(parsed[0], "2026-08-29T00:00:00Z", "raw_1")
    assert norm1.get("_exclude") is None or norm1.get("_exclude") is False
    assert norm1["name"] == "Good Health Hospital"
    assert norm1["city"] == "New Delhi"
    assert norm1["citySource"] == "Town"
    assert norm1["specialties"] == ["Cardiology", "Neurology"]
    assert norm1["totalBeds"] == "100"
    
    # Test unsupported care type
    norm2 = adapter.normalize(parsed[1], "2026-08-29T00:00:00Z", "raw_1")
    assert norm2["_exclude"] is True
    assert norm2["reason"] == "UNSUPPORTED_CARE_TYPE"
    assert norm2["careType"] == "Dispensary"
    
    # Test missing values (0)
    norm3 = adapter.normalize(parsed[2], "2026-08-29T00:00:00Z", "raw_1")
    assert norm3["village"] is None
    
    # Test deterministic ID for same name in different locations
    norm4 = adapter.normalize(parsed[3], "2026-08-29T00:00:00Z", "raw_1")
    assert norm3["name"] == norm4["name"]
    assert norm3["externalIdentifier"] != norm4["externalIdentifier"]
