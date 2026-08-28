import { collection, addDoc, doc, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Case, CaseEvent } from '../../types/models';

function generateHumanReference() {
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
    actorType: 'CUSTOMER',
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
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
