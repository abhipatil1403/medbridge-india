'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { db } from '../../../lib/firebase/client';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Case, Quote } from '../../../types/models';
import { downloadCsv } from '../../../lib/csvExport';

export default function QuoteAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const quotesSnap = await getDocs(query(collection(db, 'quotes'), orderBy('createdAt', 'desc'), limit(1000)));
        const quotes = quotesSnap.docs.map(d => d.data() as Quote);

        const casesSnap = await getDocs(query(collection(db, 'cases'), orderBy('createdAt', 'desc'), limit(1000)));
        const cases = casesSnap.docs.map(d => d.data() as Case);

        const totalQuotes = quotes.length;
        const drafts = quotes.filter(q => q.status === 'DRAFT').length;
        const ready = quotes.filter(q => q.status === 'READY').length;
        const sent = quotes.filter(q => q.status === 'SENT').length;
        const accepted = quotes.filter(q => q.status === 'ACCEPTED').length;
        const declined = quotes.filter(q => q.status === 'DECLINED').length;

        const actionable = sent + accepted + declined;
        const acceptanceRate = actionable > 0 ? ((accepted / actionable) * 100).toFixed(1) + '%' : '0%';
        const declineRate = actionable > 0 ? ((declined / actionable) * 100).toFixed(1) + '%' : '0%';

        const caseQuoteCounts: Record<string, number> = {};
        cases.forEach(c => { caseQuoteCounts[c.id!] = 0; });
        quotes.forEach(q => {
          if (caseQuoteCounts[q.caseId] !== undefined) {
            caseQuoteCounts[q.caseId]++;
          }
        });

        const counts = Object.values(caseQuoteCounts);
        const zeroQuotes = counts.filter(n => n === 0).length;
        const oneQuote = counts.filter(n => n === 1).length;
        const multipleQuotes = counts.filter(n => n >= 2).length;
        const avgQuotesPerCase = counts.length > 0 ? (quotes.length / counts.length).toFixed(1) : '0';

        setMetrics({
          totalQuotes, drafts, ready, sent, accepted, declined, acceptanceRate, declineRate,
          zeroQuotes, oneQuote, multipleQuotes, avgQuotesPerCase
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load quote metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (!metrics) return;
    const data = [
      { Metric: 'Total Quotes', Value: metrics.totalQuotes },
      { Metric: 'Draft', Value: metrics.drafts },
      { Metric: 'Ready', Value: metrics.ready },
      { Metric: 'Sent', Value: metrics.sent },
      { Metric: 'Accepted', Value: metrics.accepted },
      { Metric: 'Declined', Value: metrics.declined },
      { Metric: 'Acceptance Rate', Value: metrics.acceptanceRate },
      { Metric: 'Decline Rate', Value: metrics.declineRate },
      { Metric: 'Cases with 0 Quotes', Value: metrics.zeroQuotes },
      { Metric: 'Cases with 1 Quote', Value: metrics.oneQuote },
      { Metric: 'Cases with 2+ Quotes', Value: metrics.multipleQuotes },
      { Metric: 'Average Quotes per Case', Value: metrics.avgQuotesPerCase },
    ];
    downloadCsv(`quote_analytics_${new Date().toISOString().split('T')[0]}.csv`, data);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading quote analytics...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quote Analytics</h1>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Quote Outcomes</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Total Quotes</span><span className="font-medium">{metrics.totalQuotes}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Draft</span><span className="font-medium text-gray-500">{metrics.drafts}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Ready</span><span className="font-medium text-amber-600">{metrics.ready}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Sent to Customer</span><span className="font-medium text-blue-600">{metrics.sent}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Accepted</span><span className="font-medium text-green-600">{metrics.accepted}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Declined</span><span className="font-medium text-red-600">{metrics.declined}</span></li>
              <li className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-900 font-medium">Acceptance Rate</span><span className="font-bold text-green-600">{metrics.acceptanceRate}</span></li>
              <li className="flex justify-between"><span className="text-gray-900 font-medium">Decline Rate</span><span className="font-bold text-red-600">{metrics.declineRate}</span></li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Multiple Quote Insights</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Cases with 0 Quotes</span><span className="font-medium">{metrics.zeroQuotes}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Cases with 1 Quote</span><span className="font-medium">{metrics.oneQuote}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Cases with 2+ Quotes</span><span className="font-medium text-blue-600">{metrics.multipleQuotes}</span></li>
              <li className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-900 font-medium">Avg Quotes per Case</span><span className="font-bold">{metrics.avgQuotesPerCase}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
