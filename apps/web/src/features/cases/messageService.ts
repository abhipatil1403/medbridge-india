import { collection, query, where, getDocs, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CaseMessage } from '../../types/models';

export async function getCaseMessages(caseId: string): Promise<CaseMessage[]> {
  const messagesRef = collection(db, 'caseMessages');
  const q = query(messagesRef, where('caseId', '==', caseId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseMessage));
}

export async function sendCaseMessage(
  caseId: string,
  senderId: string,
  senderRole: string,
  body: string
): Promise<void> {
  if (!body.trim()) return;
  const now = new Date().toISOString();

  await addDoc(collection(db, 'caseMessages'), {
    caseId,
    senderId,
    senderRole,
    body: body.trim(),
    createdAt: now,
  } as CaseMessage);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: senderId,
    actorRole: senderRole,
    eventType: senderRole === 'CUSTOMER' ? 'CUSTOMER_MESSAGE' : 'SUPPORT_MESSAGE',
    timestamp: now,
  });
}
