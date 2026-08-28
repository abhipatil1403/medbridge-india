import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CostEstimate, VerificationStatus } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const COST_ESTIMATES_COLLECTION = 'costEstimates';

export const adminCostService = {
  async getCostEstimates(): Promise<CostEstimate[]> {
    const q = query(collection(db, COST_ESTIMATES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostEstimate));
  },

  async createCostEstimate(data: Omit<CostEstimate, 'id' | 'createdAt' | 'updatedAt'>, actorId: string, actorRole: string): Promise<string> {
    const docRef = await addDoc(collection(db, COST_ESTIMATES_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'COST_ESTIMATE_CREATED',
      resourceType: 'COST_ESTIMATE',
      resourceId: docRef.id,
    });
    
    return docRef.id;
  },

  async updateCostEstimate(id: string, updates: Partial<CostEstimate>, actorId: string, actorRole: string): Promise<void> {
    const docRef = doc(db, COST_ESTIMATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    await createAuditLog({
      actorId,
      actorRole,
      action: 'COST_ESTIMATE_UPDATED',
      resourceType: 'COST_ESTIMATE',
      resourceId: id,
    });
  }
};
