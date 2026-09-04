import React from 'react';
import Link from 'next/link';
import { TreatmentOption } from '../features/search/providerOptionsService';

interface OptionCardProps {
  option: TreatmentOption;
  isSelectedForCompare: boolean;
  onToggleCompare: (id: string, isSelected: boolean) => void;
}

export default function OptionCard({ option, isSelectedForCompare, onToggleCompare }: OptionCardProps) {
  const { provider, service, matchScore, matchReasons } = option;

  if (!provider) return null;

  return (
    <div className="bg-white border rounded-lg p-5 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        
        <div className="flex gap-4 w-full">
          <div className="pt-1">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              checked={isSelectedForCompare}
              onChange={(e) => onToggleCompare(service.id!, e.target.checked)}
              title="Select for comparison"
            />
          </div>
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
              {provider.careType && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {provider.careType}
                </span>
              )}
            </div>
            
            <div className="text-gray-600 text-sm mb-3">
              {provider.city ? provider.city : 'Location not available'}
              {provider.state ? `, ${provider.state}` : ''}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Treatment & Cost</div>
                <div className="text-sm text-gray-600 mt-1">
                  {service.treatmentName || 'Service available'}
                </div>
                {(service.estimatedCostMin || service.estimatedCostMax) ? (
                  <div className="text-sm font-medium text-green-700 mt-1">
                    Estimated: {service.currency || 'INR'} {service.estimatedCostMin || 0} - {service.estimatedCostMax || 0}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-1">Cost estimate not available</div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900">Logistics & Proximity</div>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>
                    Nearest Airport: {provider.nearestAirportId || 'Not specified'}
                  </li>
                  <li>
                    Local Transport: {provider.localTransportAvailability ? 'Available' : 'Not specified'}
                  </li>
                  <li>
                    Accommodation: {provider.accommodationReferences?.length ? `${provider.accommodationReferences.length} options listed` : 'Not specified'}
                  </li>
                </ul>
              </div>
            </div>

            {matchReasons && matchReasons.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-3">
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Requirement Match</div>
                <div className="flex flex-wrap gap-1">
                  {matchReasons.map((reason: string, idx: number) => (
                    <span key={idx} className="bg-white text-blue-700 text-xs px-2 py-1 rounded shadow-sm">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
          <Link href={`/customer/providers/${provider.id}`} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 text-center shadow-sm">
            View Details
          </Link>
          <button className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 text-center flex items-center justify-center gap-1">
            <span>☆</span> Shortlist
          </button>
        </div>
      </div>
    </div>
  );
}
