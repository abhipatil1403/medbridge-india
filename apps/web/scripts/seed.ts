import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust if needed

// IMPORTANT: This script uses the Admin SDK. 
// For local emulation, ensure FIRESTORE_EMULATOR_HOST is set, OR 
// provide a service account path in GOOGLE_APPLICATION_CREDENTIALS.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medbridge-dev";

// Initialize Firebase Admin
try {
  initializeApp({ projectId });
  console.log("Initialized Firebase Admin");
} catch (e) {
  console.log("Firebase already initialized");
}

const db = getFirestore();

async function seed() {
  console.log("Seeding Development Data...");
  
  const now = new Date().toISOString();

  // 1. Hospitals
  const hospitals = [
    {
      name: "Demo Hospital OrthoCare",
      city: "Mumbai",
      specialties: ["Orthopedics"],
      treatments: ["Knee Replacement", "Hip Replacement"],
      status: "PUBLISHED",
      source: "Development Seed Data",
      verificationStatus: "REVIEWED",
      lastCheckedAt: now,
      accreditation: "JCI Accredited"
    },
    {
      name: "Demo Cardiac Institute",
      city: "Delhi",
      specialties: ["Cardiac Sciences"],
      treatments: ["CABG", "Angioplasty"],
      status: "PUBLISHED",
      source: "Development Seed Data",
      verificationStatus: "CLAIMED_CONFIRMED",
      lastCheckedAt: now,
      accreditation: "NABH Accredited"
    },
    {
      name: "Unpublished Demo Clinic",
      city: "Bangalore",
      specialties: ["Orthopedics"],
      treatments: ["Knee Replacement"],
      status: "DRAFT",
      source: "Development Seed Data",
      verificationStatus: "UNVERIFIED",
      lastCheckedAt: now,
    }
  ];

  const hospitalIds: string[] = [];
  for (const h of hospitals) {
    const docRef = await db.collection('hospitals').add(h);
    hospitalIds.push(docRef.id);
  }
  
  // 2. Cost Estimates
  const estimates = [
    {
      hospitalId: hospitalIds[0],
      treatmentId: "Knee Replacement",
      treatmentName: "Knee Replacement",
      currency: "INR",
      minAmount: 300000,
      maxAmount: 450000,
      inclusions: ["Surgery", "5 Days Room"],
      source: "Development Seed Data",
      verificationStatus: "REVIEWED"
    },
    {
      hospitalId: hospitalIds[1],
      treatmentId: "CABG",
      treatmentName: "Coronary Artery Bypass Grafting",
      currency: "INR",
      minAmount: 400000,
      maxAmount: 600000,
      source: "Development Seed Data",
      verificationStatus: "REVIEWED"
    }
  ];

  for (const est of estimates) {
    await db.collection('costEstimates').add(est);
  }

  console.log("Seeding complete. Added Hospitals and Cost Estimates.");
}

seed().catch(console.error);
