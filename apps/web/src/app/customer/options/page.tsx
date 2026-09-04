'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTreatmentOptions, TreatmentOption } from '../../../features/search/providerOptionsService';
import OptionCard from '../../../components/OptionCard';
import Link from 'next/link';

function OptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [options, setOptions] = useState<TreatmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Options matching your requirements</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Based on the information available. MedBridge provides informational comparisons and general guidance. It does not provide medical advice.
          </p>
        </div>
        
        <Link href="/customer/requirements" className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Change Requirements
        </Link>
      </div>
      
      {/* Compare Action Bar */}
      {selectedForCompare.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center shadow-sm">
          <div className="text-sm text-blue-900 font-medium">
            {selectedForCompare.length} option{selectedForCompare.length !== 1 ? 's' : ''} selected for comparison
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setSelectedForCompare([])} 
              className="text-sm text-blue-600 hover:underline"
            >
              Clear
            </button>
            <button 
              onClick={handleCompareClick}
              className={`text-sm px-4 py-2 rounded font-medium shadow-sm transition-colors ${
                selectedForCompare.length >= 2 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Compare Options
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : options.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No options are currently available for this treatment.</h3>
          <p className="text-gray-500 mb-4">We might not have verified providers matching your exact requirements yet.</p>
          <Link href="/customer/requirements" className="text-blue-600 font-medium hover:underline">
            Go back and adjust your requirements
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {options.map((option) => (
            <OptionCard 
              key={option.service.id} 
              option={option} 
              isSelectedForCompare={selectedForCompare.includes(option.service.id!)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <OptionsContent />
    </Suspense>
  );
}
