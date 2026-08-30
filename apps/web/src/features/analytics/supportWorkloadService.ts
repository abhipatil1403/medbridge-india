import { db } from '../../lib/firebase/client';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Case, Quote } from '../../types/models';

export async function getSupportWorkload() {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, orderBy('createdAt', 'desc'), limit(1000));
  const snap = await getDocs(q);
  const cases = snap.docs.map(d => d.data() as Case);

  const quotesRef = collection(db, 'quotes');
  const qSnap = await getDocs(query(quotesRef, orderBy('createdAt', 'desc'), limit(1000)));
  const quotes = qSnap.docs.map(d => d.data() as Quote);

  const workloadMap: Record<string, {
    agentId: string;
    assignedCases: number;
    openCases: number;
    closedCases: number;
    quotesPrepared: number;
    quotesSent: number;
  }> = {};

  cases.forEach(c => {
    if (c.assignedSupportId) {
      if (!workloadMap[c.assignedSupportId]) {
        workloadMap[c.assignedSupportId] = {
          agentId: c.assignedSupportId,
          assignedCases: 0,
          openCases: 0,
          closedCases: 0,
          quotesPrepared: 0,
          quotesSent: 0,
        };
      }
      workloadMap[c.assignedSupportId].assignedCases++;
      if (c.currentStage === 'CLOSED') {
        workloadMap[c.assignedSupportId].closedCases++;
      } else {
        workloadMap[c.assignedSupportId].openCases++;
      }
    }
  });

  quotes.forEach(q => {
    if (q.createdBy && workloadMap[q.createdBy]) {
      workloadMap[q.createdBy].quotesPrepared++;
      if (q.status === 'SENT' || q.status === 'ACCEPTED' || q.status === 'DECLINED') {
        workloadMap[q.createdBy].quotesSent++;
      }
    }
  });

  return Object.values(workloadMap);
}
