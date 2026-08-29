'use client';

import React, { useState } from 'react';
import { searchProviders, SearchFilters } from '../../../features/search/searchService';
import { Hospital } from '../../../types/models';
import Link from 'next/link';

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const toggleCompare = (id: string, isSelected: boolean) => {
    setSelectedForCompare(prev => {
      if (isSelected) {
        if (prev.length >= 3) {
          alert('You can only compare up to 3 providers at a time.');
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter(i => i !== id);
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchProviders(filters);
      setResults(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setResults([]);
    setHasSearched(false);
  };

  const renderFilterPanel = () => (
    <div className="bg-white p-4 rounded border shadow-sm flex flex-col gap-4">
      <h2 className="font-semibold text-lg border-b pb-2">Filters</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
        <input 
          className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Apollo Hospital"
          value={filters.name || ''}
          onChange={(e) => setFilters({...filters, name: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input 
          className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Maharashtra"
          value={filters.state || ''}
          onChange={(e) => setFilters({...filters, state: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
        <input 
          className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Pune"
          value={filters.district || ''}
          onChange={(e) => setFilters({...filters, district: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City / Town</label>
        <input 
          className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Pune"
          value={filters.city || ''}
          onChange={(e) => setFilters({...filters, city: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Care Type</label>
        <select 
          className="w-full border rounded p-2 text-sm"
          value={filters.careType || ''}
          onChange={(e) => setFilters({...filters, careType: e.target.value})}
        >
          <option value="">Any Care Type</option>
          <option value="Hospital">Hospital</option>
          <option value="Dispensary">Dispensary</option>
          <option value="Community Health Center">Community Health Center</option>
          <option value="Primary Health Center">Primary Health Center</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
        <input 
          className="w-full border rounded p-2 text-sm"
          placeholder="e.g. Cardiology"
          value={filters.specialty || ''}
          onChange={(e) => setFilters({...filters, specialty: e.target.value})}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => handleSearch()} 
          className="flex-1 bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Apply Filters'}
        </button>
        <button 
          onClick={clearFilters}
          className="flex-1 bg-gray-100 text-gray-700 p-2 rounded text-sm font-medium hover:bg-gray-200"
        >
          Clear
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Find a Healthcare Provider</h1>
        <button 
          className="md:hidden bg-gray-100 px-4 py-2 rounded text-sm font-medium"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar for Desktop / Drawer for Mobile */}
        <div className={`md:w-1/4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          {renderFilterPanel()}
        </div>

        {/* Results Area */}
        <div className="md:w-3/4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-lg font-medium text-gray-700">
              {hasSearched ? `Found ${results.length} published providers` : 'Enter search criteria to begin'}
            </h2>
            {selectedForCompare.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-blue-800">{selectedForCompare.length} selected</span>
                <Link 
                  href={`/customer/compare?ids=${selectedForCompare.join(',')}`} 
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Compare &rarr;
                </Link>
                <button onClick={() => setSelectedForCompare([])} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Clear
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No published providers match your search.</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
              <button onClick={clearFilters} className="text-blue-600 font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          )}

          {!loading && results.map(hospital => (
            <div key={hospital.id} className="bg-white border rounded-lg p-5 mb-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="pt-1 hidden md:block">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={selectedForCompare.includes(hospital.id!)}
                      onChange={(e) => toggleCompare(hospital.id!, e.target.checked)}
                      title="Select for comparison"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 md:hidden text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        checked={selectedForCompare.includes(hospital.id!)}
                        onChange={(e) => toggleCompare(hospital.id!, e.target.checked)}
                      />
                      <h3 className="text-xl font-bold text-gray-900">{hospital.name}</h3>
                    </div>
                    
                    <div className="mt-1 text-gray-600 flex flex-wrap gap-2 text-sm">
                      {hospital.town && <span>{hospital.town},</span>}
                      {(!hospital.town && hospital.city) && <span>{hospital.city},</span>}
                      {hospital.district && <span>{hospital.district},</span>}
                      {hospital.state && <span>{hospital.state}</span>}
                      {(!hospital.town && !hospital.city && !hospital.district && !hospital.state) && <span>Location information not available</span>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {hospital.careType && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {hospital.careType}
                        </span>
                      )}
                      {hospital.category && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          {hospital.category}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Published Source
                      </span>
                    </div>

                    {hospital.specialties && hospital.specialties.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Specialties:</span> {hospital.specialties.slice(0, 3).join(', ')}
                        {hospital.specialties.length > 3 && ` +${hospital.specialties.length - 3} more`}
                      </div>
                    )}

                    {hospital.facilities && hospital.facilities.length > 0 && (
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Facilities:</span> {hospital.facilities.slice(0, 3).join(', ')}
                        {hospital.facilities.length > 3 && ` +${hospital.facilities.length - 3} more`}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 ml-4">
                  <Link href={`/customer/providers/${hospital.id}`} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 text-center shadow-sm">
                    View Profile
                  </Link>
                  <Link href={`/customer/request-quote?providerId=${hospital.id}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 text-center">
                    Request Quote
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
