'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getSLAMetrics } from '../../../features/analytics/analyticsService';
import { downloadCsv } from '../../../lib/csvExport';

export default function SlaDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const sla = await getSLAMetrics();
        setMetrics(sla);
      } catch (err) {
        console.error(err);
        setError('Failed to load SLA metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (!metrics) return;
    const data = [
      { Metric: 'Average First Response (Hours)', Value: metrics.avgFirstResponseHours },
      { Metric: 'Evaluated Cases', Value: metrics.evaluatedCases },
    ];
    downloadCsv(`medbridge_sla_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading SLA dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">SLA Intelligence</h1>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">First Response Times</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded border">
              <div className="text-sm text-gray-500 mb-1">Average First Response</div>
              <div className="text-3xl font-bold text-gray-900">{metrics.avgFirstResponseHours} <span className="text-lg font-normal text-gray-500">hrs</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded border">
              <div className="text-sm text-gray-500 mb-1">Evaluated Cases</div>
              <div className="text-3xl font-bold text-gray-900">{metrics.evaluatedCases}</div>
              <div className="text-xs text-gray-400 mt-1">Based on recent bounded dataset</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
