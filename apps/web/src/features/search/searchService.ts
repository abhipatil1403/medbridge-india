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
  
  // We ONLY query PUBLISHED records from Firestore
  const conditions: QueryConstraint[] = [
    where('status', '==', 'PUBLISHED'),
    limit(200)
  ];

  const q = query(providersRef, ...conditions);
  const snapshot = await getDocs(q);
  
  let results: Hospital[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  
  // Robust case-insensitive in-memory filtering
  if (filters.name?.trim()) {
    const qName = filters.name.trim().toLowerCase();
    results = results.filter(h => h.name?.toLowerCase().includes(qName));
  }
  
  if (filters.state?.trim()) {
    const qState = filters.state.trim().toLowerCase();
    results = results.filter(h => h.state?.toLowerCase().includes(qState));
  }
  
  if (filters.district?.trim()) {
    const qDistrict = filters.district.trim().toLowerCase();
    results = results.filter(h => h.district?.toLowerCase().includes(qDistrict));
  }

  if (filters.city?.trim()) {
    const qCity = filters.city.trim().toLowerCase();
    results = results.filter(h => h.city?.toLowerCase().includes(qCity));
  }
  
  if (filters.town?.trim()) {
    const qTown = filters.town.trim().toLowerCase();
    results = results.filter(h => h.town?.toLowerCase().includes(qTown));
  }

  if (filters.careType?.trim()) {
    const qCare = filters.careType.trim().toLowerCase();
    results = results.filter(h => h.careType?.toLowerCase().includes(qCare));
  }

  if (filters.category?.trim()) {
    const qCat = filters.category.trim().toLowerCase();
    results = results.filter(h => h.category?.toLowerCase().includes(qCat));
  }

  if (filters.specialty?.trim()) {
    const qSpec = filters.specialty.trim().toLowerCase();
    results = results.filter(h => h.specialties?.some(s => s.toLowerCase().includes(qSpec)));
  }

  if (filters.facilities?.trim()) {
    const qFac = filters.facilities.trim().toLowerCase();
    results = results.filter(h => (Array.isArray(h.facilities) ? h.facilities : [h.facilities || '']).some(f => String(f).toLowerCase().includes(qFac)));
  }

  if (filters.systemsOfMedicine?.trim()) {
    const qSys = filters.systemsOfMedicine.trim().toLowerCase();
    results = results.filter(h => (Array.isArray(h.systemsOfMedicine) ? h.systemsOfMedicine : [h.systemsOfMedicine || '']).some(s => String(s).toLowerCase().includes(qSys)));
  }
  
  return results;
}
