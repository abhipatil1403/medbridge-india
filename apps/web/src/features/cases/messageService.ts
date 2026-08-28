import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CaseMessage } from '../../types/models';

export async function getCaseMessages(caseId: string): Promise<CaseMessage[]> {
  const messagesRef = collection(db, 'caseMessages');
  const q = query(messagesRef, where('caseId', '==', caseId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseMessage));
}

export async function sendCaseMessage(caseId: string, senderId: string, senderRole: string, body: string): Promise<void> {
  const now = new Date().toISOString();
  
  await addDoc(collection(db, 'caseMessages'), {
    caseId,
    senderId,
    senderRole,
    body,
    createdAt: now
  } as CaseMessage);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: senderId,
    actorType: senderRole === 'CUSTOMER' ? 'CUSTOMER' : 'SUPPORT',
    eventType: senderRole === 'CUSTOMER' ? 'CUSTOMER_MESSAGE' : 'SUPPORT_MESSAGE',
    timestamp: now
  });
}
