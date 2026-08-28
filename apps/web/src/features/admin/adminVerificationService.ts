import { collection, doc, getDocs, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CorrectionRequest, SourceRecord, VerificationStatus, CorrectionStatus } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const CORRECTION_REQUESTS_COLLECTION = 'correctionRequests';
const SOURCE_RECORDS_COLLECTION = 'sourceRecords';

export const adminVerificationService = {
  // ── Source Record Verification ───────────────────────────────────────

  async getPendingVerifications(): Promise<SourceRecord[]> {
    const q = query(
      collection(db, SOURCE_RECORDS_COLLECTION),
      where('status', 'in', ['UNVERIFIED', 'REVIEWED'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SourceRecord));
  },

  async updateVerificationStatus(
    recordId: string, 
    newStatus: VerificationStatus, 
    actorId: string, 
    actorRole: string
  ): Promise<void> {
    const docRef = doc(db, SOURCE_RECORDS_COLLECTION, recordId);
    await updateDoc(docRef, { status: newStatus });
    
    let action = 'VERIFICATION_REVIEWED';
    if (newStatus === 'CONFIRMED' || newStatus === 'CLAIMED_CONFIRMED') action = 'VERIFICATION_CONFIRMED';
    else if (newStatus === 'DISPUTED') action = 'VERIFICATION_DISPUTED';

    await createAuditLog({
      actorId,
      actorRole,
      action,
      resourceType: 'SOURCE_RECORD',
      resourceId: recordId,
      metadata: { newStatus }
    });
  },

  // ── Corrections ──────────────────────────────────────────────────────

  async getPendingCorrections(): Promise<CorrectionRequest[]> {
    const q = query(
      collection(db, CORRECTION_REQUESTS_COLLECTION),
      where('status', '==', 'PENDING')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CorrectionRequest));
  },

  async reviewCorrection(
    requestId: string, 
    newStatus: CorrectionStatus, 
    actorId: string, 
    actorRole: string
  ): Promise<void> {
    const docRef = doc(db, CORRECTION_REQUESTS_COLLECTION, requestId);
    await updateDoc(docRef, {
      status: newStatus,
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString()
    });
    
    const action = newStatus === 'APPROVED' ? 'CORRECTION_APPROVED' : 'CORRECTION_REJECTED';
    
    await createAuditLog({
      actorId,
      actorRole,
      action,
      resourceType: 'CORRECTION_REQUEST',
      resourceId: requestId,
    });
  }
};
