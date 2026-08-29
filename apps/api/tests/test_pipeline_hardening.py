import pytest
from unittest.mock import patch, MagicMock
from app.data_engine.pipeline import run_pipeline

@pytest.fixture
def mock_db():
    with patch('app.data_engine.pipeline.get_db') as mock:
        yield mock

def test_pipeline_source_disabled(mock_db):
    db_instance = mock_db.return_value
    source_doc = MagicMock()
    source_doc.exists = True
    source_doc.to_dict.return_value = {"health": "DISABLED"}
    db_instance.collection.return_value.document.return_value.get.return_value = source_doc

    run_pipeline("src_fixture_001")

    # Verify job status was updated to FAILED with SOURCE_DISABLED
    update_mock = db_instance.collection.return_value.document.return_value.update
    called_args = [call.args[0] for call in update_mock.mock_calls if "status" in call.args[0]]
    assert any(arg.get("status") == "FAILED" and arg.get("errorMessage") == "SOURCE_DISABLED" for arg in called_args)

def test_pipeline_unchanged_hash(mock_db):
    db_instance = mock_db.return_value
    source_doc = MagicMock()
    source_doc.exists = True
    source_doc.to_dict.return_value = {"health": "HEALTHY"}
    db_instance.collection.return_value.document.return_value.get.return_value = source_doc
    
    # Mock last job with identical hash
    last_job_doc = MagicMock()
    # Assume the fixture content hash is exactly this (for simplicity we mock calculate_content_hash)
    last_job_doc.to_dict.return_value = {"contentHash": "mocked_hash", "recordsFound": 5}
    db_instance.collection.return_value.where.return_value.where.return_value.order_by.return_value.limit.return_value.stream.return_value = [last_job_doc]

    with patch('app.data_engine.pipeline.calculate_content_hash', return_value="mocked_hash"):
        run_pipeline("src_fixture_001")

    # Verify job status was updated to UNCHANGED
    update_mock = db_instance.collection.return_value.document.return_value.update
    called_args = [call.args[0] for call in update_mock.mock_calls if "status" in call.args[0]]
    assert any(arg.get("status") == "UNCHANGED" for arg in called_args)

def test_pipeline_anomalous_record_count(mock_db):
    db_instance = mock_db.return_value
    source_doc = MagicMock()
    source_doc.exists = True
    source_doc.to_dict.return_value = {"health": "HEALTHY"}
    db_instance.collection.return_value.document.return_value.get.return_value = source_doc
    
    # Mock last job with 1000 records
    last_job_doc = MagicMock()
    last_job_doc.to_dict.return_value = {"contentHash": "old_hash", "recordsFound": 1000}
    db_instance.collection.return_value.where.return_value.where.return_value.order_by.return_value.limit.return_value.stream.return_value = [last_job_doc]

    with patch('app.data_engine.pipeline.calculate_content_hash', return_value="new_hash"):
        with patch('app.data_engine.pipeline.FixtureHospitalAdapter') as MockAdapter:
            with patch('app.data_engine.pipeline.store_raw_payload'):
                with patch('app.data_engine.pipeline.create_raw_record'):
                    instance = MockAdapter.return_value
                    # current run finds only 2 records (massive drop, > 10 absolute diff)
                    instance.parse.return_value = [1, 2]
                    run_pipeline("src_fixture_001")

    # Verify job status was updated to FAILED with ANOMALOUS_RECORD_COUNT
    update_mock = db_instance.collection.return_value.document.return_value.update
    called_args = [call.args[0] for call in update_mock.mock_calls if "status" in call.args[0]]
    assert any(arg.get("status") == "FAILED" and "ANOMALOUS_RECORD_COUNT" in str(arg.get("errorMessage")) for arg in called_args)
