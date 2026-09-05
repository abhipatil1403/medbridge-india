'use client';

import React, { useEffect, useState } from 'react';
import { getHospitalById, getCostEstimatesByHospital } from '../../../../features/providers/providerService';
import { Hospital, CostEstimate } from '../../../../types/models';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import Link from 'next/link';
import { Disclaimer } from '../../../../components/Disclaimer';
import { DataOriginBadge } from '../../../../components/DataOriginBadge';
import { Badge } from '../../../../components/Badge';

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!hospital) return (
    <div className="p-16 text-center max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Provider not found</h2>
      <p className="text-slate-600 mb-6">This provider may not exist or is not currently published in our public records.</p>
      <Link href="/customer/requirements" className="text-white bg-indigo-600 px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">Return to search</Link>
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="mb-2">
        <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{hospital.name}</h1>
            
            <div className="text-slate-600 flex flex-wrap gap-2 items-center mb-5 text-sm font-medium">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {hospital.town && <span>{hospital.town},</span>}
              {(!hospital.town && hospital.city) && <span>{hospital.city},</span>}
              {hospital.district && <span>{hospital.district},</span>}
              {hospital.state && <span>{hospital.state}</span>}
              {(!hospital.town && !hospital.city && !hospital.district && !hospital.state) && <span className="text-slate-400 italic">Location information not available from source.</span>}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {hospital.providerType && <Badge variant="info">{hospital.providerType}</Badge>}
              {hospital.careType && <Badge variant="outline">{hospital.careType}</Badge>}
              {hospital.category && <Badge variant="outline">{hospital.category}</Badge>}
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col gap-3">
             <button onClick={() => handleRequestQuote()} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-slate-800 transition-colors w-full md:w-auto text-center">
              Request Information
            </button>
             <button className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              Shortlist
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Public Rating */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Public Rating</h2>
              <p className="text-sm text-slate-500">Aggregated from public reviews.</p>
            </div>
            {hospital.rating ? (
               <div className="text-right">
                  <div className="text-2xl font-black text-amber-500 flex items-center gap-1 justify-end">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {hospital.rating} <span className="text-slate-400 text-lg font-medium">/ 5</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600 mt-1">{hospital.reviewCount} reviews</div>
               </div>
            ) : (
               <div className="text-slate-400 italic font-medium bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                 No rating available
               </div>
            )}
          </div>

          {/* Estimates */}
          {estimates.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-1 text-slate-800">Treatments & Estimated Costs</h2>
              <p className="text-sm text-slate-500 mb-6">Costs shown are estimates based on available platform data and are not a binding quote.</p>
              
              <div className="grid gap-3">
                {estimates.map(est => (
                  <div key={est.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{est.treatmentName}</h3>
                      <p className="text-lg text-emerald-700 font-bold mt-1.5">
                        {est.currency} {est.minAmount.toLocaleString()} - {est.maxAmount.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRequestQuote(est.treatmentId)} 
                      className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                      Inquire
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logistics & Planning */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Logistics & Planning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-5 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="font-bold text-slate-700">Nearest Airport</h3>
                </div>
                <p className="text-slate-900 font-medium">{hospital.nearestAirportId || <span className="text-slate-400 italic font-normal">Information not available</span>}</p>
              </div>
              <div className="border border-slate-200 p-5 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  <h3 className="font-bold text-slate-700">Local Transport</h3>
                </div>
                <p className="text-slate-900 font-medium">{hospital.localTransportAvailability ? <span className="text-emerald-600">Options available near provider</span> : <span className="text-slate-400 italic font-normal">Information not available</span>}</p>
              </div>
              <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <h3 className="font-bold text-slate-700">Accommodation</h3>
                </div>
                {hospital.accommodationReferences && hospital.accommodationReferences.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-900 font-medium">
                    {hospital.accommodationReferences.map((acc, i) => (
                      <li key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                        {acc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Accommodation information not available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Specialties & Capabilities */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
             <h2 className="text-xl font-bold mb-6 text-slate-800">Capabilities & Specialties</h2>
             
             {hospital.specialties && hospital.specialties.length > 0 && (
               <div className="mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Specialties</h3>
                 <div className="flex flex-wrap gap-2">
                   {hospital.specialties.map(s => (
                     <span key={s} className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">{s}</span>
                   ))}
                 </div>
               </div>
             )}

            {(hospital.facilities?.length || hospital.emergencyServices || hospital.systemsOfMedicine?.length || hospital.beds) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                {hospital.beds !== null && hospital.beds !== undefined && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bed Capacity</h3>
                    <p className="text-slate-900 font-medium">{hospital.beds} beds</p>
                  </div>
                )}
                {hospital.emergencyServices && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">Emergency Services</h3>
                    <p className="text-slate-900 font-medium">{hospital.emergencyServices}</p>
                  </div>
                )}
                {hospital.facilities && (
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">Facilities</h3>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {Array.isArray(hospital.facilities) ? hospital.facilities.join(' • ') : String(hospital.facilities)}
                    </p>
                  </div>
                )}
                {hospital.systemsOfMedicine && (
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">Systems of Medicine</h3>
                    <p className="text-slate-900 font-medium">
                      {Array.isArray(hospital.systemsOfMedicine) ? hospital.systemsOfMedicine.join(', ') : String(hospital.systemsOfMedicine)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="lg:col-span-1 space-y-6">
          
          {/* Explore More - Neutral Insights */}
          <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              Explore More
            </h3>
            <p className="text-xs text-indigo-600/80 mb-4 font-medium uppercase tracking-wider">Informational Insights</p>
            <ul className="space-y-4 text-sm text-slate-700">
              {hospital.nearestAirportId && (
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                  <span className="leading-relaxed">This provider is accessible via <strong>{hospital.nearestAirportId}</strong>. Check if other options are closer to your preferred arrival point.</span>
                </li>
              )}
              {!hospital.accommodationReferences?.length && (
                <li className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                  <span className="leading-relaxed">This option lacks accommodation references. You may want to consider providers that list nearby places to stay.</span>
                </li>
              )}
              {hospital.verificationStatus !== 'VERIFIED' && (
                <li className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <span className="leading-relaxed">Some information is unverified. Compare this with verified options for more certainty.</span>
                </li>
              )}
            </ul>
            <div className="mt-6 pt-4 border-t border-indigo-100">
              <Link href="/customer/options" className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1 transition-colors">
                Compare other options 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>

          {/* Data Transparency & Source Disclosure */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Data Transparency
            </h3>
            
            <div className="mb-4">
              <DataOriginBadge origin={hospital.dataOrigin} />
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Source</span>
                <span className="font-medium text-slate-900">{hospital.source}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
                <span className="font-medium text-slate-900 capitalize flex items-center gap-1.5">
                  {hospital.verificationStatus === 'VERIFIED' ? (
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                     <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                  {hospital.verificationStatus.replace('_', ' ').toLowerCase()}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Retrieved</span>
                <span className="font-medium text-slate-900">{new Date(hospital.lastCheckedAt).toLocaleDateString()}</span>
              </div>
              {hospital.accreditation && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Accreditation</span>
                  <span className="font-medium text-slate-900">{hospital.accreditation}</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      <Disclaimer />
    </div>
  );
}
