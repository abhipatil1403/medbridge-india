'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AcquisitionReview, Hospital } from '../../../../types/models';
import { adminAcquisitionService } from '../../../../features/admin/adminAcquisitionService';
import { adminProviderService } from '../../../../features/admin/adminProviderService';
import { useAuth } from '../../../../components/AuthProvider';

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [review, setReview] = useState<AcquisitionReview | null>(null);
  const [existingHospital, setExistingHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const rev = await adminAcquisitionService.getReviewById(params.id);
        setReview(rev);
        if (rev && rev.entityId) {
          const hosp = await adminProviderService.getHospital(rev.entityId);
          setExistingHospital(hosp as Hospital);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, params.id]);

  const handleApprove = async () => {
    if (!currentUser || !userProfile || !review) return;
    try {
      if (review.entityId && existingHospital) {
        // Just merging fields we care about (simplified for demo)
        const updates: Partial<Hospital> = {
          name: review.candidateData.name,
          city: review.candidateData.city,
        };
        await adminAcquisitionService.approveAndMergeToExisting(
          review.id!,
          review.entityId,
          updates,
          currentUser.uid,
          userProfile.primaryRole
        );
      } else {
        await adminAcquisitionService.approveAndCreateDraft(
          review.id!,
          review.candidateData,
          currentUser.uid,
          userProfile.primaryRole
        );
      }
      alert('Approved successfully.');
      router.push('/admin/verification');
    } catch (err) {
      console.error(err);
      alert('Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!currentUser || !userProfile || !review) return;
    try {
      await adminAcquisitionService.updateReviewStatus(review.id!, 'REJECTED', currentUser.uid, userProfile.primaryRole);
      alert('Rejected successfully.');
      router.push('/admin/verification');
    } catch (err) {
      console.error(err);
      alert('Failed to reject');
    }
  };

  if (loading) return <div className="p-6">Loading review...</div>;
  if (!review) return <div className="p-6">Review not found.</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Acquisition Review</h1>
        <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-medium">{review.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Candidate Data */}
        <div className="bg-white p-4 rounded shadow border">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4">Candidate (New)</h2>
          <div className="space-y-3 text-sm">
            <div><span className="font-medium text-gray-500">Name:</span> {review.candidateData.name}</div>
            <div>
              <span className="font-medium text-gray-500">City:</span>{' '}
              {review.candidateData.city ? (
                <span>{review.candidateData.city} <span className="text-xs text-gray-400">(via {review.candidateData.citySource || 'source'})</span></span>
              ) : (
                <span className="text-amber-600 italic">Not available from source</span>
              )}
            </div>
            {(review.candidateData.state || review.candidateData.district || review.candidateData.town) && (
              <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-2 text-xs">
                <div className="font-medium text-gray-500 mb-1">Source Geographic Data:</div>
                {review.candidateData.state && <div>State: {review.candidateData.state}</div>}
                {review.candidateData.district && <div>District: {review.candidateData.district}</div>}
                {review.candidateData.town && <div>Town: {review.candidateData.town}</div>}
                {review.candidateData.village && <div>Village: {review.candidateData.village}</div>}
              </div>
            )}
            <div><span className="font-medium text-gray-500">Country:</span> {review.candidateData.country}</div>
            <div><span className="font-medium text-gray-500">Specialties:</span> {review.candidateData.specialties?.join(', ')}</div>
            <div><span className="font-medium text-gray-500">Treatments:</span> {review.candidateData.treatments?.join(', ')}</div>
          </div>
          
          <div className="mt-6 pt-4 border-t text-xs text-gray-400">
            <div>Source: {review.sourceId}</div>
            <div>Retrieved At: {new Date(review.retrievedAt).toLocaleString()}</div>
            <div>Raw Record ID: {review.rawRecordId}</div>
          </div>
        </div>

        {/* Existing Canonical Data (If Match) */}
        <div className="bg-white p-4 rounded shadow border">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4">
            Canonical Entity ({review.matchType})
          </h2>
          {existingHospital ? (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-gray-500">Name:</span> {existingHospital.name}</div>
              <div><span className="font-medium text-gray-500">City:</span> {existingHospital.city}</div>
              <div><span className="font-medium text-gray-500">Status:</span> {existingHospital.status}</div>
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm">
              No existing entity linked. Approving will create a new DRAFT record.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={handleApprove} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">
          Approve (Create DRAFT / Merge)
        </button>
        <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
          Reject Candidate
        </button>
      </div>
    </div>
  );
}
