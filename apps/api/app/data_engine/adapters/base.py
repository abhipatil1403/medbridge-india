from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseSourceAdapter(ABC):
    @property
    @abstractmethod
    def source_id(self) -> str:
        pass

    @abstractmethod
    def fetch(self) -> str:
        """Fetches raw payload (HTML, JSON string) from the source."""
        pass

    @abstractmethod
    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        """Parses the raw payload into a list of unstructured dictionaries."""
        pass

    @abstractmethod
    def normalize(self, parsed_item: Dict[str, Any], retrieved_at: str, raw_record_id: str) -> Dict[str, Any]:
        """Normalizes a single parsed item into a structured Candidate dictionary."""
        pass
