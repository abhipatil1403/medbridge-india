import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { AuditLog } from '../../types/models';

const AUDIT_LOGS_COLLECTION = 'auditLogs';

export const createAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> => {
  const docRef = await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
    ...logData,
    timestamp: new Date().toISOString(),
  });
  return docRef.id;
};
