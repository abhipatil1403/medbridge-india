import sys
from app.data_engine.pipeline import run_pipeline
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    
    if len(sys.argv) < 2:
        print("Usage: python -m app.data_engine <source_id>")
        sys.exit(1)
        
    source_id = sys.argv[1]
    print(f"Starting data acquisition for source: {source_id}")
    run_pipeline(source_id)
