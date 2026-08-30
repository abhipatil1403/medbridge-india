'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { db } from '../../../lib/firebase/client';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { AcquisitionJob } from '../../../types/models';
import { downloadCsv } from '../../../lib/csvExport';

export default function AcquisitionHealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<AcquisitionJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const jobsSnap = await getDocs(query(collection(db, 'acquisitionJobs'), orderBy('startedAt', 'desc'), limit(100)));
        setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcquisitionJob)));
      } catch (err) {
        console.error(err);
        setError('Failed to load acquisition jobs.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (jobs.length === 0) return;
    const data = jobs.map(j => ({
      JobID: j.id,
      Source: j.sourceId,
      Status: j.status,
      StartedAt: j.startedAt,
      CompletedAt: j.completedAt || '',
      RecordsFound: j.recordsFound || 0,
      RecordsAccepted: j.recordsAccepted || 0,
      RecordsExcluded: j.recordsExcluded || 0,
      RecordsRejected: j.recordsRejected || 0,
    }));
    downloadCsv(`acquisition_health_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading acquisition health...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Acquisition Health</h1>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between">
            <h2 className="text-sm font-medium text-gray-700">Recent Acquisition Pipeline Runs</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source / Job ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.sourceId}</div>
                    <div className="text-xs text-gray-500 font-mono">{job.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.recordsFound || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{job.recordsAccepted || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{job.recordsRejected || 0}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No acquisition jobs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
