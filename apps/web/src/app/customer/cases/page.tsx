'use client';

import React, { useEffect, useState } from 'react';
import { getUserCases } from '../../../features/cases/caseService';
import { Case } from '../../../types/models';
import { useAuth } from '../../../components/AuthProvider';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import Link from 'next/link';

function CasesList() {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      if (currentUser) {
        try {
          const data = await getUserCases(currentUser.uid);
          setCases(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadCases();
  }, [currentUser]);

  if (loading) return <div className="p-4">Loading cases...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Cases</h1>
      
      {cases.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded border">
          <p>You have no active cases.</p>
          <Link href="/customer/search" className="text-blue-600 mt-2 block">Search for treatments</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {cases.map(c => (
            <Link key={c.id} href={`/customer/cases/${c.id}`} className="block">
              <div className="border p-4 rounded hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-lg">{c.treatmentId || 'General Inquiry'}</h2>
                  <span className="bg-gray-100 text-xs px-2 py-1 rounded">{c.humanReference}</span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <p>Stage: <span className="font-medium text-blue-600">{c.currentStage}</span></p>
                  <p>Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <CasesList />
    </ProtectedRoute>
  );
}
