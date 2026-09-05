import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.production' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medbridge-india---staging";

try {
  initializeApp({ projectId });
} catch (e) {}

async function verify() {
  const auth = getAuth();
  const db = getFirestore();

  const listUsersResult = await auth.listUsers(10);
  for (const userRecord of listUsersResult.users) {
    console.log(`\nFound Firebase Auth User (UID masked): ***${userRecord.uid.slice(-4)}`);
    console.log(`Email exists: ${!!userRecord.email}`);
    
    const docRef = db.collection('users').doc(userRecord.uid);
    const snap = await docRef.get();
    
    if (snap.exists) {
      console.log(`Firestore profile EXISTS.`);
      const data = snap.data();
      if (data) {
        console.log(`Raw roles value type: ${typeof data.roles}`);
        if (Array.isArray(data.roles)) {
            console.log(`Raw roles value: ${JSON.stringify(data.roles)}`);
        } else {
            console.log(`Raw roles value: ${data.roles}`);
        }
      }
    } else {
      console.log(`Firestore profile does NOT exist.`);
    }
  }
}

verify().catch(console.error);
