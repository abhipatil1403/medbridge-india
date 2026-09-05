'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AcquisitionReview } from '../../../types/models';
import { adminAcquisitionService } from '../../../features/admin/adminAcquisitionService';
import { useAuth } from '../../../components/AuthProvider';
import { Badge } from '../../../components/Badge';
import { DataOriginBadge } from '../../../components/DataOriginBadge';

export default function VerificationPage() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<AcquisitionReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [matchFilter, setMatchFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        setError(null);
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

  const getCandidateName = (rev: AcquisitionReview) => {
    if (!rev.entityType || ['HOSPITAL', 'CLINIC', 'DOCTOR'].includes(rev.entityType)) {
      return rev.candidateData?.name || 'Unknown';
    }
    if (rev.entityType === 'TREATMENT') {
      return rev.candidateData?.name || 'Unknown';
    }
    if (rev.entityType === 'PROVIDER_SERVICE') {
      if (rev.candidateData?.providerId && rev.candidateData?.treatmentName) {
        const formattedProvider = rev.candidateData.providerId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `${formattedProvider} — ${rev.candidateData.treatmentName}`;
      }
      return 'Unknown';
    }
    return rev.candidateData?.name || 'Unknown';
  };

  const getLocation = (rev: AcquisitionReview) => {
    if (!rev.entityType || ['HOSPITAL', 'CLINIC', 'DOCTOR'].includes(rev.entityType)) {
      return rev.candidateData?.city || rev.candidateData?.district || rev.candidateData?.state || 'Unknown';
    }
    if (rev.entityType === 'TREATMENT') {
      return 'Treatment';
    }
    if (rev.entityType === 'PROVIDER_SERVICE') {
      return '—';
    }
    return 'Unknown';
  };

  const getTypeLabel = (rev: AcquisitionReview) => {
    switch (rev.entityType) {
      case 'HOSPITAL': return 'Hospital';
      case 'CLINIC': return 'Clinic';
      case 'DOCTOR': return 'Doctor';
      case 'TREATMENT': return 'Treatment';
      case 'PROVIDER_SERVICE': return 'Provider Service';
      default: return 'Unknown';
    }
  };

  const filteredReviews = reviews.filter(rev => {
    if (statusFilter !== 'ALL' && rev.status !== statusFilter) return false;
    if (matchFilter !== 'ALL' && rev.matchType !== matchFilter) return false;
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'PROVIDERS' && !['HOSPITAL', 'CLINIC', 'DOCTOR'].includes(rev.entityType || '')) return false;
      if (typeFilter === 'HOSPITALS' && rev.entityType !== 'HOSPITAL') return false;
      if (typeFilter === 'CLINICS' && rev.entityType !== 'CLINIC') return false;
      if (typeFilter === 'DOCTORS' && rev.entityType !== 'DOCTOR') return false;
      if (typeFilter === 'TREATMENTS' && rev.entityType !== 'TREATMENT') return false;
      if (typeFilter === 'PROVIDER_SERVICES' && rev.entityType !== 'PROVIDER_SERVICE') return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = getCandidateName(rev).toLowerCase();
      const location = getLocation(rev).toLowerCase();
      const sourceId = (rev.sourceId || '').toLowerCase();
      
      if (!name.includes(term) && !location.includes(term) && !sourceId.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const totalPending = reviews.filter(r => r.status === 'PENDING').length;
  const totalProviders = reviews.filter(r => r.status === 'PENDING' && ['HOSPITAL', 'CLINIC', 'DOCTOR'].includes(r.entityType || '')).length;
  const totalTreatments = reviews.filter(r => r.status === 'PENDING' && r.entityType === 'TREATMENT').length;
  const totalProviderServices = reviews.filter(r => r.status === 'PENDING' && r.entityType === 'PROVIDER_SERVICE').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Data Verification Queue</h1>
        <p className="text-slate-600 max-w-3xl">Review newly acquired data from external sources, resolve duplicates, and approve for publishing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Pending Reviews</span>
          <span className="text-3xl font-extrabold text-indigo-700">{totalPending}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Providers</span>
          <span className="text-3xl font-extrabold text-emerald-600">{totalProviders}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Treatments</span>
          <span className="text-3xl font-extrabold text-cyan-600">{totalTreatments}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Provider Services</span>
          <span className="text-3xl font-extrabold text-purple-600">{totalProviderServices}</span>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex-grow relative min-w-[200px]">
           <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search candidate, location, source..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="md:w-48 py-2.5 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow bg-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="PROVIDERS">Providers</option>
          <option value="TREATMENTS">Treatments</option>
          <option value="PROVIDER_SERVICES">Provider Services</option>
          <option value="HOSPITALS">Hospitals</option>
          <option value="CLINICS">Clinics</option>
          <option value="DOCTORS">Doctors</option>
        </select>
        <select 
          className="md:w-48 py-2.5 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow bg-white"
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
          className="md:w-48 py-2.5 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow bg-white"
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <svg className="w-5 h-5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {loading ? (
         <div className="flex flex-col items-center justify-center p-20 space-y-4">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
           <p className="text-slate-500 font-medium animate-pulse">Loading verification queue...</p>
         </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-16 text-center shadow-sm">
           <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <h3 className="text-lg font-bold text-slate-800 mb-1">Queue Empty</h3>
           <p className="text-slate-500">No items match your filters or the queue is fully processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Candidate Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data Origin</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Match Type</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 max-w-[250px] truncate" title={getCandidateName(rev)}>
                      {getCandidateName(rev)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {getTypeLabel(rev)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {getLocation(rev)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">{rev.sourceId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {rev.candidateData?.dataOrigin ? <DataOriginBadge origin={rev.candidateData.dataOrigin} /> : <span className="text-slate-400 text-xs italic">Unknown</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {rev.matchType === 'EXACT_MATCH' ? <Badge variant="success">Exact Match</Badge> :
                        rev.matchType === 'NO_MATCH' ? <Badge variant="info">New Record</Badge> :
                        <Badge variant="warning">{rev.matchType.replace('_', ' ')}</Badge>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {rev.status === 'PENDING' ? <Badge variant="warning">Pending</Badge> :
                        rev.status === 'REJECTED' ? <Badge variant="error">Rejected</Badge> :
                        <Badge variant="success">{rev.status.replace('_', ' ')}</Badge>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <Link href={`/admin/verification/${rev.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1">
                        Review <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
