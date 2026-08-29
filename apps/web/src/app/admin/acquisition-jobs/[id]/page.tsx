'use client';

import React, { useEffect, useState } from 'react';
import { adminAcquisitionService } from '../../../../features/admin/adminAcquisitionService';
import { AcquisitionJob } from '../../../../types/models';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AcquisitionJobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<AcquisitionJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch a specific job.
    // For now, we fetch all and find it since adminAcquisitionService lacks a getById for jobs.
    adminAcquisitionService.getAcquisitionJobs().then((data: AcquisitionJob[]) => {
      const found = data.find(j => j.id === id);
      setJob(found || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8">Loading job details...</div>;
  if (!job) return <div className="p-8">Job not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/admin/acquisition-jobs" className="text-blue-600 hover:underline">&larr; Back to Jobs</Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Job Details: {job.jobId}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-medium text-gray-600">Source ID:</span> {job.sourceId}</div>
          <div><span className="font-medium text-gray-600">Status:</span> {job.status}</div>
          <div><span className="font-medium text-gray-600">Started:</span> {new Date(job.startedAt).toLocaleString()}</div>
          <div><span className="font-medium text-gray-600">Completed:</span> {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}</div>
          {job.errorMessage && (
             <div className="col-span-2"><span className="font-medium text-red-600">Error:</span> {job.errorMessage}</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><span className="text-gray-500 block text-sm">Found</span><span className="text-xl font-bold">{job.recordsFound}</span></div>
          <div><span className="text-gray-500 block text-sm">Parsed</span><span className="text-xl font-bold">{job.recordsParsed}</span></div>
          <div><span className="text-gray-500 block text-sm">Accepted</span><span className="text-xl font-bold text-green-600">{job.recordsAccepted}</span></div>
          <div><span className="text-gray-500 block text-sm">Rejected</span><span className="text-xl font-bold text-red-600">{job.recordsRejected}</span></div>
          <div><span className="text-gray-500 block text-sm">Excluded</span><span className="text-xl font-bold text-amber-600">{job.recordsExcluded}</span></div>
          <div><span className="text-gray-500 block text-sm">Errors</span><span className="text-xl font-bold text-red-600">{job.errorCount}</span></div>
        </div>
      </div>

      {job.excludedByCareType && Object.keys(job.excludedByCareType).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Exclusions by Care Type</h2>
          <ul className="space-y-2">
            {Object.entries(job.excludedByCareType).map(([type, count]) => (
              <li key={type} className="flex justify-between max-w-sm">
                <span className="text-gray-700">{type === "0" || !type ? "Unknown/Empty" : type}</span>
                <span className="font-bold text-gray-900">{count as React.ReactNode}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
