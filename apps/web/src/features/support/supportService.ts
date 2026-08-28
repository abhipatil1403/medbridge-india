import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Case, CaseEvent, CaseNote, CaseStage, CasePriority } from '../../types/models';

export async function getAssignedCases(uid: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  // In a real app, you might query both assignedSupportId and assignedCaseManagerId 
  // via multiple queries or an 'assignedTo' array if Firestore doesn't support OR well natively.
  // For simplicity, we just query assignedSupportId.
  const q = query(casesRef, where('assignedSupportId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function getAllNewCases(): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('currentStage', '==', 'NEW_INQUIRY'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function assignCase(caseId: string, assignerId: string, assigneeId: string): Promise<void> {
  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();
  
  await updateDoc(caseRef, {
    assignedSupportId: assigneeId,
    assignedAt: now,
    assignedBy: assignerId,
    currentStage: 'ASSIGNED',
    updatedAt: now
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: assignerId,
    actorType: 'SUPPORT',
    eventType: 'CASE_ASSIGNED',
    timestamp: now
  });
}

export async function updateCaseStage(caseId: string, actorId: string, newStage: CaseStage): Promise<void> {
  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();
  
  await updateDoc(caseRef, {
    currentStage: newStage,
    updatedAt: now
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId,
    actorType: 'SUPPORT',
    eventType: 'STAGE_CHANGED',
    metadata: { stage: newStage },
    timestamp: now
  });
}

export async function addCaseNote(caseId: string, authorId: string, authorRole: string, text: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(db, 'caseNotes'), {
    caseId,
    authorId,
    authorRole,
    text,
    createdAt: now
  } as CaseNote);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: authorId,
    actorType: 'SUPPORT',
    eventType: 'NOTE_ADDED',
    timestamp: now
  });
}

export async function getCaseNotes(caseId: string): Promise<CaseNote[]> {
  const notesRef = collection(db, 'caseNotes');
  const q = query(notesRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseNote));
}
