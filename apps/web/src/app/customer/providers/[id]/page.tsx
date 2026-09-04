'use client';

import React, { useEffect, useState } from 'react';
import { getHospitalById, getCostEstimatesByHospital } from '../../../../features/providers/providerService';
import { Hospital, CostEstimate } from '../../../../types/models';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import Link from 'next/link';

export default function ProviderProfile() {
  const { id } = useParams() as { id: string };
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [estimates, setEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const h = await getHospitalById(id);
        if (h) {
          setHospital(h);
          const ests = await getCostEstimatesByHospital(id);
          setEstimates(ests);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRequestQuote = (treatmentId?: string) => {
    const url = `/customer/request-quote?providerId=${id}&providerName=${encodeURIComponent(hospital?.name || '')}${treatmentId ? `&treatmentId=${treatmentId}` : ''}`;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(url)}`);
    } else {
      router.push(url);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-600">Loading provider profile...</div>;
  if (!hospital) return (
    <div className="p-12 text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Provider not found</h2>
      <p className="text-gray-600 mb-4">This provider may not exist or is not currently published.</p>
      <Link href="/customer/search" className="text-blue-600 hover:underline">Return to search</Link>
    </div>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/customer/search" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Search
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
            
            <div className="text-gray-700 text-lg flex flex-wrap gap-2 items-center mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {hospital.town && <span>{hospital.town},</span>}
              {(!hospital.town && hospital.city) && <span>{hospital.city},</span>}
              {hospital.district && <span>{hospital.district},</span>}
              {hospital.state && <span>{hospital.state}</span>}
              {(!hospital.town && !hospital.city && !hospital.district && !hospital.state) && <span className="text-gray-500 italic text-base">Location information not available from source.</span>}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {hospital.careType && (
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
                  {hospital.careType}
                </span>
              )}
              {hospital.category && (
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">
                  {hospital.category}
                </span>
              )}
            </div>
          </div>
          
          <div className="shrink-0">
             <button onClick={() => handleRequestQuote()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-700 w-full md:w-auto">
              Request a Quote
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          {/* Specialties */}
          {hospital.specialties && hospital.specialties.length > 0 && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {hospital.specialties.map(s => (
                  <span key={s} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities */}
          {(hospital.facilities?.length || hospital.emergencyServices || hospital.systemsOfMedicine?.length || hospital.beds) ? (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Capabilities & Infrastructure</h2>
              <div className="space-y-4">
                {hospital.beds !== null && hospital.beds !== undefined && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Bed Capacity</h3>
                    <p className="text-gray-900">{hospital.beds} beds</p>
                  </div>
                )}
                {hospital.emergencyServices && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Emergency Services</h3>
                    <p className="text-gray-900">{hospital.emergencyServices}</p>
                  </div>
                )}
                {hospital.facilities && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Facilities</h3>
                    <p className="text-gray-900 leading-relaxed">
                      {Array.isArray(hospital.facilities) ? hospital.facilities.join(', ') : String(hospital.facilities)}
                    </p>
                  </div>
                )}
                {hospital.systemsOfMedicine && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Systems of Medicine</h3>
                    <p className="text-gray-900">
                      {Array.isArray(hospital.systemsOfMedicine) ? hospital.systemsOfMedicine.join(', ') : String(hospital.systemsOfMedicine)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Logistics & Planning */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Logistics & Planning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-1">Nearest Airport</h3>
                <p className="text-gray-900">{hospital.nearestAirportId || 'Information not available'}</p>
              </div>
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-1">Local Transport</h3>
                <p className="text-gray-900">{hospital.localTransportAvailability ? 'Options available near provider' : 'Information not available'}</p>
              </div>
              <div className="border p-4 rounded bg-gray-50 sm:col-span-2">
                <h3 className="font-semibold text-gray-700 mb-1">Accommodation</h3>
                {hospital.accommodationReferences && hospital.accommodationReferences.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-900">
                    {hospital.accommodationReferences.map((acc, i) => (
                      <li key={i}>{acc}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-900">Accommodation information not available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Estimates */}
          {estimates.length > 0 && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-2 text-gray-800">Treatments & Estimated Costs</h2>
              <p className="text-sm text-gray-500 mb-4">Costs shown are estimates based on available platform data and are not a binding quote.</p>
              
              <div className="grid gap-4">
                {estimates.map(est => (
                  <div key={est.id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">{est.treatmentName}</h3>
                      <p className="text-lg text-green-700 font-medium mt-1">
                        {est.currency} {est.minAmount.toLocaleString()} - {est.maxAmount.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRequestQuote(est.treatmentId)} 
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-medium hover:bg-blue-200"
                    >
                      Request Quote
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          {/* Source Disclosure */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 shadow-sm">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Source Verification
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <span className="block text-xs font-medium text-blue-600 uppercase tracking-wider">Source</span>
                <span className="font-medium">{hospital.source}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-blue-600 uppercase tracking-wider">Status</span>
                <span className="font-medium capitalize">{hospital.verificationStatus.replace('_', ' ').toLowerCase()}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-blue-600 uppercase tracking-wider">Last Retrieved</span>
                <span className="font-medium">{new Date(hospital.lastCheckedAt).toLocaleDateString()}</span>
              </div>
              {hospital._provenance && Object.keys(hospital._provenance).length > 0 && (
                <div className="pt-2 border-t border-blue-200 mt-2">
                  <span className="block text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Additional Source Evidence</span>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(Object.values(hospital._provenance).map(p => p.sourceId))).map(s => (
                      <span key={s as string} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {s as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Accreditation Placeholder */}
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Accreditation</h3>
            {hospital.accreditation ? (
              <p className="text-gray-900 font-medium">{hospital.accreditation}</p>
            ) : (
              <p className="text-gray-500 text-sm italic">Accreditation information not available from this source.</p>
            )}
          </div>

          {/* Explore More */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-5 shadow-sm">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              Explore More
            </h3>
            <ul className="space-y-3 text-sm text-indigo-800">
              {hospital.nearestAirportId && (
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>This provider is accessible via <strong>{hospital.nearestAirportId}</strong>. Check if other options are closer to your preferred arrival point.</span>
                </li>
              )}
              {!hospital.accommodationReferences?.length && (
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>This option lacks accommodation references. You may want to consider providers that list nearby places to stay.</span>
                </li>
              )}
              {hospital.verificationStatus !== 'VERIFIED' && (
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>Some information is unverified. Compare this with verified options for more certainty.</span>
                </li>
              )}
            </ul>
            <div className="mt-4">
              <Link href="/customer/options" className="text-indigo-600 hover:underline font-medium text-sm">
                View other options &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
