import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

def _initialize_firebase():
    if not firebase_admin._apps:
        try:
            service_account_str = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
            if service_account_str:
                service_account_info = json.loads(service_account_str)
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'medbridge-india.appspot.com')
                })
            else:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'medbridge-india.appspot.com')
                })
        except Exception:
            # Fallback if no ADC and no env var
            firebase_admin.initialize_app(options={
                'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'medbridge-india.appspot.com')
            })

def get_db():
    _initialize_firebase()
    return firestore.client()

def get_bucket():
    _initialize_firebase()
    return storage.bucket()
