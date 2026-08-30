import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Hospital, Doctor } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const HOSPITALS_COLLECTION = 'hospitals';
const DOCTORS_COLLECTION = 'doctors';

export const adminProviderService = {
  // ── Hospitals ────────────────────────────────────────────────────────
  
  async getHospitals(): Promise<Hospital[]> {
    const snapshot = await getDocs(collection(db, HOSPITALS_COLLECTION));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || a.lastCheckedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || b.lastCheckedAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async getHospital(id: string): Promise<Hospital | null> {
    const docRef = doc(db, HOSPITALS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Hospital;
    }
    return null;
  },

  async createHospital(hospitalData: Omit<Hospital, 'id'>, actorId: string, actorRole: string): Promise<string> {
    const docRef = await addDoc(collection(db, HOSPITALS_COLLECTION), {
      ...hospitalData,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'PROVIDER_CREATED',
      resourceType: 'HOSPITAL',
      resourceId: docRef.id,
    });
    
    return docRef.id;
  },

  async updateHospital(id: string, updates: Partial<Hospital>, actorId: string, actorRole: string): Promise<void> {
    const docRef = doc(db, HOSPITALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'PROVIDER_UPDATED',
      resourceType: 'HOSPITAL',
      resourceId: id,
    });
  },

  async publishHospital(id: string, actorId: string, actorRole: string): Promise<void> {
    const hospital = await this.getHospital(id);
    if (!hospital) throw new Error('Hospital not found');
    
    // Validate required fields for publication
    if (!hospital.name || !hospital.city || !hospital.specialties?.length || !hospital.treatments?.length) {
      throw new Error('Missing required fields for publication');
    }
    
    await this.updateHospital(id, { status: 'PUBLISHED' }, actorId, actorRole);
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'PROVIDER_PUBLISHED',
      resourceType: 'HOSPITAL',
      resourceId: id,
    });
  },

  async unpublishHospital(id: string, actorId: string, actorRole: string): Promise<void> {
    await this.updateHospital(id, { status: 'DRAFT' }, actorId, actorRole);
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'PROVIDER_UNPUBLISHED',
      resourceType: 'HOSPITAL',
      resourceId: id,
    });
  },

  // ── Doctors ──────────────────────────────────────────────────────────

  async getDoctors(): Promise<Doctor[]> {
    const q = query(collection(db, DOCTORS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
  },

  async getDoctor(id: string): Promise<Doctor | null> {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Doctor;
    }
    return null;
  },

  async createDoctor(doctorData: Omit<Doctor, 'id'>, actorId: string, actorRole: string): Promise<string> {
    const docRef = await addDoc(collection(db, DOCTORS_COLLECTION), {
      ...doctorData,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'DOCTOR_CREATED',
      resourceType: 'DOCTOR',
      resourceId: docRef.id,
    });
    
    return docRef.id;
  },

  async updateDoctor(id: string, updates: Partial<Doctor>, actorId: string, actorRole: string): Promise<void> {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'DOCTOR_UPDATED',
      resourceType: 'DOCTOR',
      resourceId: id,
    });
  },
  
  async publishDoctor(id: string, actorId: string, actorRole: string): Promise<void> {
    const doctor = await this.getDoctor(id);
    if (!doctor) throw new Error('Doctor not found');
    
    if (!doctor.name || !doctor.city || !doctor.specialties?.length || !doctor.treatments?.length) {
      throw new Error('Missing required fields for publication');
    }
    
    await this.updateDoctor(id, { status: 'PUBLISHED' }, actorId, actorRole);
  },

  async unpublishDoctor(id: string, actorId: string, actorRole: string): Promise<void> {
    await this.updateDoctor(id, { status: 'DRAFT' }, actorId, actorRole);
  }
};
