import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Case, CaseEvent } from '../../types/models';

function generateHumanReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MB-${num}`;
}

export async function createCase(patientId: string, data: Partial<Case>): Promise<string> {
  const now = new Date().toISOString();
  const humanRef = generateHumanReference();

  const caseData: Case = {
    ...data,
    patientId,
    humanReference: humanRef,
    currentStage: 'NEW_INQUIRY',
    priority: 'NORMAL',
    createdAt: now,
    updatedAt: now,
  } as Case;

  const caseRef = await addDoc(collection(db, 'cases'), caseData);

  const eventData: CaseEvent = {
    caseId: caseRef.id,
    actorId: patientId,
    actorRole: 'CUSTOMER',
    eventType: 'CASE_CREATED',
    timestamp: now,
  };

  await addDoc(collection(db, 'caseEvents'), eventData);
  return caseRef.id;
}

export async function getUserCases(patientId: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function getCaseById(caseId: string, patientId: string): Promise<Case | null> {
  const docRef = doc(db, 'cases', caseId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as Case;
    if (data.patientId === patientId) {
      return { id: snapshot.id, ...data };
    }
  }
  return null;
}

/** Get a case by ID for support staff — no patientId check (Firestore rules enforce access) */
export async function getCaseByIdForSupport(caseId: string): Promise<Case | null> {
  const docRef = doc(db, 'cases', caseId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Case;
  }
  return null;
}

/** Get case events for a given case, ordered chronologically (Internal use) */
export async function getCaseEvents(caseId: string): Promise<CaseEvent[]> {
  const eventsRef = collection(db, 'caseEvents');
  const q = query(eventsRef, where('caseId', '==', caseId), orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseEvent));
}

/** Get only customer-visible case events (matches Firestore rules) */
export async function getCustomerCaseEvents(caseId: string): Promise<CaseEvent[]> {
  const eventsRef = collection(db, 'caseEvents');
  const safeTypes = [
    'CASE_CREATED', 
    'CUSTOMER_MESSAGE', 
    'SUPPORT_MESSAGE', 
    'QUOTE_READY', 
    'QUOTE_SENT', 
    'QUOTE_ACCEPTED', 
    'QUOTE_DECLINED', 
    'CASE_CLOSED'
  ];
  const q = query(
    eventsRef, 
    where('caseId', '==', caseId), 
    where('eventType', 'in', safeTypes),
    orderBy('timestamp', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseEvent));
}

/** Accept a quote (Customer only) */
export async function acceptQuote(quoteId: string, caseId: string, patientId: string): Promise<void> {
  const quoteRef = doc(db, 'quotes', quoteId);
  const now = new Date().toISOString();

  // Firestore rules will validate the transition SENT -> ACCEPTED and ownership
  await updateDoc(quoteRef, {
    status: 'ACCEPTED',
    updatedAt: now,
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: patientId,
    actorRole: 'CUSTOMER',
    eventType: 'QUOTE_ACCEPTED',
    metadata: { quoteId },
    timestamp: now,
  } as CaseEvent);
}

/** Decline a quote (Customer only) */
export async function declineQuote(quoteId: string, caseId: string, patientId: string): Promise<void> {
  const quoteRef = doc(db, 'quotes', quoteId);
  const now = new Date().toISOString();

  await updateDoc(quoteRef, {
    status: 'DECLINED',
    updatedAt: now,
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: patientId,
    actorRole: 'CUSTOMER',
    eventType: 'QUOTE_DECLINED',
    metadata: { quoteId },
    timestamp: now,
  } as CaseEvent);
}
