from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import datetime

class BaseSourceAdapter(ABC):
    """
    Abstract base class for all data ingestion source adapters.
    """
    
    def __init__(self, source_id: str, source_name: str, source_url: str):
        self.source_id = source_id
        self.source_name = source_name
        self.source_url = source_url
        self.data_origin = 'REAL_PUBLIC'

    @abstractmethod
    def fetch(self) -> Any:
        """
        Fetches raw data from the source.
        Returns the raw payload (JSON, CSV text, XML, etc.)
        """
        pass

    @abstractmethod
    def parse(self, raw_payload: Any) -> List[Dict[str, Any]]:
        """
        Parses the raw payload into a list of raw dictionaries.
        """
        pass

    @abstractmethod
    def normalize(self, raw_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        """
        Normalizes a parsed item into a schema matching Candidate objects.
        Should return a dictionary that can be validated into a Candidate.
        """
        pass

class SyntheticSourceAdapter(BaseSourceAdapter):
    """
    Adapter specifically for Synthetic development data.
    """
    def __init__(self, source_id: str = "src_synthetic_dev"):
        super().__init__(source_id, "MedBridge Synthetic Generator", "local://synthetic")
        self.data_origin = 'SYNTHETIC'

    def fetch(self) -> Any:
        return []

    def parse(self, raw_payload: Any) -> List[Dict[str, Any]]:
        return []

    def normalize(self, raw_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        return {}
