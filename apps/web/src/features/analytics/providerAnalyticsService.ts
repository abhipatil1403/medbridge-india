import { db } from '../../lib/firebase/client';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Quote } from '../../types/models';

export async function getProviderAnalytics() {
  const quotesRef = collection(db, 'quotes');
  const q = query(quotesRef, orderBy('createdAt', 'desc'), limit(2000));
  const snap = await getDocs(q);
  const quotes = snap.docs.map(d => d.data() as Quote);

  const providerMap: Record<string, {
    providerId: string;
    totalQuotes: number;
    drafts: number;
    sent: number;
    accepted: number;
    declined: number;
  }> = {};

  quotes.forEach(q => {
    if (q.providerId) {
      if (!providerMap[q.providerId]) {
        providerMap[q.providerId] = {
          providerId: q.providerId,
          totalQuotes: 0,
          drafts: 0,
          sent: 0,
          accepted: 0,
          declined: 0,
        };
      }
      providerMap[q.providerId].totalQuotes++;
      if (q.status === 'DRAFT') providerMap[q.providerId].drafts++;
      if (q.status === 'SENT') providerMap[q.providerId].sent++;
      if (q.status === 'ACCEPTED') providerMap[q.providerId].accepted++;
      if (q.status === 'DECLINED') providerMap[q.providerId].declined++;
    }
  });

  return Object.values(providerMap).sort((a, b) => b.totalQuotes - a.totalQuotes);
}
