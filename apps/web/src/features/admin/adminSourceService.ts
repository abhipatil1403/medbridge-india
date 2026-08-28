import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Source, SourceRecord } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const SOURCES_COLLECTION = 'sources';
const SOURCE_RECORDS_COLLECTION = 'sourceRecords';

export const adminSourceService = {
  // ── Sources ──────────────────────────────────────────────────────────

  async getSources(): Promise<Source[]> {
    const q = query(collection(db, SOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Source));
  },

  async getSource(id: string): Promise<Source | null> {
    const docRef = doc(db, SOURCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Source;
    }
    return null;
  },

  async createSource(data: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>, actorId: string, actorRole: string): Promise<string> {
    const docRef = await addDoc(collection(db, SOURCES_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'SOURCE_CREATED',
      resourceType: 'SOURCE',
      resourceId: docRef.id,
    });
    
    return docRef.id;
  },

  async updateSource(id: string, updates: Partial<Source>, actorId: string, actorRole: string): Promise<void> {
    const docRef = doc(db, SOURCES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'SOURCE_UPDATED',
      resourceType: 'SOURCE',
      resourceId: id,
    });
  },

  // ── Source Records ───────────────────────────────────────────────────

  async getSourceRecordsByEntity(entityType: string, entityId: string): Promise<SourceRecord[]> {
    // Basic fetch (in a real app you might want to query properly with an index)
    const snapshot = await getDocs(collection(db, SOURCE_RECORDS_COLLECTION));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as SourceRecord))
      .filter(record => record.entityType === entityType && record.entityId === entityId);
  }
};
