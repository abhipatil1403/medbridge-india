'use client';

import React, { useEffect, useState } from 'react';
import { getHospitalById, getCostEstimatesByHospital } from '../../../../features/providers/providerService';
import { Hospital, CostEstimate } from '../../../../types/models';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';

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
    if (!isAuthenticated) {
      router.push(`/login?redirect=/customer/request-quote?providerId=${id}${treatmentId ? `&treatmentId=${treatmentId}` : ''}`);
    } else {
      router.push(`/customer/request-quote?providerId=${id}${treatmentId ? `&treatmentId=${treatmentId}` : ''}`);
    }
  };

  if (loading) return <div className="p-4">Loading provider profile...</div>;
  if (!hospital) return <div className="p-4">Provider not found or not published.</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white border rounded p-6 shadow-sm mb-6">
        <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
        <p className="text-gray-600 text-lg mb-4">{hospital.city}</p>
        
        <div className="flex gap-4 mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {hospital.accreditation || 'Unaccredited'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded text-sm mb-6 border">
          <h3 className="font-semibold mb-1">Provenance Indicator</h3>
          <p>Source: {hospital.source} | Status: {hospital.verificationStatus}</p>
          <p>Last checked: {hospital.lastCheckedAt}</p>
        </div>

        <h2 className="text-xl font-semibold mt-6 mb-3">Treatments & Estimated Costs</h2>
        <p className="text-xs text-gray-500 mb-4">Costs shown are estimates based on available platform data and are not a binding quote.</p>
        
        {estimates.length === 0 ? <p>No estimates available.</p> : (
          <div className="grid gap-4">
            {estimates.map(est => (
              <div key={est.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{est.treatmentName}</h3>
                  <p className="text-lg text-green-700 font-medium">
                    {est.currency} {est.minAmount.toLocaleString()} - {est.maxAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Source: {est.source} | Status: {est.verificationStatus}</p>
                </div>
                <button 
                  onClick={() => handleRequestQuote(est.treatmentId)} 
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
           <button onClick={() => handleRequestQuote()} className="bg-blue-600 text-white px-6 py-3 rounded font-medium text-lg w-full md:w-auto">
            Request Quote for Other Treatment
          </button>
        </div>
      </div>
    </div>
  );
}
