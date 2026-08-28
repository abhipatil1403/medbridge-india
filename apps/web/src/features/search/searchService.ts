import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Hospital } from '../../types/models';

export async function searchProviders(treatment: string, specialty: string, location: string): Promise<Hospital[]> {
  const providersRef = collection(db, 'hospitals');
  
  const conditions: QueryConstraint[] = [
    where('status', '==', 'PUBLISHED')
  ];

  if (location) conditions.push(where('city', '==', location));
  if (specialty) conditions.push(where('specialties', 'array-contains', specialty));
  // Note: Firestore doesn't support multiple array-contains. 
  // For basic MVP, we will filter treatments in memory if specialty is provided,
  // or query treatments if specialty is empty.
  
  if (treatment && !specialty) {
    conditions.push(where('treatments', 'array-contains', treatment));
  }
  
  const q = query(providersRef, ...conditions);
  const snapshot = await getDocs(q);
  
  let results: Hospital[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  
  // In-memory filter for treatment if specialty was queried
  if (treatment && specialty) {
    results = results.filter(h => h.treatments.includes(treatment));
  }
  
  return results;
}
