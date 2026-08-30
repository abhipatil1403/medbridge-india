'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getCaseMetrics, getQuoteMetrics, getAcquisitionHealth } from '../../../features/analytics/analyticsService';
import Link from 'next/link';
import { downloadCsv } from '../../../lib/csvExport';

export default function OperationsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cases, quotes, acq] = await Promise.all([
          getCaseMetrics(),
          getQuoteMetrics(),
          getAcquisitionHealth()
        ]);
        setMetrics({ cases, quotes, acq });
      } catch (err) {
        console.error(err);
        setError('Failed to load operational metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExportSummary = () => {
    if (!metrics) return;
    const data = [
      { Category: 'Cases', Metric: 'Total Cases', Value: metrics.cases.total },
      { Category: 'Cases', Metric: 'New Inquiries', Value: metrics.cases.newInquiries },
      { Category: 'Cases', Metric: 'Unassigned', Value: metrics.cases.unassigned },
      { Category: 'Cases', Metric: 'Stale (24h+)', Value: metrics.cases.staleCount },
      { Category: 'Quotes', Metric: 'Total Quotes', Value: metrics.quotes.total },
      { Category: 'Quotes', Metric: 'Acceptance Rate', Value: metrics.quotes.acceptanceRate },
      { Category: 'Acquisition', Metric: 'Recent Failed Jobs', Value: metrics.acq.failedJobsCount },
    ];
    downloadCsv(`medbridge_operations_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading operations dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">System Operations</h1>
          <button
            onClick={handleExportSummary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>

        {/* Needs Attention Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Needs Attention</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.cases.unassigned > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="text-red-700 font-bold text-2xl">{metrics.cases.unassigned}</div>
                <div className="text-red-600 text-sm">Unassigned Cases</div>
                <Link href="/support/cases" className="text-xs text-red-500 hover:underline mt-2 inline-block">View Queue &rarr;</Link>
              </div>
            )}
            {metrics.cases.staleCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="text-amber-700 font-bold text-2xl">{metrics.cases.staleCount}</div>
                <div className="text-amber-600 text-sm">Stale Cases (24h+ no update)</div>
              </div>
            )}
            {metrics.acq.failedJobsCount > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="text-red-700 font-bold text-2xl">{metrics.acq.failedJobsCount}</div>
                <div className="text-red-600 text-sm">Recent Failed Acquisition Jobs</div>
                <Link href="/admin/acquisition-jobs" className="text-xs text-red-500 hover:underline mt-2 inline-block">View Jobs &rarr;</Link>
              </div>
            )}
            {metrics.cases.unassigned === 0 && metrics.cases.staleCount === 0 && metrics.acq.failedJobsCount === 0 && (
              <div className="col-span-3 text-sm text-gray-500 bg-gray-50 p-4 rounded border border-gray-100">
                All systems healthy. No immediate operational alerts.
              </div>
            )}
          </div>
        </section>

        {/* Aggregate Overviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-md font-semibold text-gray-900 border-b pb-2 mb-4">Case Metrics</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Total Analyzed</span><span className="font-medium">{metrics.cases.total}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">New Inquiries</span><span className="font-medium">{metrics.cases.newInquiries}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Under Review</span><span className="font-medium">{metrics.cases.underReview}</span></li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-md font-semibold text-gray-900 border-b pb-2 mb-4">Quote Metrics</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Total Quotes</span><span className="font-medium">{metrics.quotes.total}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Drafts</span><span className="font-medium">{metrics.quotes.drafts}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Sent</span><span className="font-medium">{metrics.quotes.sent}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Acceptance Rate</span><span className="font-medium text-green-600">{metrics.quotes.acceptanceRate}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
