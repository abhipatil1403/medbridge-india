import React from 'react';
import Link from 'next/link';
import { TreatmentOption } from '../features/search/providerOptionsService';
import { Badge } from './Badge';
import { DataOriginBadge } from './DataOriginBadge';

interface OptionCardProps {
  option: TreatmentOption;
  isSelectedForCompare: boolean;
  onToggleCompare: (id: string, isSelected: boolean) => void;
}

export default function OptionCard({ option, isSelectedForCompare, onToggleCompare }: OptionCardProps) {
  const { provider, service, matchScore, matchReasons } = option;

  if (!provider) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        
        <div className="flex gap-4 w-full">
          <div className="pt-1.5 shrink-0">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer transition-shadow"
              checked={isSelectedForCompare}
              onChange={(e) => onToggleCompare(service.id!, e.target.checked)}
              title="Select for comparison"
            />
          </div>
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-3 mb-1.5">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                <Link href={`/customer/providers/${provider.id}`}>{provider.name}</Link>
              </h3>
              {provider.providerType && (
                <Badge variant="info">{provider.providerType}</Badge>
              )}
              {provider.careType && (
                <Badge variant="outline">{provider.careType}</Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {provider.rating ? (
                <div className="flex items-center gap-1.5 font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {provider.rating} 
                  <span className="text-slate-500 font-normal ml-0.5">
                    ({provider.reviewCount || 0} reviews via {provider.ratingSource || 'Public records'})
                  </span>
                </div>
              ) : (
                <div className="text-slate-500 italic px-2 py-1 bg-slate-50 rounded border border-slate-100">Public rating unavailable</div>
              )}
              <div className="text-slate-600 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {provider.city ? provider.city : 'Location not available'}
                {provider.state ? `, ${provider.state}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Treatment & Estimated Cost</div>
                <div className="text-sm font-semibold text-slate-900">
                  {service.treatmentName || 'Service available'}
                </div>
                {(service.estimatedCostMin || service.estimatedCostMax) ? (
                  <div className="text-base font-bold text-emerald-700 mt-1.5 flex items-center gap-2">
                    {service.currency || 'INR'} {service.estimatedCostMin?.toLocaleString() || 0} - {service.estimatedCostMax?.toLocaleString() || 0}
                    <span className="text-[10px] font-normal text-slate-500 px-1.5 py-0.5 bg-white border border-slate-200 rounded">Estimate</span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 mt-1.5 italic">Cost estimate not available</div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logistics & Proximity</div>
                <ul className="text-sm space-y-2">
                  <li className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-600">Nearest Airport:</span>
                    <span className={`font-medium ${provider.nearestAirportId ? "text-slate-900" : "text-slate-400 italic"}`}>{provider.nearestAirportId || 'Unknown'}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-600">Local Transport:</span>
                    <span className={`font-medium ${provider.localTransportAvailability ? "text-emerald-700" : "text-slate-400 italic"}`}>{provider.localTransportAvailability ? 'Information Available' : 'Unknown'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-600">Accommodation:</span>
                    <span className={`font-medium ${provider.accommodationReferences?.length ? "text-indigo-700" : "text-slate-400 italic"}`}>{provider.accommodationReferences?.length ? `${provider.accommodationReferences.length} options listed` : 'Unknown'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {matchReasons && matchReasons.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Why this option appears</div>
                <div className="flex flex-wrap gap-2">
                  {matchReasons.map((reason: string, idx: number) => {
                    const isPositive = reason.startsWith('✓');
                    const isWarning = reason.startsWith('△');
                    let colorClass = "bg-white text-slate-700 border border-slate-200";
                    let Icon = null;
                    
                    if (isPositive) {
                      colorClass = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                      Icon = <svg className="w-3.5 h-3.5 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
                      reason = reason.substring(2);
                    } else if (isWarning) {
                      colorClass = "bg-amber-50 text-amber-800 border border-amber-200";
                      Icon = <svg className="w-3.5 h-3.5 mr-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
                      reason = reason.substring(2);
                    }
                    
                    return (
                      <span key={idx} className={`${colorClass} text-xs font-medium px-2.5 py-1 rounded-md flex items-center shadow-sm`}>
                        {Icon}
                        {reason}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <DataOriginBadge origin={provider.dataOrigin} />
                  {matchScore !== undefined && (
                    <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100">
                      Preference Match: <span className="text-slate-800 font-bold">{matchScore}%</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-40 md:pt-1">
          <Link href={`/customer/providers/${provider.id}`} className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 text-center shadow-sm transition-all">
            View Details
          </Link>
          <button className="flex-1 md:flex-none px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 text-center flex items-center justify-center gap-1.5 transition-all shadow-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            Shortlist
          </button>
        </div>
      </div>
    </div>
  );
}
