'use client';
import React, { useEffect, useState } from 'react';
import { adminAcquisitionService } from '../../../features/admin/adminAcquisitionService';
import { AcquisitionJob } from '../../../types/models';

export default function AcquisitionJobsPage() {
  const [jobs, setJobs] = useState<AcquisitionJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminAcquisitionService.getAcquisitionJobs();
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading jobs...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Acquisition Jobs History</h1>
      <p className="text-gray-600 mb-6">Historical record of all data acquisition pipeline executions.</p>

      {jobs.length === 0 ? (
        <div className="bg-gray-50 border rounded p-8 text-center text-gray-500">
          No jobs found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Found</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accepted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">{job.jobId?.substring(0,12)}...</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{job.sourceId}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      job.status === 'UNCHANGED' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{job.recordsFound}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{job.recordsAccepted}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.errorCount > 0 ? <span className="text-red-600 font-medium">{job.errorCount}</span> : '0'}
                    {job.errorMessage && <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={job.errorMessage}>{job.errorMessage}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
