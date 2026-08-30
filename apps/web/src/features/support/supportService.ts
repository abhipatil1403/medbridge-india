import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import {
  Case,
  CaseEvent,
  CaseNote,
  CaseStage,
  CasePriority,
  Quote,
  QuoteStatus,
  STAGE_TRANSITIONS,
} from '../../types/models';
import { createNotification } from '../cases/notificationService';

// ── Case Queries ─────────────────────────────────────────────────────

/** Get cases assigned to this support user (via assignedSupportId) */
export async function getAssignedCases(uid: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('assignedSupportId', '==', uid), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

/** Get cases assigned to this case manager (via assignedCaseManagerId) */
export async function getCaseManagerCases(uid: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('assignedCaseManagerId', '==', uid), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

/** Get all new/unassigned cases (CASE_MANAGER or ADMIN only) */
export async function getNewCases(): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('currentStage', '==', 'NEW_INQUIRY'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

/** Get cases by specific stage */
export async function getCasesByStage(stage: CaseStage): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('currentStage', '==', stage), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

// ── Assignment ───────────────────────────────────────────────────────

/** Assign a case to a support agent. Only CASE_MANAGER or ADMIN should call this. */
export async function assignCase(
  caseId: string,
  assignerId: string,
  assignerRole: string,
  assigneeId: string
): Promise<void> {
  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();

  const updateData: Record<string, string> = {
    assignedSupportId: assigneeId,
    assignedAt: now,
    assignedBy: assignerId,
    currentStage: 'ASSIGNED',
    updatedAt: now,
  };

  const caseSnap = await getDoc(caseRef);
  if (caseSnap.exists()) {
    const caseData = caseSnap.data() as Case;
    await updateDoc(caseRef, updateData);

    await addDoc(collection(db, 'caseEvents'), {
      caseId,
      actorId: assignerId,
      actorRole: assignerRole,
      eventType: 'CASE_ASSIGNED',
      metadata: { assignedTo: assigneeId },
      timestamp: now,
    } as CaseEvent);

    await createNotification({
      userId: caseData.patientId,
      caseId,
      type: 'CASE_ASSIGNED',
      title: 'Case Assigned',
      message: `Your case ${caseData.humanReference || caseId} has been assigned to a support agent.`,
    });
  }
}

// ── Stage Transitions ────────────────────────────────────────────────

/** Validate if a stage transition is allowed */
export function isValidStageTransition(currentStage: CaseStage, newStage: CaseStage): boolean {
  const allowed = STAGE_TRANSITIONS[currentStage];
  return allowed.includes(newStage);
}

/** Update case stage with transition validation */
export async function updateCaseStage(
  caseId: string,
  actorId: string,
  actorRole: string,
  currentStage: CaseStage,
  newStage: CaseStage
): Promise<void> {
  if (!isValidStageTransition(currentStage, newStage)) {
    throw new Error(`Invalid stage transition: ${currentStage} → ${newStage}`);
  }

  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();

  await updateDoc(caseRef, {
    currentStage: newStage,
    updatedAt: now,
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId,
    actorRole,
    eventType: 'STAGE_CHANGED',
    metadata: { from: currentStage, to: newStage },
    timestamp: now,
  } as CaseEvent);
}

// ── Priority ─────────────────────────────────────────────────────────

/** Update case priority */
export async function updateCasePriority(
  caseId: string,
  actorId: string,
  actorRole: string,
  currentPriority: CasePriority,
  newPriority: CasePriority
): Promise<void> {
  if (currentPriority === newPriority) return;

  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();

  await updateDoc(caseRef, {
    priority: newPriority,
    updatedAt: now,
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId,
    actorRole,
    eventType: 'PRIORITY_CHANGED',
    metadata: { from: currentPriority, to: newPriority },
    timestamp: now,
  } as CaseEvent);
}

// ── Internal Notes ───────────────────────────────────────────────────

/** Add an internal support note (invisible to customers) */
export async function addCaseNote(
  caseId: string,
  authorId: string,
  authorRole: string,
  text: string
): Promise<void> {
  if (!text.trim()) return;
  const now = new Date().toISOString();

  await addDoc(collection(db, 'caseNotes'), {
    caseId,
    authorId,
    authorRole,
    text: text.trim(),
    createdAt: now,
  } as CaseNote);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: authorId,
    actorRole: authorRole,
    eventType: 'NOTE_ADDED',
    timestamp: now,
  } as CaseEvent);
}

/** Get internal notes for a case (support/admin only) */
export async function getCaseNotes(caseId: string): Promise<CaseNote[]> {
  const notesRef = collection(db, 'caseNotes');
  const q = query(notesRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseNote));
}

// ── Quotes ───────────────────────────────────────────────────────────

/** Create a draft quote for a case */
export async function createQuoteDraft(
  caseId: string,
  patientId: string,
  creatorId: string,
  creatorRole: string,
  data: {
    hospitalId: string;
    treatmentId: string;
    currency: string;
    estimatedAmount: number;
    inclusions: string[];
    exclusions: string[];
  }
): Promise<string> {
  if (data.estimatedAmount < 0) {
    throw new Error('Quote amount cannot be negative');
  }
  const now = new Date().toISOString();

  const quote: Quote = {
    caseId,
    patientId,
    hospitalId: data.hospitalId,
      providerId: data.hospitalId,
    treatmentId: data.treatmentId,
    currency: data.currency,
    estimatedAmount: data.estimatedAmount,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    status: 'DRAFT',
    createdBy: creatorId,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, 'quotes'), quote);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: creatorId,
    actorRole: creatorRole,
    eventType: 'QUOTE_CREATED',
    timestamp: now,
  } as CaseEvent);

  return ref.id;
}

/** Update an existing quote draft */
export async function updateQuoteDraft(
  quoteId: string,
  caseId: string,
  actorId: string,
  actorRole: string,
  updates: Partial<Pick<Quote, 'estimatedAmount' | 'currency' | 'inclusions' | 'exclusions' | 'status'>>
): Promise<void> {
  if (updates.estimatedAmount !== undefined && updates.estimatedAmount < 0) {
    throw new Error('Quote amount cannot be negative');
  }

  const quoteRef = doc(db, 'quotes', quoteId);
  const quoteSnap = await getDoc(quoteRef);
  if (!quoteSnap.exists()) throw new Error('Quote not found');
  const currentQuote = quoteSnap.data() as Quote;

  // Validate state transitions
  if (updates.status && updates.status !== currentQuote.status) {
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      DRAFT: ['READY'],
      UNDER_REVIEW: ['READY', 'DRAFT'], // Allow back and forth internally if needed, but per plan DRAFT->READY
      READY: ['SENT', 'DRAFT'],
      SENT: ['ACCEPTED', 'DECLINED'],
      ACCEPTED: [],
      DECLINED: []
    };
    if (!validTransitions[currentQuote.status]?.includes(updates.status)) {
      throw new Error(`Invalid quote transition from ${currentQuote.status} to ${updates.status}`);
    }
  }

  const now = new Date().toISOString();

  await updateDoc(quoteRef, {
    ...updates,
    updatedAt: now,
  });

  if (updates.status && updates.status !== currentQuote.status) {
    const caseRef = doc(db, 'cases', caseId);
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.exists() ? caseSnap.data() as Case : null;
    
    // SLA Tracking
    if (caseData) {
      if (updates.status === 'READY' && !caseData.quotePreparedAt) {
        await updateDoc(caseRef, { quotePreparedAt: now, updatedAt: now });
      } else if (updates.status === 'SENT' && !caseData.quoteSentAt) {
        await updateDoc(caseRef, { quoteSentAt: now, updatedAt: now });
        
        // Notify Customer
        await createNotification({
          userId: caseData.patientId,
          caseId,
          type: 'QUOTE_SENT',
          title: 'Quote Received',
          message: `A new quote is available for your case ${caseData.humanReference || caseId}.`,
        });
      }
    }
    
    const eventType = updates.status === 'READY' ? 'QUOTE_READY' : 
                      updates.status === 'SENT' ? 'QUOTE_SENT' : 'QUOTE_UPDATED';

    await addDoc(collection(db, 'caseEvents'), {
      caseId,
      actorId,
      actorRole,
      eventType: eventType as CaseEvent['eventType'],
      metadata: { status: updates.status },
      timestamp: now,
    } as CaseEvent);
  } else {
    // Just a content update
    await addDoc(collection(db, 'caseEvents'), {
      caseId,
      actorId,
      actorRole,
      eventType: 'QUOTE_UPDATED',
      timestamp: now,
    } as CaseEvent);
  }
}

/** Get quotes for a case */
export async function getCaseQuotes(caseId: string): Promise<Quote[]> {
  const quotesRef = collection(db, 'quotes');
  const q = query(quotesRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
}
