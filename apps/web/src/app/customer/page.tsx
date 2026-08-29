'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { getUserCases } from '../../features/cases/caseService';
import { Case } from '../../types/models';

function DashboardContent() {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (currentUser) {
        try {
          const userCases = await getUserCases(currentUser.uid);
          setCases(userCases.slice(0, 3)); // show top 3 recent
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [currentUser]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Welcome to MedBridge India</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-blue-100 p-6 rounded-lg bg-blue-50 col-span-1 md:col-span-2 shadow-sm">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Find a Healthcare Provider</h2>
          <p className="text-blue-800 mb-6">Search for published and verified hospitals, clinics, and doctors across India based on official sources.</p>
          <Link href="/customer/search" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg inline-block font-medium hover:bg-blue-700 shadow-sm">
            Search Providers
          </Link>
        </div>
        
        <div className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Need a Quote?</h2>
            <p className="text-gray-600 mb-4 text-sm">Tell us about your medical needs and we will help you find the right provider.</p>
          </div>
          <Link href="/customer/request-quote" className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg inline-block text-center font-medium hover:bg-gray-50">
            Request General Quote
          </Link>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Cases & Quote Requests</h2>
          <Link href="/customer/cases" className="text-sm text-blue-600 font-medium hover:underline">
            View All
          </Link>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">You don't have any active quote requests or cases.</p>
              <Link href="/customer/request-quote" className="text-blue-600 font-medium hover:underline">
                Start a new request
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cases.map(c => (
                <div key={c.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {c.treatmentName || c.treatmentId || 'General Inquiry'}
                      </h3>
                      {c.providerName && (
                        <p className="text-sm text-gray-600 mt-1">Provider: <span className="font-medium text-gray-800">{c.providerName}</span></p>
                      )}
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {c.currentStage.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <p className="text-xs text-gray-500">Ref: {c.humanReference} | Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                    <Link href={`/customer/cases/${c.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
