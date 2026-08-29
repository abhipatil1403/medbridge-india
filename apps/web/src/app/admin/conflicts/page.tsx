'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/client';
import { FieldConflict } from '../../../types/models';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

function ConflictsDashboard() {
  const [conflicts, setConflicts] = useState<FieldConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'fieldConflicts'),
          where('status', '==', statusFilter),
          limit(100)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FieldConflict));
        // Sort in memory by detectedAt desc since we can't easily compound index right now without throwing an error
        results.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        setConflicts(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Field Conflicts Queue</h1>
          <p className="text-gray-600 text-sm">Resolve multi-source data disagreements.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
        <label className="text-sm font-medium text-gray-700 mr-3">Status Filter:</label>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="RESOLVED_CANONICAL">Resolved (Keep Canonical)</option>
          <option value="RESOLVED_SOURCE">Resolved (Accept Source)</option>
          <option value="RESOLVED_MANUAL">Resolved (Manual)</option>
          <option value="REJECTED">Rejected</option>
          <option value="IGNORED">Ignored</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Entity ID</th>
              <th className="p-4 font-medium text-gray-600">Field Name</th>
              <th className="p-4 font-medium text-gray-600">Canonical Value</th>
              <th className="p-4 font-medium text-gray-600">Conflicting Sources</th>
              <th className="p-4 font-medium text-gray-600">Detected At</th>
              <th className="p-4 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading conflicts...</td></tr>
            ) : conflicts.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No conflicts found matching the filter.</td></tr>
            ) : (
              conflicts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{c.entityId.slice(0, 8)}...</td>
                  <td className="p-4 font-medium text-blue-800">{c.fieldName}</td>
                  <td className="p-4 text-gray-500 truncate max-w-[200px]">
                    {c.canonicalValue === null || c.canonicalValue === undefined ? <span className="italic text-gray-400">Empty</span> : JSON.stringify(c.canonicalValue)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {c.candidateValues.map((v: any, i: number) => (
                        <span key={i} className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">
                          {v.sourceId}: {JSON.stringify(v.value)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(c.detectedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Link href={`/admin/conflicts/${c.id}`} className="text-blue-600 hover:underline font-medium">
                      Review &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DATA_REVIEWER']}>
      <ConflictsDashboard />
    </ProtectedRoute>
  );
}
