'use client';

import React, { useEffect, useState } from 'react';
import { adminAcquisitionService } from '../../../features/admin/adminAcquisitionService';
import { AcquisitionJob } from '../../../types/models';
import { DataOriginBadge } from '../../../components/DataOriginBadge';
import { Badge } from '../../../components/Badge';

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Acquisition Jobs History</h1>
        <p className="text-slate-600 max-w-3xl">Historical record of all data acquisition pipeline executions, including data sources and ingestion status.</p>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center p-20 space-y-4">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
           <p className="text-slate-500 font-medium animate-pulse">Loading acquisition history...</p>
         </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-16 text-center shadow-sm">
           <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           <h3 className="text-lg font-bold text-slate-800 mb-1">No Jobs Found</h3>
           <p className="text-slate-500">No acquisition jobs have been executed yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Job ID</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Source & Origin</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Errors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {job.jobId?.substring(0,12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900 mb-1.5">{job.sourceId}</div>
                      <DataOriginBadge origin={job.sourceId?.includes('synthetic') ? 'SYNTHETIC' : 'REAL_PUBLIC'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {job.status === 'COMPLETED' ? <Badge variant="success">Completed</Badge> :
                        job.status === 'FAILED' ? <Badge variant="error">Failed</Badge> :
                        job.status === 'UNCHANGED' ? <Badge variant="info">Unchanged</Badge> :
                        job.status === 'PARTIAL' ? <Badge variant="warning">Partial</Badge> :
                        <Badge variant="default">{job.status}</Badge>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {new Date(job.startedAt).toLocaleString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium"><span className="text-slate-500 font-normal mr-2">Found:</span>{job.recordsFound}</div>
                      <div className="text-sm text-emerald-700 font-medium"><span className="text-slate-500 font-normal mr-2">Accepted:</span>{job.recordsAccepted}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.errorCount > 0 ? (
                         <div className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {job.errorCount} Errors
                         </div>
                      ) : (
                         <span className="text-sm text-slate-400">None</span>
                      )}
                      {job.errorMessage && (
                        <div className="text-[11px] text-rose-500 mt-1.5 max-w-[200px] truncate" title={job.errorMessage}>
                          {job.errorMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
