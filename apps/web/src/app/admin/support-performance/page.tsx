'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getSupportWorkload } from '../../../features/analytics/supportWorkloadService';
import { downloadCsv } from '../../../lib/csvExport';

export default function SupportPerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [workload, setWorkload] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSupportWorkload();
        setWorkload(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load support workload.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (workload.length === 0) return;
    downloadCsv(`support_workload_${new Date().toISOString().split('T')[0]}.csv`, workload);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading support performance...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Support Workload Intelligence</h1>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Cases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Cases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed Cases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotes Prepared</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotes Sent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workload.map((w, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.agentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.assignedCases}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.openCases}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.closedCases}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.quotesPrepared}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.quotesSent}</td>
                </tr>
              ))}
              {workload.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No support workload data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
