'use client';
import React, { useState } from 'react';
import { adminAcquisitionService } from '../../features/admin/adminAcquisitionService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { AcquisitionReview } from '../../types/models';

export default function TestApprovePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const approveData = async () => {
    if (running) return;
    setRunning(true);
    try {
      const reviewsRef = collection(db, 'acquisitionReviews');
      
      // 1. Get 2 Providers
      const provQ = query(reviewsRef, where('status', '==', 'PENDING'), where('entityType', '==', 'HOSPITAL'), limit(2));
      const provDocs = await getDocs(provQ);
      const providers = provDocs.docs.map(d => d.data() as AcquisitionReview);
      
      // 2. Get 2 Treatments
      const treatQ = query(reviewsRef, where('status', '==', 'PENDING'), where('entityType', '==', 'TREATMENT'), limit(2));
      const treatDocs = await getDocs(treatQ);
      const treatments = treatDocs.docs.map(d => d.data() as AcquisitionReview);
      
      // 3. Get 3 Provider Services
      const servQ = query(reviewsRef, where('status', '==', 'PENDING'), where('entityType', '==', 'PROVIDER_SERVICE'), limit(3));
      const servDocs = await getDocs(servQ);
      const services = servDocs.docs.map(d => d.data() as AcquisitionReview);

      log(`Found ${providers.length} providers, ${treatments.length} treatments, ${services.length} services.`);

      const adminId = "test-admin";
      const adminRole = "ADMIN";

      // Approve Providers
      for (const p of providers) {
        log(`Approving provider: ${p.id}`);
        await adminAcquisitionService.approveAndCreateDraft(p.id, p.candidateData, adminId, adminRole, 'HOSPITAL');
      }

      // Approve Treatments
      for (const t of treatments) {
        log(`Approving treatment: ${t.id}`);
        await adminAcquisitionService.approveAndCreateDraft(t.id, t.candidateData, adminId, adminRole, 'TREATMENT');
      }

      // Approve Services
      for (const s of services) {
        log(`Approving service: ${s.id}`);
        await adminAcquisitionService.approveAndCreateDraft(s.id, s.candidateData, adminId, adminRole, 'PROVIDER_SERVICE');
      }

      log('Approval complete!');
      setDone(true);
    } catch (e: any) {
      log('Error: ' + e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Test Approve Phase 6.4</h1>
      <button 
        id="run-approve-btn"
        onClick={approveData} 
        disabled={running || done}
        className="px-6 py-2 bg-indigo-600 text-white rounded mb-6 disabled:opacity-50"
      >
        {running ? 'Running...' : done ? 'Done' : 'Approve Test Data'}
      </button>

      <div className="bg-slate-900 text-green-400 p-4 rounded h-96 overflow-auto font-mono text-sm" id="log-container">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
