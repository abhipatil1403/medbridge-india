'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AcquisitionReview } from '../../../../types/models';
import { adminAcquisitionService } from '../../../../features/admin/adminAcquisitionService';
import { adminProviderService } from '../../../../features/admin/adminProviderService';
import { useAuth } from '../../../../components/AuthProvider';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { currentUser, userProfile } = useAuth();
  
  const [review, setReview] = useState<AcquisitionReview | null>(null);
  const [existingEntity, setExistingEntity] = useState<any | null>(null);
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
          // Simplistic logic to fetch the first match if it exists.
          // Note: In Phase 6.3 all items are new drafts (NO_MATCH), so this is safe for now.
          if (!rev.entityType || ['HOSPITAL', 'CLINIC', 'DOCTOR'].includes(rev.entityType)) {
             const hosp = await adminProviderService.getHospital(rev.potentialMatches[0]);
             setExistingEntity(hosp);
          }
          
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
    if (!currentUser || !userProfile || !review || !existingEntity) return;
    try {
      const approvedFieldsList = Object.keys(selectedFields).filter(k => selectedFields[k]);
      
      await adminAcquisitionService.approveAndMergeToExisting(
        review.id,
        existingEntity.id!,
        review.candidateData,
        existingEntity,
        approvedFieldsList,
        currentUser.uid,
        userProfile.primaryRole,
        review.entityType || 'HOSPITAL'
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
        userProfile.primaryRole,
        review.entityType || 'HOSPITAL'
      );
      alert('Approved and published successfully.');
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

  const isMatch = ['EXACT_MATCH', 'PROBABLE_MATCH', 'POSSIBLE_MATCH'].includes(review.matchType) && existingEntity;
  const entityType = review.entityType || 'HOSPITAL';

  const renderProvenance = () => (
    <div className="mb-6 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h2 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">Provenance Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Source ID</span> 
           <span className="font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">{review.sourceId || 'Not available'}</span>
        </div>
        <div>
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Data Origin</span> 
           <span className="font-medium text-slate-900">{review.candidateData?.dataOrigin || 'Not available'}</span>
        </div>
        <div className="lg:col-span-2">
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Source URL / Reference</span> 
           <div className="truncate text-indigo-600 hover:underline">
             {review.candidateData?.sourceReferences?.[0] ? (
               <a href={review.candidateData.sourceReferences[0]} target="_blank" rel="noopener noreferrer">
                 {review.candidateData.sourceReferences[0]}
               </a>
             ) : review.candidateData?.website ? (
               <a href={review.candidateData.website} target="_blank" rel="noopener noreferrer">
                 {review.candidateData.website}
               </a>
             ) : (
               <span className="text-slate-900 no-underline">Not available</span>
             )}
           </div>
        </div>
        <div>
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Retrieved At</span> 
           <span className="font-medium text-slate-900">{review.candidateData?.retrievedAt ? new Date(review.candidateData.retrievedAt).toLocaleString() : 'Not available'}</span>
        </div>
        <div>
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Raw Record</span> 
           <span className="font-medium text-slate-900 text-xs text-slate-500 truncate">{review.rawRecordId || 'Not available'}</span>
        </div>
        <div className="lg:col-span-2">
           <span className="font-semibold text-slate-500 block mb-1 uppercase tracking-wider text-[11px]">Norm Record</span> 
           <span className="font-medium text-slate-900 text-xs text-slate-500 truncate">{review.normalizationRecordId || 'Not available'}</span>
        </div>
      </div>
    </div>
  );

  const renderProviderDetail = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h2 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">Provider Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><span className="font-medium text-slate-500 block">Name</span> <span className="font-medium">{review.candidateData?.name || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Provider Type</span> <span className="font-medium">{review.candidateData?.providerType || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">City</span> <span className="font-medium">{review.candidateData?.city || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">State</span> <span className="font-medium">{review.candidateData?.state || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Country</span> <span className="font-medium">{review.candidateData?.country || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Rating</span> <span className="font-medium">{review.candidateData?.rating || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Review Count</span> <span className="font-medium">{review.candidateData?.reviewCount || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Rating Source</span> <span className="font-medium">{review.candidateData?.ratingSource || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Accreditations</span> <span className="font-medium">{review.candidateData?.accreditation || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Nearest Airport</span> <span className="font-medium">{review.candidateData?.nearestAirportId || 'Not available'}</span></div>
      </div>
    </div>
  );

  const renderTreatmentDetail = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h2 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">Treatment Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><span className="font-medium text-slate-500 block">Treatment Name</span> <span className="font-medium">{review.candidateData?.name || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Slug</span> <span className="font-medium">{review.candidateData?.slug || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Category</span> <span className="font-medium">{review.candidateData?.category || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Disease / Condition</span> <span className="font-medium">{review.candidateData?.diseaseCondition || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Treatment Type</span> <span className="font-medium">{review.candidateData?.treatmentType || 'Not available'}</span></div>
      </div>
    </div>
  );

  const renderProviderServiceDetail = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h2 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">Provider Service Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="col-span-2"><span className="font-medium text-slate-500 block">Provider ID</span> <span className="font-medium">{review.candidateData?.providerId || 'Not available'}</span></div>
        <div className="col-span-2"><span className="font-medium text-slate-500 block">Treatment ID</span> <span className="font-medium">{review.candidateData?.treatmentId || 'Not available'}</span></div>
        <div className="col-span-2"><span className="font-medium text-slate-500 block">Treatment Name</span> <span className="font-medium text-lg">{review.candidateData?.treatmentName || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Estimated Cost Minimum</span> <span className="font-medium">{review.candidateData?.estimatedCostMin ? `${review.candidateData?.currency || ''} ${review.candidateData?.estimatedCostMin}` : 'Cost not publicly available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Estimated Cost Maximum</span> <span className="font-medium">{review.candidateData?.estimatedCostMax ? `${review.candidateData?.currency || ''} ${review.candidateData?.estimatedCostMax}` : 'Cost not publicly available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Cost Source</span> <span className="font-medium">{review.candidateData?.costSource || 'Not available'}</span></div>
        <div><span className="font-medium text-slate-500 block">Data Origin</span> <span className="font-medium">{review.candidateData?.dataOrigin || 'Not available'}</span></div>
      </div>
    </div>
  );

  const renderDetail = () => {
    switch(entityType) {
      case 'TREATMENT': return renderTreatmentDetail();
      case 'PROVIDER_SERVICE': return renderProviderServiceDetail();
      default: return renderProviderDetail(); // HOSPITAL, CLINIC, DOCTOR
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Candidate</h1>
          <p className="text-slate-500">{entityType.replace('_', ' ')}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
          review.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
          review.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
        }`}>{review.status.replace('_', ' ')}</span>
      </div>

      {renderProvenance()}

      {renderDetail()}

      {isMatch && (
         <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-200">
           <h2 className="font-semibold text-lg border-b border-slate-100 pb-3 mb-4 text-indigo-800">
             Canonical Entity ({review.matchType})
           </h2>
           <div className="space-y-4 text-sm">
             {Object.entries(existingEntity || {}).map(([key, val]) => {
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
         </div>
      )}

      <div className="pt-6 flex gap-4 border-t border-slate-200">
        {isMatch && (
          <button onClick={handleApproveMerge} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors">
            Approve & Merge
          </button>
        )}
        <button onClick={handleApproveNewDraft} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors">
          Approve New Record
        </button>
        <button onClick={() => setShowRejectModal(true)} className="px-6 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold transition-colors ml-auto">
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Reject Candidate</h3>
            <p className="text-sm text-slate-500 mb-6">This will mark the review as rejected, but underlying raw records and logs will be preserved.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Reason</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="INVALID_DATA">Invalid Data</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="UNSUPPORTED_FACILITY">Unsupported Facility</option>
                <option value="INSUFFICIENT_INFORMATION">Insufficient Information</option>
                <option value="WRONG_MATCH">Wrong Match</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Internal Notes (Optional)</label>
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
                placeholder="Explain why this record is being rejected..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleReject} className="px-5 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
