'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getProviderAnalytics } from '../../../features/analytics/providerAnalyticsService';
import { downloadCsv } from '../../../lib/csvExport';
import Link from 'next/link';

export default function ProviderAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProviderAnalytics();
        setProviders(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load provider analytics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (providers.length === 0) return;
    const data = providers.map(p => {
      const actionable = p.sent + p.accepted + p.declined;
      const rate = actionable > 0 ? ((p.accepted / actionable) * 100).toFixed(1) + '%' : '0%';
      return {
        ProviderID: p.providerId,
        TotalQuotes: p.totalQuotes,
        Drafts: p.drafts,
        Sent: p.sent,
        Accepted: p.accepted,
        Declined: p.declined,
        AcceptanceRate: rate
      };
    });
    downloadCsv(`provider_analytics_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading provider analytics...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Provider Activity Analytics</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quotes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drafts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acceptance Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((p, idx) => {
                const actionable = p.sent + p.accepted + p.declined;
                const rate = actionable > 0 ? ((p.accepted / actionable) * 100).toFixed(1) + '%' : '0%';
                
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      <Link href={`/admin/providers`} className="text-blue-600 hover:underline">{p.providerId.slice(0,8)}...</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.totalQuotes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.drafts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.sent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{p.accepted}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate}</td>
                  </tr>
                );
              })}
              {providers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No provider activity data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
