import { collection, doc, getDocs, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { ComplianceReview, ComplianceStatus } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const COMPLIANCE_REVIEWS_COLLECTION = 'complianceReviews';

export const adminComplianceService = {
  async getPendingReviews(): Promise<ComplianceReview[]> {
    const q = query(
      collection(db, COMPLIANCE_REVIEWS_COLLECTION),
      where('status', '==', 'PENDING')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplianceReview));
  },

  async submitReviewDecision(
    reviewId: string, 
    newStatus: ComplianceStatus, 
    notes: string,
    actorId: string, 
    actorRole: string
  ): Promise<void> {
    const docRef = doc(db, COMPLIANCE_REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      status: newStatus,
      notes,
      reviewerId: actorId,
      reviewedAt: new Date().toISOString()
    });
    
    const action = newStatus === 'APPROVED' ? 'COMPLIANCE_APPROVED' : 'COMPLIANCE_REJECTED';
    
    await createAuditLog({
      actorId,
      actorRole,
      action,
      resourceType: 'COMPLIANCE_REVIEW',
      resourceId: reviewId,
    });
  }
};
