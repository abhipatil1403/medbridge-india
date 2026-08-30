import { db } from '../../lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Case, Quote, AcquisitionJob } from '../../types/models';

/**
 * Common operational metrics fetched directly from Firestore.
 * Warning: Client-side aggregations should be bounded to avoid massive read costs.
 */

// 1. Cases Overview
export async function getCaseMetrics() {
  const casesRef = collection(db, 'cases');
  // In a real production app, we would use Firebase Aggregation queries (e.g., getCountFromServer)
  // For free tier without Cloud Functions, we bounded fetch.
  // We'll limit to the last 1000 for client aggregation to avoid OOM.
  const q = query(casesRef, orderBy('createdAt', 'desc'), limit(1000));
  const snap = await getDocs(q);
  const allCases = snap.docs.map(d => d.data() as Case);

  const total = allCases.length;
  const newInquiries = allCases.filter(c => c.currentStage === 'NEW_INQUIRY').length;
  const underReview = allCases.filter(c => c.currentStage === 'UNDER_REVIEW').length;
  const unassigned = allCases.filter(c => !c.assignedSupportId && c.currentStage !== 'CLOSED').length;
  
  // Aging (Open cases)
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  let staleCount = 0;
  
  allCases.forEach(c => {
    if (c.currentStage !== 'CLOSED') {
      const updatedAt = typeof c.updatedAt === 'string' ? new Date(c.updatedAt).getTime() : c.updatedAt;
      if (now - updatedAt > ONE_DAY) staleCount++;
    }
  });

  return { total, newInquiries, underReview, unassigned, staleCount };
}

// 2. SLA Metrics
export async function getSLAMetrics() {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, orderBy('createdAt', 'desc'), limit(500));
  const snap = await getDocs(q);
  const cases = snap.docs.map(d => d.data() as Case);

  let totalFirstResponseTime = 0;
  let countFirstResponse = 0;
  
  cases.forEach(c => {
    if (c.createdAt && c.firstResponseAt) {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.firstResponseAt).getTime();
      if (end > start) {
        totalFirstResponseTime += (end - start);
        countFirstResponse++;
      }
    }
  });

  const avgFirstResponseHours = countFirstResponse > 0 
    ? (totalFirstResponseTime / countFirstResponse) / (1000 * 60 * 60) 
    : 0;

  return {
    avgFirstResponseHours: avgFirstResponseHours.toFixed(1),
    evaluatedCases: countFirstResponse,
  };
}

// 3. Quotes Metrics
export async function getQuoteMetrics() {
  const quotesRef = collection(db, 'quotes');
  const q = query(quotesRef, orderBy('createdAt', 'desc'), limit(1000));
  const snap = await getDocs(q);
  const quotes = snap.docs.map(d => d.data() as Quote);

  const total = quotes.length;
  const drafts = quotes.filter(q => q.status === 'DRAFT').length;
  const sent = quotes.filter(q => q.status === 'SENT').length;
  const accepted = quotes.filter(q => q.status === 'ACCEPTED').length;
  const declined = quotes.filter(q => q.status === 'DECLINED').length;

  const acceptanceRate = sent > 0 || accepted > 0 || declined > 0 
    ? ((accepted / (sent + accepted + declined)) * 100).toFixed(1) + '%' 
    : '0%';

  return { total, drafts, sent, accepted, declined, acceptanceRate };
}

// 4. Acquisition Health
export async function getAcquisitionHealth() {
  const jobsRef = collection(db, 'acquisitionJobs');
  const q = query(jobsRef, orderBy('startedAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const jobs = snap.docs.map(d => d.data() as AcquisitionJob);

  const failedJobs = jobs.filter(j => j.status === 'FAILED');
  const successJobs = jobs.filter(j => j.status === 'COMPLETED');

  return {
    recentJobsCount: jobs.length,
    failedJobsCount: failedJobs.length,
    lastSuccessfulRun: successJobs.length > 0 ? new Date(successJobs[0].startedAt).toLocaleString() : 'N/A',
    lastFailedRun: failedJobs.length > 0 ? new Date(failedJobs[0].startedAt).toLocaleString() : 'N/A',
  };
}
