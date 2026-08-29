'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AcquisitionReview, Hospital } from '../../../../types/models';
import { adminAcquisitionService } from '../../../../features/admin/adminAcquisitionService';
import { adminProviderService } from '../../../../features/admin/adminProviderService';
import { useAuth } from '../../../../components/AuthProvider';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { currentUser, userProfile } = useAuth();
  
  const [review, setReview] = useState<AcquisitionReview | null>(null);
  const [existingHospital, setExistingHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  // Field selection for merge
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('INVALID_DATA');
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const rev = await adminAcquisitionService.getReviewById(id);
        setReview(rev);
        if (rev && rev.potentialMatches && rev.potentialMatches.length > 0) {
          // For demo, just fetching the first potential match if EXACT/PROBABLE/POSSIBLE
          const hosp = await adminProviderService.getHospital(rev.potentialMatches[0]);
          setExistingHospital(hosp as Hospital);
          
          // Default select fields that are populated in candidate but not canonical, etc.
          const initialSelections: Record<string, boolean> = {};
          if (rev.candidateData) {
            Object.keys(rev.candidateData).forEach(k => {
               initialSelections[k] = true;
            });
          }
          setSelectedFields(initialSelections);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, id]);

  const handleApproveMerge = async () => {
    if (!currentUser || !userProfile || !review || !existingHospital) return;
    try {
      const approvedFieldsList = Object.keys(selectedFields).filter(k => selectedFields[k]);
      
      await adminAcquisitionService.approveAndMergeToExisting(
        review.id,
        existingHospital.id!,
        review.candidateData,
        existingHospital,
        approvedFieldsList,
        currentUser.uid,
        userProfile.primaryRole
      );
      
      alert('Approved and merged successfully.');
      router.push('/admin/verification');
    } catch (err) {
      console.error(err);
      alert('Failed to approve merge');
    }
  };

  const handleApproveNewDraft = async () => {
    if (!currentUser || !userProfile || !review) return;
    try {
      await adminAcquisitionService.approveAndCreateDraft(
        review.id,
        review.candidateData,
        currentUser.uid,
        userProfile.primaryRole
      );
      alert('Approved and new draft created.');
      router.push('/admin/verification');
    } catch (err) {
      console.error(err);
      alert('Failed to approve new draft');
    }
  };

  const handleReject = async () => {
    if (!currentUser || !userProfile || !review) return;
    try {
      await adminAcquisitionService.rejectReview(
        review.id,
        rejectionReason,
        rejectionNotes,
        currentUser.uid,
        userProfile.primaryRole
      );
      alert('Rejected successfully.');
      router.push('/admin/verification');
    } catch (err) {
      console.error(err);
      alert('Failed to reject');
    }
  };

  if (loading) return <div className="p-6">Loading review...</div>;
  if (!review) return <div className="p-6">Review not found.</div>;

  const isMatch = ['EXACT_MATCH', 'PROBABLE_MATCH', 'POSSIBLE_MATCH'].includes(review.matchType) && existingHospital;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Candidate Detail</h1>
        <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-medium">{review.status}</span>
      </div>

      <div className="mb-6 bg-white p-4 rounded shadow border border-gray-200">
        <h2 className="font-semibold text-lg border-b pb-2 mb-4">Provenance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="font-medium text-gray-500 block">Source</span> {review.sourceId}</div>
          <div><span className="font-medium text-gray-500 block">Raw Record</span> {review.rawRecordId}</div>
          <div><span className="font-medium text-gray-500 block">Norm Record</span> {review.normalizationRecordId}</div>
          <div><span className="font-medium text-gray-500 block">Retrieved At</span> {new Date(review.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Data */}
        <div className="bg-white p-4 rounded shadow border border-blue-200">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4 text-blue-800">Source Candidate</h2>
          <div className="space-y-4 text-sm">
            {Object.entries(review.candidateData || {}).map(([key, val]) => {
              if (key === 'externalIdentifier' || key === '_provenance') return null;
              const displayVal = Array.isArray(val) ? val.join(', ') : String(val || '');
              
              return (
                <div key={`cand-${key}`} className="flex flex-col border-b border-gray-50 pb-2">
                  <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={displayVal ? 'text-gray-900' : 'text-amber-600 italic'}>
                    {displayVal || 'Not available'}
                  </span>
                  
                  {isMatch && (
                     <label className="mt-1 flex items-center text-xs text-blue-600 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          checked={selectedFields[key] || false}
                          onChange={(e) => setSelectedFields({...selectedFields, [key]: e.target.checked})}
                        />
                        Merge this field if approved
                     </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Canonical Data (If Match) */}
        <div className="bg-white p-4 rounded shadow border border-indigo-200">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4 text-indigo-800">
            Canonical Entity ({review.matchType})
          </h2>
          {isMatch ? (
            <div className="space-y-4 text-sm">
              {Object.entries(existingHospital || {}).map(([key, val]) => {
                 if (typeof val === 'object' && !Array.isArray(val)) return null;
                 const displayVal = Array.isArray(val) ? val.join(', ') : String(val || '');
                 const candVal = String(review.candidateData[key] || '');
                 
                 const isDifferent = candVal && displayVal && candVal !== displayVal;
                 
                 return (
                   <div key={`can-${key}`} className={`flex flex-col border-b border-gray-50 pb-2 ${isDifferent ? 'bg-yellow-50 p-1 rounded' : ''}`}>
                     <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                     <span className="text-gray-900">{displayVal || '-'}</span>
                   </div>
                 );
              })}
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm">
              No existing entity linked. Match Type: {review.matchType}.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-4 bg-gray-50 p-4 rounded border">
        {isMatch && (
          <button onClick={handleApproveMerge} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">
            Approve Merge
          </button>
        )}
        <button onClick={handleApproveNewDraft} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
          Approve New Draft
        </button>
        <button onClick={() => setShowRejectModal(true)} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-bold mb-4">Reject Candidate</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select 
                className="w-full border rounded p-2"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="DUPLICATE">Duplicate</option>
                <option value="INVALID_DATA">Invalid Data</option>
                <option value="UNSUPPORTED_FACILITY">Unsupported Facility</option>
                <option value="INSUFFICIENT_INFORMATION">Insufficient Information</option>
                <option value="WRONG_MATCH">Wrong Match</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (Optional)</label>
              <textarea 
                className="w-full border rounded p-2"
                rows={3}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
