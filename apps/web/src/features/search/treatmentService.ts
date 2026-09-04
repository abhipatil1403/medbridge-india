import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Treatment } from '../../types/models';

export async function getPublishedTreatments(): Promise<Treatment[]> {
  const treatmentsRef = collection(db, 'treatments');
  
  // We ONLY query PUBLISHED records
  const q = query(
    treatmentsRef, 
    where('status', '==', 'PUBLISHED'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Treatment));
  
  // Sort alphabetically by name
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchTreatments(searchTerm: string): Promise<Treatment[]> {
  const allTreatments = await getPublishedTreatments();
  if (!searchTerm.trim()) return allTreatments;

  const term = searchTerm.toLowerCase().trim();
  return allTreatments.filter(t => 
    t.name.toLowerCase().includes(term) || 
    t.description?.toLowerCase().includes(term)
  );
}
