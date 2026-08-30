'use client';

import React, { useEffect, useState } from 'react';
import { adminAcquisitionService } from '../../../features/admin/adminAcquisitionService';
import { AcquisitionJob, FieldConflict } from '../../../types/models';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase/client';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { downloadCsv } from '../../../lib/csvExport';

function DataQualityDashboard() {
  const [jobs, setJobs] = useState<AcquisitionJob[]>([]);
  const [conflicts, setConflicts] = useState<FieldConflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobData, conflictsSnap] = await Promise.all([
          adminAcquisitionService.getAcquisitionJobs(),
          getDocs(query(collection(db, 'fieldConflicts')))
        ]);
        
        setJobs(jobData);
        setConflicts(conflictsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FieldConflict)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8">Loading data quality metrics...</div>;

  const totalFound = jobs.reduce((acc, job) => acc + (job.recordsFound || 0), 0);
  const totalParsed = jobs.reduce((acc, job) => acc + (job.recordsParsed || 0), 0);
  const totalAccepted = jobs.reduce((acc, job) => acc + (job.recordsAccepted || 0), 0);
  const totalExcluded = jobs.reduce((acc, job) => acc + (job.recordsExcluded || 0), 0);
  const totalRejected = jobs.reduce((acc, job) => acc + (job.recordsRejected || 0), 0);

  const pendingConflicts = conflicts.filter(c => c.status === 'PENDING').length;
  const resolvedConflicts = conflicts.filter(c => c.status !== 'PENDING').length;

  const handleExport = () => {
    const data = [
      { Metric: 'Total Acquired', Value: totalFound },
      { Metric: 'Accepted (Pending Review)', Value: totalAccepted },
      { Metric: 'Excluded (Care Type)', Value: totalExcluded },
      { Metric: 'Rejected (Invalid)', Value: totalRejected },
      { Metric: 'Pending Conflicts', Value: pendingConflicts },
      { Metric: 'Resolved Conflicts', Value: resolvedConflicts },
    ];
    downloadCsv(`data_quality_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Export CSV
        </button>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Pipeline Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Acquired</p>
          <p className="text-3xl font-bold mt-2">{totalFound}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Accepted (Pending Review)</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{totalAccepted}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Excluded (Care Type)</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{totalExcluded}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Rejected (Invalid)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{totalRejected}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Multi-Source Engine</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-orange-600 font-medium">Pending Conflicts</p>
          <p className="text-3xl font-bold text-orange-700 mt-2">{pendingConflicts}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
          <p className="text-sm text-green-600 font-medium">Resolved Conflicts</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{resolvedConflicts}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Live Snapshot Metrics</h2>
        <p className="text-blue-800 text-sm">
          These metrics are calculated dynamically based on acquisition job histories and conflict detection engines, ensuring they reflect the actual ingested data rather than a fixed local snapshot.
        </p>
      </div>
    </div>
  );
}

export default function DataQualityDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DATA_REVIEWER']}>
      <DataQualityDashboard />
    </ProtectedRoute>
  );
}
