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
    approvedFields: Partial<Hospital>,
    actorId: string,
    actorRole: string
  ): Promise<void> {
    // 1. Update the canonical hospital only with approved fields
    const hospitalRef = doc(db, HOSPITALS_COLLECTION, hospitalId);
    await updateDoc(hospitalRef, {
      ...approvedFields,
      updatedAt: new Date().toISOString()
    });

    // 2. Mark review as APPROVED and linked
    const docRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      status: 'APPROVED',
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
      metadata: { reviewId, updatedKeys: Object.keys(approvedFields) }
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
    // 1. Create new hospital record as DRAFT
    const now = new Date().toISOString();
    
    // We expect candidateData to roughly match Hospital model
    const newHospital: Hospital = {
      name: candidateData.name || '',
      city: candidateData.city || '',
      specialties: candidateData.specialties || [],
      treatments: candidateData.treatments || [],
      status: 'DRAFT', // Critically DRAFT, not PUBLISHED
      source: 'DATA_PIPELINE',
      verificationStatus: 'REVIEWED',
      lastCheckedAt: now,
      // Any extra fields mapped from candidateData
      ...candidateData
    };

    // Remove pipeline specific fields if they were in candidateData
    delete (newHospital as any).sourceId;
    delete (newHospital as any).rawRecordId;
    delete (newHospital as any).retrievedAt;
    delete (newHospital as any).externalIdentifier;

    const hospitalRef = await addDoc(collection(db, HOSPITALS_COLLECTION), newHospital);
    const newId = hospitalRef.id;

    // 2. Update the review to link it to the newly created ID
    const reviewRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      status: 'APPROVED',
      entityId: newId,
      reviewerId: actorId,
      reviewedAt: now
    });

    // 3. Audit log
    await createAuditLog({
      actorId,
      actorRole,
      action: 'ACQUISITION_APPROVED_NEW_DRAFT',
      resourceType: 'HOSPITAL',
      resourceId: newId,
      metadata: { reviewId }
    });

    return newId;
  }
};
