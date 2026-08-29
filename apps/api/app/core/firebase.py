import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

# Initialize only if not already initialized
if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'medbridge-india.appspot.com')
        })
    except Exception:
        # Fallback if no ADC (e.g. local testing without gcloud auth)
        # Assuming GOOGLE_APPLICATION_CREDENTIALS is set, or running in an emulator
        firebase_admin.initialize_app(options={
            'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'medbridge-india.appspot.com')
        })

def get_db():
    return firestore.client()

def get_bucket():
    return storage.bucket()
