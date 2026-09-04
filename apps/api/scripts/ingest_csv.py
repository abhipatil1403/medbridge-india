import os
import sys
import argparse
from pathlib import Path

# Add the apps/api folder to the Python path to allow absolute imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_engine.pipeline import run_pipeline
from app.data_engine.adapters.csv_adapter import CsvAdapter

def main():
    parser = argparse.ArgumentParser(description="Ingest a Master CSV into the Data Engine")
    parser.add_argument("csv_path", type=str, help="Path to the Master CSV file")
    parser.add_argument("--source-id", type=str, default="manual_csv_import", help="Source ID to use for provenance (e.g. manual_csv_import)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.csv_path):
        print(f"Error: CSV file not found at {args.csv_path}")
        sys.exit(1)
        
    print(f"Loading CSV from {args.csv_path}...")
    with open(args.csv_path, 'r', encoding='utf-8') as f:
        csv_content = f.read()
        
    adapter = CsvAdapter(csv_content, args.source_id)
    
    print(f"Running pipeline for source '{args.source_id}'...")
    run_pipeline(args.source_id, adapter=adapter)
    
    print("Ingestion script completed.")

if __name__ == "__main__":
    main()
