'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTreatmentOptions, TreatmentOption } from '../../../features/search/providerOptionsService';
import OptionCard from '../../../components/OptionCard';
import Link from 'next/link';
import { Disclaimer } from '../../../components/Disclaimer';

type SortOption = 'match' | 'priceAsc' | 'ratingDesc';

function OptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [options, setOptions] = useState<TreatmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [filterType, setFilterType] = useState<string>('ALL');

  const treatmentId = searchParams.get('treatmentId');

  useEffect(() => {
    if (!treatmentId) {
      router.replace('/customer/requirements');
      return;
    }

    async function loadOptions() {
      try {
        const filters = {
          treatmentId: treatmentId as string,
          budgetMax: searchParams.has('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined,
          city: searchParams.get('city') || undefined,
          accommodation: searchParams.get('accommodation') === 'true',
          transport: searchParams.get('transport') === 'true',
        };
        const results = await getTreatmentOptions(filters);
        setOptions(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, [searchParams, treatmentId, router]);

  const toggleCompare = (id: string, isSelected: boolean) => {
    setSelectedForCompare(prev => {
      if (isSelected) {
        if (prev.length >= 3) {
          alert('You can only compare up to 3 options at a time.');
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter(i => i !== id);
    });
  };

  const handleCompareClick = () => {
    if (selectedForCompare.length < 2) {
      alert('Please select at least 2 options to compare.');
      return;
    }
    router.push(`/customer/compare?serviceIds=${selectedForCompare.join(',')}`);
  };

  // Client-side filtering & sorting
  const processedOptions = useMemo(() => {
    let filtered = options;
    
    if (filterType !== 'ALL') {
      filtered = filtered.filter(opt => opt.provider?.providerType === filterType);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'match') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      } else if (sortBy === 'priceAsc') {
        const aCost = a.service.estimatedCostMin || 999999999;
        const bCost = b.service.estimatedCostMin || 999999999;
        return aCost - bCost;
      } else if (sortBy === 'ratingDesc') {
        const aRating = a.provider?.rating || 0;
        const bRating = b.provider?.rating || 0;
        return bRating - aRating;
      }
      return 0;
    });
  }, [options, sortBy, filterType]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Available Options</h1>
          <p className="text-slate-600 mt-2 text-sm max-w-2xl">
            These options are shown based on the preferences you provided. They are <strong>not medical recommendations</strong>. MedBridge does not select a provider for you.
          </p>
        </div>
        
        <Link href="/customer/requirements" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg shrink-0 transition-colors">
          &larr; Change Requirements
        </Link>
      </div>
      
      {/* Compare Action Bar - Fixed at bottom on mobile, sticky on desktop */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:sticky md:top-20 z-40 p-4 md:p-0 md:mb-6 pointer-events-none">
          <div className="max-w-6xl mx-auto pointer-events-auto">
            <div className="bg-indigo-600 border border-indigo-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center shadow-xl gap-4">
              <div className="text-sm text-indigo-50 font-medium">
                <span className="bg-indigo-800 text-white px-2 py-1 rounded font-bold mr-2">{selectedForCompare.length} / 3</span>
                option{selectedForCompare.length !== 1 ? 's' : ''} selected for comparison
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedForCompare([])} 
                  className="text-sm text-indigo-200 hover:text-white px-3 py-2 flex-1 sm:flex-none text-center"
                >
                  Clear
                </button>
                <button 
                  onClick={handleCompareClick}
                  className={`text-sm px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex-1 sm:flex-none text-center ${
                    selectedForCompare.length >= 2 
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50' 
                      : 'bg-indigo-500 text-indigo-300 cursor-not-allowed'
                  }`}
                >
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Finding matching options based on public data...</p>
        </div>
      ) : options.length === 0 ? (
        <div className="text-center p-16 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto mt-10">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No options found</h3>
          <p className="text-slate-500 mb-6 leading-relaxed">We currently don't have publicly verified options matching your exact requirements. Try adjusting your budget or preferred city.</p>
          <Link href="/customer/requirements" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition-all">
            Adjust Requirements
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters & Sorting Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Sort & Filter
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
                  <select 
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="match">Closest Match to Preferences</option>
                    <option value="priceAsc">Lowest Estimated Cost</option>
                    <option value="ratingDesc">Highest Public Rating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provider Type</label>
                  <select 
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="HOSPITAL">Hospitals Only</option>
                    <option value="CLINIC">Clinics Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 space-y-4">
            <div className="text-sm font-medium text-slate-500 mb-2">
              Showing {processedOptions.length} available option{processedOptions.length !== 1 ? 's' : ''}
            </div>
            {processedOptions.map((option) => (
              <OptionCard 
                key={option.service.id} 
                option={option} 
                isSelectedForCompare={selectedForCompare.includes(option.service.id!)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        </div>
      )}
      
      {!loading && options.length > 0 && <Disclaimer className="mt-8" />}
    </div>
  );
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <OptionsContent />
    </Suspense>
  );
}
