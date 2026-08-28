# Firebase Setup

## Steps
1. Create Firebase project.
2. Enable Authentication (Email/Password, Google).
3. Enable Firestore Database.
4. Enable Firebase Storage.
5. Setup service account for backend (DO NOT COMMIT).

## Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Future Migration
Firebase handles Auth/Data for MVP. Backend FastAPI can be extended to fully replace Firebase later.
