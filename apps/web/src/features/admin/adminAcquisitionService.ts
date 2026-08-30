import { collection, doc, getDocs, getDoc, updateDoc, query, orderBy, where, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { AcquisitionReview, AcquisitionReviewStatus, Hospital, ProviderStatus } from '../../types/models';
import { createAuditLog } from './adminAuditService';

const ACQUISITION_REVIEWS_COLLECTION = 'acquisitionReviews';
const ACQUISITION_JOBS_COLLECTION = 'acquisitionJobs';
const HOSPITALS_COLLECTION = 'hospitals';

export const adminAcquisitionService = {
  async getAcquisitionJobs(): Promise<any[]> {
    const q = query(collection(db, ACQUISITION_JOBS_COLLECTION), orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getPendingReviews(): Promise<AcquisitionReview[]> {
    const q = query(
      collection(db, ACQUISITION_REVIEWS_COLLECTION),
      where('status', 'in', ['PENDING', 'IN_REVIEW', 'NEEDS_CHANGES'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcquisitionReview));
  },

  async getReviewById(id: string): Promise<AcquisitionReview | null> {
    const docRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as AcquisitionReview;
  },

  async updateReviewStatus(
    reviewId: string,
    newStatus: AcquisitionReviewStatus,
    actorId: string,
    actorRole: string,
    notes?: string
  ): Promise<void> {
    const docRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      status: newStatus,
      reviewerId: actorId,
      reviewerNotes: notes || null,
      reviewedAt: new Date().toISOString()
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: `ACQUISITION_${newStatus}`,
      resourceType: 'ACQUISITION_REVIEW',
      resourceId: reviewId,
    });
  },

  /**
   * Approves a candidate and merges specific fields into an existing hospital.
   */
  async approveAndMergeToExisting(
    reviewId: string,
    hospitalId: string,
    candidateData: any,
    canonicalData: any,
    approvedFields: string[],
    actorId: string,
    actorRole: string
  ): Promise<void> {
    // 1. Safe Merge: Candidate null/empty does not overwrite populated canonical.
    const mergedData: any = {};
    for (const field of approvedFields) {
      const candVal = candidateData[field];
      const canVal = canonicalData[field];
      
      // Do not overwrite with empty or "0" if canonical has a value
      if (candVal === null || candVal === undefined || candVal === "" || candVal === "0") {
         if (canVal !== null && canVal !== undefined && canVal !== "") {
           continue; // Preserve canonical
         }
      }
      mergedData[field] = candVal;
      
      // Merge Provenance
      if (!mergedData._provenance) mergedData._provenance = {};
      mergedData._provenance[field] = {
        sourceId: candidateData.sourceId || null,
        rawRecordId: candidateData.rawRecordId || null,
        retrievedAt: candidateData.retrievedAt || null
      };
    }

    if (Object.keys(mergedData).length > 0) {
      const hospitalRef = doc(db, HOSPITALS_COLLECTION, hospitalId);
      await updateDoc(hospitalRef, {
        ...mergedData,
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Mark review as APPROVED_MERGE
    const docRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      status: 'APPROVED_MERGE',
      entityId: hospitalId,
      reviewerId: actorId,
      reviewedAt: new Date().toISOString()
    });

    // 3. Audit logs
    await createAuditLog({
      actorId,
      actorRole,
      action: 'ACQUISITION_APPROVED_MERGE',
      resourceType: 'HOSPITAL',
      resourceId: hospitalId,
      metadata: { reviewId, updatedKeys: Object.keys(mergedData) }
    });
  },

  /**
   * Approves a candidate and creates a NEW hospital in DRAFT state.
   */
  async approveAndCreateDraft(
    reviewId: string,
    candidateData: any,
    actorId: string,
    actorRole: string
  ): Promise<string> {
    const now = new Date().toISOString();
    
    const newHospital: Hospital = {
      name: candidateData.name || '',
      city: candidateData.city || null,
      specialties: candidateData.specialties || [],
      treatments: candidateData.treatments || [],
      status: 'DRAFT', 
      source: 'DATA_PIPELINE',
      verificationStatus: 'REVIEWED',
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
      ...candidateData
    };

    delete (newHospital as any).sourceId;
    delete (newHospital as any).rawRecordId;
    delete (newHospital as any).retrievedAt;
    delete (newHospital as any).externalIdentifier;
    delete (newHospital as any).matchType;

    const hospitalRef = await addDoc(collection(db, HOSPITALS_COLLECTION), newHospital);
    const newId = hospitalRef.id;

    const reviewRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      status: 'APPROVED_NEW_DRAFT',
      entityId: newId,
      reviewerId: actorId,
      reviewedAt: now
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: 'ACQUISITION_APPROVED_NEW_DRAFT',
      resourceType: 'HOSPITAL',
      resourceId: newId,
      metadata: { reviewId }
    });

    return newId;
  },

  /**
   * Rejects a candidate.
   */
  async rejectReview(
    reviewId: string,
    rejectionReason: string,
    reviewerNotes: string,
    actorId: string,
    actorRole: string
  ): Promise<void> {
    const docRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      status: 'REJECTED',
      rejectionReason,
      reviewerNotes: reviewerNotes || null,
      reviewerId: actorId,
      reviewedAt: new Date().toISOString()
    });

    await createAuditLog({
      actorId,
      actorRole,
      action: 'ACQUISITION_REJECTED',
      resourceType: 'ACQUISITION_REVIEW',
      resourceId: reviewId,
      metadata: { rejectionReason }
    });
  }
};
