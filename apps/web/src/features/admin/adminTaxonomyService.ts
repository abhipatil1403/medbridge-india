import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Specialty, Treatment } from '../../types/models';

const SPECIALTIES_COLLECTION = 'specialties';
const TREATMENTS_COLLECTION = 'treatments';

export const adminTaxonomyService = {
  // ── Specialties ──────────────────────────────────────────────────────

  async getSpecialties(): Promise<Specialty[]> {
    const q = query(collection(db, SPECIALTIES_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialty));
  },

  async createSpecialty(data: Omit<Specialty, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, SPECIALTIES_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updateSpecialty(id: string, updates: Partial<Specialty>): Promise<void> {
    const docRef = doc(db, SPECIALTIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  // ── Treatments ───────────────────────────────────────────────────────

  async getTreatments(): Promise<Treatment[]> {
    const q = query(collection(db, TREATMENTS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Treatment));
  },

  async createTreatment(data: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, TREATMENTS_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updateTreatment(id: string, updates: Partial<Treatment>): Promise<void> {
    const docRef = doc(db, TREATMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
};
