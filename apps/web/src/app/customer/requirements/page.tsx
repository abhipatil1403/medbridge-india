'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublishedTreatments } from '../../../features/search/treatmentService';
import { Treatment, PatientRequirements } from '../../../types/models';
import Link from 'next/link';
import { Disclaimer } from '../../../components/Disclaimer';

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
    const params = new URLSearchParams();
    params.set('treatmentId', selectedTreatment.id!);
    if (requirements.budgetMax) params.set('budgetMax', requirements.budgetMax.toString());
    if (requirements.preferredCity) params.set('city', requirements.preferredCity);
    if (requirements.requiresAccommodation) params.set('accommodation', 'true');
    if (requirements.requiresLocalTransport) params.set('transport', 'true');
    
    router.push(`/customer/options?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Find Your Treatment</h1>
        <p className="text-slate-600">Tell us what you need, and we'll show you publicly available options. MedBridge does not provide medical advice or diagnoses.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-indigo-900 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Prefer to explain what you need?
          </h3>
          <p className="text-sm text-indigo-700">Ask our AI planning assistant to help you define your requirements.</p>
        </div>
        <Link 
          href="/customer/assistant" 
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shrink-0 shadow-sm text-sm w-full sm:w-auto text-center"
        >
          Ask Planning Assistant
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
        
        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
          <div className={`h-1 flex-1 mx-2 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
          <div className={`h-1 flex-1 mx-2 rounded ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-6">What treatment or healthcare service are you looking for?</h2>
            
            {loadingTreatments ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : treatments.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Treatment information is currently being prepared.</p>
                <p className="text-slate-400 text-sm mt-2">Check back later or contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {treatments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTreatment(t); handleNext(); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedTreatment?.id === t.id 
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    {t.description && <div className="text-sm text-slate-500 line-clamp-2 mt-1.5">{t.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Basic Preferences</h2>
            <p className="text-sm text-slate-500 mb-6">These preferences help us show relevant options. They do not determine which provider you should choose.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approximate Budget (Max INR)</label>
                <input 
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                  placeholder="e.g. 500000"
                  value={requirements.budgetMax || ''}
                  onChange={(e) => setRequirements({...requirements, budgetMax: parseInt(e.target.value) || undefined})}
                />
                <p className="text-xs text-slate-500 mt-1.5">All costs shown later will be estimates only, not guaranteed prices.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Number of Accompanying People</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow outline-none"
                    value={requirements.accompanyingPeople || 0}
                    onChange={(e) => setRequirements({...requirements, accompanyingPeople: parseInt(e.target.value)})}
                  >
                    <option value={0}>Traveling alone</option>
                    <option value={1}>1 Person</option>
                    <option value={2}>2 People</option>
                    <option value={3}>3+ People</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Travel Dates</label>
                   <select className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow outline-none">
                    <option value="flexible">Flexible</option>
                    <option value="1month">Within 1 month</option>
                    <option value="3months">Within 3 months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
              <button onClick={handleBack} className="text-slate-500 font-medium hover:text-slate-800 px-2 py-2 transition-colors">
                &larr; Back
              </button>
              <button onClick={handleNext} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Location & Logistics</h2>
            <p className="text-sm text-slate-500 mb-6">Would you like help with your trip? This helps us highlight options with good travel access.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred City (Optional)</label>
                <input 
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                  placeholder="e.g. Mumbai, Delhi, Bangalore"
                  value={requirements.preferredCity || ''}
                  onChange={(e) => setRequirements({...requirements, preferredCity: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${requirements.requiresAccommodation ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    checked={!!requirements.requiresAccommodation}
                    onChange={(e) => setRequirements({...requirements, requiresAccommodation: e.target.checked})}
                  />
                  <div>
                    <div className="font-semibold text-slate-900">I need accommodation assistance</div>
                    <div className="text-sm text-slate-500">Prioritize options that list nearby hotels or serviced apartments.</div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${requirements.requiresLocalTransport ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    checked={!!requirements.requiresLocalTransport}
                    onChange={(e) => setRequirements({...requirements, requiresLocalTransport: e.target.checked})}
                  />
                  <div>
                    <div className="font-semibold text-slate-900">I need local transport assistance</div>
                    <div className="text-sm text-slate-500">Prioritize options near airports or with reliable local travel.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
              <button onClick={handleBack} className="text-slate-500 font-medium hover:text-slate-800 px-2 py-2 transition-colors">
                &larr; Back
              </button>
              <button onClick={handleFinish} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                View Available Options
              </button>
            </div>
          </div>
        )}

      </div>
      
      <Disclaimer compact />
    </div>
  );
}
