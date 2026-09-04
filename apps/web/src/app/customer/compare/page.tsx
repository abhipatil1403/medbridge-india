'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTreatmentOptionsByIds, TreatmentOption } from '../../../features/search/providerOptionsService';

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
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (options.length < 2) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto bg-white rounded-lg border shadow-sm mt-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Compare Options</h1>
        <p className="mb-4 text-gray-600">Please select at least two options to compare.</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline font-medium">
          &larr; Go back to options
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Options
        </button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Compare your options</h1>
        <p className="text-gray-600 mt-1 text-sm">
          MedBridge provides informational comparisons based on available information. It does not provide medical advice.
        </p>
      </div>
      
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-r bg-gray-50 w-48 shrink-0 font-medium text-gray-700">Features</th>
              {options.map(opt => (
                <th key={`head-${opt.service.id}`} className="p-4 border-b min-w-[250px] align-top bg-white">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{opt.provider?.name}</h2>
                  <div className="text-sm text-gray-600 mb-3">{opt.provider?.city || 'Location unavailable'}</div>
                  
                  <div className="flex flex-col gap-2">
                    <Link href={`/customer/providers/${opt.provider?.id}`} className="text-sm border border-blue-600 text-blue-600 px-3 py-1.5 rounded font-medium hover:bg-blue-50 text-center">
                      View Details
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Treatment / Service</td>
              {options.map(opt => (
                <td key={`treat-${opt.service.id}`} className="p-4 border-b align-top">
                  <span className="font-medium">{opt.service.treatmentName || 'Service available'}</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Estimated Cost</td>
              {options.map(opt => (
                <td key={`cost-${opt.service.id}`} className="p-4 border-b align-top">
                  {(opt.service.estimatedCostMin || opt.service.estimatedCostMax) ? (
                    <span className="text-green-700 font-medium">
                      {opt.service.currency || 'INR'} {opt.service.estimatedCostMin || 0} - {opt.service.estimatedCostMax || 0}
                    </span>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Provider Type</td>
              {options.map(opt => (
                <td key={`type-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.provider?.providerType || 'Not specified'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Public Rating</td>
              {options.map(opt => (
                <td key={`rating-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.provider?.rating ? (
                    <div>
                      <span className="text-yellow-600 font-medium">{opt.provider.rating} / 5</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {opt.provider.reviewCount} reviews
                        <br/>
                        Source: {opt.provider.ratingSource || 'Public records'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No rating available</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">City / State</td>
              {options.map(opt => (
                <td key={`loc-${opt.service.id}`} className="p-4 border-b align-top">
                  {[opt.provider?.city, opt.provider?.state].filter(Boolean).join(', ') || 'Not available'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Nearest Airport</td>
              {options.map(opt => (
                <td key={`air-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.provider?.nearestAirportId || 'Not available'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Local Transport</td>
              {options.map(opt => (
                <td key={`trans-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.provider?.localTransportAvailability ? 'Available' : 'Not specified'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Accommodation</td>
              {options.map(opt => (
                <td key={`acc-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.provider?.accommodationReferences?.length ? `${opt.provider.accommodationReferences.length} options referenced` : 'Not specified'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Source & Data Origin</td>
              {options.map(opt => (
                <td key={`origin-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.service.dataOrigin === 'SYNTHETIC' ? (
                    <span className="text-purple-700 font-medium text-xs border border-purple-200 bg-purple-50 px-2 py-1 rounded">
                      SYNTHETIC DATA
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">
                      {opt.service.sourceReferences?.[0] || 'Public Records'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Verification Status</td>
              {options.map(opt => (
                <td key={`ver-${opt.service.id}`} className="p-4 border-b align-top">
                  {opt.service.verificationStatus === 'VERIFIED' ? (
                    <span className="text-green-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Verified Cost
                    </span>
                  ) : (
                    <span className="text-gray-600">Unverified Estimate</span>
                  )}
                  {opt.service.costVerifiedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last checked: {new Date(opt.service.costVerifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CompareOptionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
