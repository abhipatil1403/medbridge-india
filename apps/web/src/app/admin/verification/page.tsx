'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AcquisitionReview } from '../../../types/models';
import { adminAcquisitionService } from '../../../features/admin/adminAcquisitionService';
import { useAuth } from '../../../components/AuthProvider';

export default function VerificationPage() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<AcquisitionReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const data = await adminAcquisitionService.getPendingReviews();
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (loading) return <div className="p-6">Loading queue...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Verification Queue</h1>
      <p className="text-gray-600 mb-6">Review newly acquired data from external sources before publishing.</p>
      
      {reviews.length === 0 ? (
        <div className="bg-gray-50 border rounded p-8 text-center text-gray-500">
          No pending items to review.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retrieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((rev) => (
                <tr key={rev.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rev.candidateData?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rev.sourceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      rev.matchType === 'EXACT_MATCH' ? 'bg-green-100 text-green-800' :
                      rev.matchType === 'NO_MATCH' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rev.matchType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rev.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(rev.retrievedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/verification/${rev.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Review &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
