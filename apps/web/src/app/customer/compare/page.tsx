'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTreatmentOptionsByIds, TreatmentOption } from '../../../features/search/providerOptionsService';
import { Disclaimer } from '../../../components/Disclaimer';
import { DataOriginBadge } from '../../../components/DataOriginBadge';
import { Badge } from '../../../components/Badge';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceIds = searchParams.get('serviceIds')?.split(',') || [];
  
  const [options, setOptions] = useState<TreatmentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (serviceIds.length < 2) {
        setLoading(false);
        return;
      }
      
      const toFetch = serviceIds.slice(0, 3); // Max 3 options
      try {
        const results = await getTreatmentOptionsByIds(toFetch);
        setOptions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Building your comparison matrix...</p>
      </div>
    );
  }

  if (options.length < 2) {
    return (
      <div className="p-16 text-center max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">Compare Options</h1>
        <p className="mb-6 text-slate-600">Please select at least two options to compare.</p>
        <button onClick={() => router.back()} className="text-white bg-indigo-600 px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">
          &larr; Go back to options
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Options
        </button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Compare your options</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-2xl">
          Compare the available information and choose according to your own requirements. <strong>MedBridge does not declare a "best" option</strong>.
        </p>
      </div>
      
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-5 border-b border-r border-slate-200 bg-slate-50 w-48 shrink-0 font-bold text-slate-500 uppercase tracking-wider text-xs">Features</th>
              {options.map(opt => (
                <th key={`head-${opt.service.id}`} className="p-5 border-b border-slate-200 min-w-[280px] align-top bg-white">
                  <h2 className="text-lg font-bold text-slate-900 mb-1.5">{opt.provider?.name}</h2>
                  <div className="text-sm text-slate-500 mb-4">{opt.provider?.city || 'Location unavailable'}</div>
                  
                  <Link href={`/customer/providers/${opt.provider?.id}`} className="block w-full text-sm border border-indigo-600 text-indigo-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 text-center transition-colors">
                    View Details
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {/* Treatment */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Treatment</td>
              {options.map(opt => (
                <td key={`treat-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  <span className="font-medium text-slate-900">{opt.service.treatmentName || 'Service available'}</span>
                </td>
              ))}
            </tr>
            {/* Cost */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Estimated Cost</td>
              {options.map(opt => (
                <td key={`cost-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {(opt.service.estimatedCostMin || opt.service.estimatedCostMax) ? (
                    <span className="text-emerald-700 font-bold text-base bg-emerald-50 px-2 py-1 rounded">
                      {opt.service.currency || 'INR'} {opt.service.estimatedCostMin?.toLocaleString() || 0} - {opt.service.estimatedCostMax?.toLocaleString() || 0}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not available</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Provider Type */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Provider Type</td>
              {options.map(opt => (
                <td key={`type-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.provider?.providerType ? (
                    <Badge variant="info">{opt.provider.providerType}</Badge>
                  ) : 'Not specified'}
                </td>
              ))}
            </tr>
            {/* Rating */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Public Rating</td>
              {options.map(opt => (
                <td key={`rating-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.provider?.rating ? (
                    <div>
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {opt.provider.rating} / 5
                      </span>
                      <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {opt.provider.reviewCount} public reviews
                        <br/>
                        <span className="text-slate-400">Source: {opt.provider.ratingSource || 'Unknown'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No rating available</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Logistics */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Nearest Airport</td>
              {options.map(opt => (
                <td key={`air-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.provider?.nearestAirportId ? (
                    <span className="font-medium text-slate-800">{opt.provider.nearestAirportId}</span>
                  ) : (
                    <span className="text-slate-400 italic">Not available</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Local Transport</td>
              {options.map(opt => (
                <td key={`trans-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.provider?.localTransportAvailability ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Available
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Accommodation</td>
              {options.map(opt => (
                <td key={`acc-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.provider?.accommodationReferences?.length ? (
                    <span className="font-medium text-indigo-700">{opt.provider.accommodationReferences.length} options referenced</span>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Data Provenance */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Data Source</td>
              {options.map(opt => (
                <td key={`origin-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  <DataOriginBadge origin={opt.service.dataOrigin} />
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 border-b border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-600">Verification Status</td>
              {options.map(opt => (
                <td key={`ver-${opt.service.id}`} className="p-4 border-b border-slate-200 align-top">
                  {opt.service.verificationStatus === 'VERIFIED' ? (
                    <Badge variant="success">Verified Cost</Badge>
                  ) : (
                    <Badge variant="default">Unverified Estimate</Badge>
                  )}
                  {opt.service.costVerifiedAt && (
                    <div className="text-[11px] text-slate-400 mt-2">
                      Last checked:<br/>
                      {new Date(opt.service.costVerifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <Disclaimer className="mt-8" />
    </div>
  );
}

export default function CompareOptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
