import { collection, query, where, getDocs, QueryConstraint, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Hospital } from '../../types/models';

export interface SearchFilters {
  name?: string;
  state?: string;
  district?: string;
  town?: string;
  city?: string;
  specialty?: string;
  careType?: string;
  category?: string;
  facilities?: string;
  systemsOfMedicine?: string;
}

export async function searchProviders(filters: SearchFilters): Promise<Hospital[]> {
  const providersRef = collection(db, 'hospitals');
  
  // We ONLY query PUBLISHED records
  const conditions: QueryConstraint[] = [
    where('status', '==', 'PUBLISHED')
  ];

  // Apply deterministic strict matches to limit the fetch size
  if (filters.state) conditions.push(where('state', '==', filters.state));
  if (filters.district) conditions.push(where('district', '==', filters.district));
  if (filters.careType) conditions.push(where('careType', '==', filters.careType));
  if (filters.category) conditions.push(where('category', '==', filters.category));
  
  // We can only use one array-contains per Firestore query,
  // so we will prioritize the most likely to reduce results if provided.
  if (filters.specialty) {
    conditions.push(where('specialties', 'array-contains', filters.specialty));
  } else if (filters.facilities) {
    conditions.push(where('facilities', 'array-contains', filters.facilities));
  }

  // To prevent loading thousands of providers, we limit to 100 before applying
  // client-side in-memory filtering for text matching or additional arrays.
  conditions.push(limit(100));

  const q = query(providersRef, ...conditions);
  const snapshot = await getDocs(q);
  
  let results: Hospital[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  
  // Client-side in-memory filtering for remaining fields that Firestore can't natively combine easily
  if (filters.name) {
    const qName = filters.name.toLowerCase();
    results = results.filter(h => h.name.toLowerCase().includes(qName));
  }
  
  if (filters.city) {
    const qCity = filters.city.toLowerCase();
    results = results.filter(h => h.city?.toLowerCase().includes(qCity));
  }
  
  if (filters.town) {
    const qTown = filters.town.toLowerCase();
    results = results.filter(h => h.town?.toLowerCase().includes(qTown));
  }

  if (filters.specialty && filters.facilities) {
    // If specialty was the array-contains query, we must manually filter facilities
    results = results.filter(h => h.facilities?.includes(filters.facilities!));
  }

  if (filters.systemsOfMedicine) {
    results = results.filter(h => h.systemsOfMedicine?.includes(filters.systemsOfMedicine!));
  }
  
  return results;
}
