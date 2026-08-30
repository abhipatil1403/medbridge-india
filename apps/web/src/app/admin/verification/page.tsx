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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [matchFilter, setMatchFilter] = useState('ALL');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        setError(null);
        // Force refresh ID token so Custom Claims (SUPER_ADMIN, DATA_REVIEWER) are active
        await currentUser.getIdToken(true);
        const data = await adminAcquisitionService.getPendingReviews();
        setReviews(data);
      } catch (err: any) {
        console.error("Failed to load verification queue:", err);
        setError(err.message || "Failed to load verification queue");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  const filteredReviews = reviews.filter(rev => {
    if (statusFilter !== 'ALL' && rev.status !== statusFilter) return false;
    if (matchFilter !== 'ALL' && rev.matchType !== matchFilter) return false;
    
    if (searchTerm) {
      const name = rev.candidateData?.name?.toLowerCase() || '';
      if (!name.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  if (loading) return <div className="p-6">Loading queue...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Data Verification Queue</h1>
      <p className="text-gray-600 mb-6">Review newly acquired data from external sources before publishing.</p>
      
      <div className="bg-white p-4 rounded-lg shadow border mb-6 flex gap-4">
        <input 
          type="text" 
          placeholder="Search candidate name..." 
          className="border rounded p-2 flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="border rounded p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED_MERGE">Approved (Merge)</option>
          <option value="APPROVED_NEW_DRAFT">Approved (New Draft)</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select 
          className="border rounded p-2"
          value={matchFilter}
          onChange={(e) => setMatchFilter(e.target.value)}
        >
          <option value="ALL">All Matches</option>
          <option value="EXACT_MATCH">Exact Match</option>
          <option value="PROBABLE_MATCH">Probable Match</option>
          <option value="POSSIBLE_MATCH">Possible Match</option>
          <option value="NO_MATCH">No Match</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <div className="bg-gray-50 border rounded p-8 text-center text-gray-500">
          No items match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.map((rev) => (
                <tr key={rev.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rev.candidateData?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rev.candidateData?.city || rev.candidateData?.district || rev.candidateData?.state || 'Unknown'}
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
