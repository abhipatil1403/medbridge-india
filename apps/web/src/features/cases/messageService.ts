import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CaseMessage, Case } from '../../types/models';
import { createNotification } from './notificationService';

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

  // Create the message
  await addDoc(collection(db, 'caseMessages'), {
    caseId,
    senderId,
    senderRole,
    body: body.trim(),
    createdAt: now,
  } as CaseMessage);

  // Log the event
  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: senderId,
    actorRole: senderRole,
    eventType: senderRole === 'CUSTOMER' ? 'CUSTOMER_MESSAGE' : 'SUPPORT_MESSAGE',
    timestamp: now,
  });

  // Handle SLA and Notifications for support responses
  if (senderRole !== 'CUSTOMER') {
    const caseRef = doc(db, 'cases', caseId);
    const caseSnap = await getDoc(caseRef);
    if (caseSnap.exists()) {
      const caseData = caseSnap.data() as Case;
      
      // Update firstResponseAt SLA if not set
      if (!caseData.firstResponseAt) {
        await updateDoc(caseRef, { firstResponseAt: now, updatedAt: now });
      }

      // Notify the customer
      await createNotification({
        userId: caseData.patientId,
        caseId: caseId,
        type: 'SUPPORT_RESPONSE',
        title: 'New Message from Support',
        message: `You have a new message on case ${caseData.humanReference}`,
      });
    }
  }
}
