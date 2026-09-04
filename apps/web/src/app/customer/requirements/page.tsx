'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublishedTreatments } from '../../../features/search/treatmentService';
import { Treatment, PatientRequirements } from '../../../types/models';
import Link from 'next/link';

export default function RequirementsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(true);
  
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [requirements, setRequirements] = useState<PatientRequirements>({});

  useEffect(() => {
    async function loadTreatments() {
      try {
        const data = await getPublishedTreatments();
        setTreatments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTreatments(false);
      }
    }
    loadTreatments();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const handleFinish = () => {
    if (!selectedTreatment) return;
    // Build query params
    const params = new URLSearchParams();
    params.set('treatmentId', selectedTreatment.id!);
    if (requirements.budgetMax) params.set('budgetMax', requirements.budgetMax.toString());
    if (requirements.preferredCity) params.set('city', requirements.preferredCity);
    if (requirements.requiresAccommodation) params.set('accommodation', 'true');
    if (requirements.requiresLocalTransport) params.set('transport', 'true');
    
    router.push(`/customer/options?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Treatment</h1>
        <p className="text-gray-600">Tell us what you need, and we'll show you options.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center mb-8">
        <div>
          <h3 className="font-medium text-blue-900">Prefer to explain what you need?</h3>
          <p className="text-sm text-blue-700">Ask our AI assistant to help you find options.</p>
        </div>
        <Link 
          href="/customer/assistant" 
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          Ask Assistant
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 md:p-8">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 1: What treatment are you looking for?</h2>
            
            {loadingTreatments ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : treatments.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-500">Treatment information is currently being prepared.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {treatments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTreatment(t); handleNext(); }}
                    className={`p-4 rounded border text-left transition-colors ${
                      selectedTreatment?.id === t.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{t.name}</div>
                    {t.description && <div className="text-sm text-gray-500 line-clamp-2 mt-1">{t.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 2: Basic Requirements</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Budget (Max INR)</label>
                <input 
                  type="number"
                  className="w-full border rounded p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 500000"
                  value={requirements.budgetMax || ''}
                  onChange={(e) => setRequirements({...requirements, budgetMax: parseInt(e.target.value) || undefined})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Accompanying People</label>
                <select 
                  className="w-full border rounded p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={requirements.accompanyingPeople || 0}
                  onChange={(e) => setRequirements({...requirements, accompanyingPeople: parseInt(e.target.value)})}
                >
                  <option value={0}>None</option>
                  <option value={1}>1 Person</option>
                  <option value={2}>2 People</option>
                  <option value={3}>3+ People</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} className="text-gray-600 font-medium hover:text-gray-900 px-4 py-2">
                &larr; Back
              </button>
              <button onClick={handleNext} className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                Next Step &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 3: Location & Logistics</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred City (Optional)</label>
                <input 
                  type="text"
                  className="w-full border rounded p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Mumbai, Delhi, Bangalore"
                  value={requirements.preferredCity || ''}
                  onChange={(e) => setRequirements({...requirements, preferredCity: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={!!requirements.requiresAccommodation}
                    onChange={(e) => setRequirements({...requirements, requiresAccommodation: e.target.checked})}
                  />
                  <div>
                    <div className="font-medium text-gray-900">I need accommodation</div>
                    <div className="text-sm text-gray-500">Help me find nearby hotels or places to stay.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={!!requirements.requiresLocalTransport}
                    onChange={(e) => setRequirements({...requirements, requiresLocalTransport: e.target.checked})}
                  />
                  <div>
                    <div className="font-medium text-gray-900">I need local transport</div>
                    <div className="text-sm text-gray-500">Help me with airport transfers or local travel.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} className="text-gray-600 font-medium hover:text-gray-900 px-4 py-2">
                &larr; Back
              </button>
              <button onClick={handleFinish} className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 shadow-sm">
                View Available Options
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
