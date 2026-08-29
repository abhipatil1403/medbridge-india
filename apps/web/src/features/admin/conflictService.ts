import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { FieldConflict } from '../../types/models';

export async function getConflictById(id: string): Promise<FieldConflict | null> {
  const ref = doc(db, 'fieldConflicts', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FieldConflict;
}

export async function resolveConflict(
  conflictId: string, 
  conflict: FieldConflict, 
  resolutionStatus: FieldConflict['status'], 
  resolvedValue: any,
  reviewerId: string,
  reviewerNotes: string = ''
) {
  if (conflict.status !== 'PENDING') {
    throw new Error('Conflict is not in a PENDING state.');
  }

  const now = new Date().toISOString();

  // 1. Update the conflict record
  const conflictRef = doc(db, 'fieldConflicts', conflictId);
  await updateDoc(conflictRef, {
    status: resolutionStatus,
    resolution: resolvedValue,
    resolvedBy: reviewerId,
    resolvedAt: now,
    reviewerNotes
  });

  // 2. If accepting a new value, update the canonical entity
  if (resolutionStatus === 'RESOLVED_SOURCE' || resolutionStatus === 'RESOLVED_MANUAL') {
    const entityRef = doc(db, 'hospitals', conflict.entityId); // Assuming HOSPITAL for now
    
    // We should ensure the document exists, but assuming it does since it's canonical
    await updateDoc(entityRef, {
      [conflict.fieldName]: resolvedValue,
      updatedAt: now
    });
  }

  // 3. Create Audit Log
  await addDoc(collection(db, 'auditLogs'), {
    action: `CONFLICT_${resolutionStatus}`,
    actorId: reviewerId,
    entityId: conflict.entityId,
    entityType: conflict.entityType,
    metadata: {
      conflictId,
      fieldName: conflict.fieldName,
      previousValue: conflict.canonicalValue,
      newValue: resolvedValue
    },
    timestamp: now
  });
}
