'use client';
import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getAssignedCases, getAllNewCases } from '../../../features/support/supportService';
import { Case } from '../../../types/models';
import { useAuth } from '../../../components/AuthProvider';
import Link from 'next/link';

export default function SupportQueue() {
  const { currentUser, primaryRole } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, NEW, ASSIGNED

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setLoading(true);
      try {
        if (filter === 'NEW') {
          const newCases = await getAllNewCases();
          setCases(newCases);
        } else {
          // For MVP, just load assigned if ASSIGNED, or merge if ALL
          const assigned = await getAssignedCases(currentUser.uid);
          if (filter === 'ALL') {
             const newC = await getAllNewCases();
             setCases([...assigned, ...newC]);
          } else {
             setCases(assigned);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, filter]);

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Case Queue</h1>
        
        <div className="flex gap-2 mb-6">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-1 rounded border ${filter === 'ALL' ? 'bg-blue-600 text-white' : ''}`}>All</button>
          <button onClick={() => setFilter('NEW')} className={`px-4 py-1 rounded border ${filter === 'NEW' ? 'bg-blue-600 text-white' : ''}`}>New Inquiries</button>
          <button onClick={() => setFilter('ASSIGNED')} className={`px-4 py-1 rounded border ${filter === 'ASSIGNED' ? 'bg-blue-600 text-white' : ''}`}>My Cases</button>
        </div>

        {loading ? <p>Loading cases...</p> : (
          <div className="bg-white border rounded overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Treatment</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.humanReference}</td>
                    <td className="p-3">{c.treatmentId}</td>
                    <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs">{c.currentStage}</span></td>
                    <td className="p-3">{c.priority}</td>
                    <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link href={`/support/cases/${c.id}`} className="text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No cases found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
