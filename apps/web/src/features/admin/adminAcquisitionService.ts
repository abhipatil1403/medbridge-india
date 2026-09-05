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
   * Approves a candidate and merges specific fields into an existing entity.
   */
  async approveAndMergeToExisting(
    reviewId: string,
    existingEntityId: string,
    candidateData: any,
    canonicalData: any,
    approvedFields: string[],
    actorId: string,
    actorRole: string,
    entityType: string = 'HOSPITAL'
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

    let targetCollection = HOSPITALS_COLLECTION;
    let resourceType = 'HOSPITAL';
    if (entityType === 'TREATMENT') {
      targetCollection = 'treatments';
      resourceType = 'TREATMENT';
    } else if (entityType === 'PROVIDER_SERVICE') {
      targetCollection = 'providerServices';
      resourceType = 'PROVIDER_SERVICE';
    }

    if (Object.keys(mergedData).length > 0) {
      const docRef = doc(db, targetCollection, existingEntityId);
      await updateDoc(docRef, {
        ...mergedData,
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Mark review as APPROVED_MERGE
    const reviewRef = doc(db, ACQUISITION_REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      status: 'APPROVED_MERGE',
      entityId: existingEntityId,
      reviewerId: actorId,
      reviewedAt: new Date().toISOString()
    });

    // 3. Audit logs
    await createAuditLog({
      actorId,
      actorRole,
      action: 'ACQUISITION_APPROVED_MERGE',
      resourceType,
      resourceId: existingEntityId,
      metadata: { reviewId, updatedKeys: Object.keys(mergedData), entityType }
    });
  },

  async approveAndCreateDraft(
    reviewId: string,
    candidateData: any,
    actorId: string,
    actorRole: string,
    entityType: string = 'HOSPITAL'
  ): Promise<string> {
    const now = new Date().toISOString();
    
    let targetCollection = HOSPITALS_COLLECTION;
    let resourceType = 'HOSPITAL';
    let newEntity: any = {};

    if (entityType === 'TREATMENT') {
      targetCollection = 'treatments';
      resourceType = 'TREATMENT';
      newEntity = {
        name: candidateData.name || '',
        status: 'PUBLISHED',
        createdAt: now,
        updatedAt: now,
        ...candidateData
      };
    } else if (entityType === 'PROVIDER_SERVICE') {
      targetCollection = 'providerServices';
      resourceType = 'PROVIDER_SERVICE';
      newEntity = {
        status: 'PUBLISHED',
        createdAt: now,
        updatedAt: now,
        ...candidateData
      };
    } else {
      // Default to Hospital/Provider
      newEntity = {
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
    }

    delete newEntity.sourceId;
    delete newEntity.rawRecordId;
    delete newEntity.retrievedAt;
    delete newEntity.externalIdentifier;
    delete newEntity.matchType;
    delete newEntity.dataOrigin; // Keep it if we want it? Yes, we want it for provenance! Wait, let's keep it if we want to show it. The UI uses it.
    
    // We should re-add dataOrigin since it was passed in candidateData.
    if (candidateData.dataOrigin) {
      newEntity.dataOrigin = candidateData.dataOrigin;
    }

    const docRef = await addDoc(collection(db, targetCollection), newEntity);
    const newId = docRef.id;

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
      action: `ACQUISITION_APPROVED_NEW_DRAFT`,
      resourceType,
      resourceId: newId,
      metadata: { reviewId, entityType }
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
