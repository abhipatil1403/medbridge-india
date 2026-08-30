'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { createCase } from '../../../features/cases/caseService';
import Link from 'next/link';

function QuoteRequestForm() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get('providerId') || '';
  const providerName = searchParams.get('providerName') || '';
  const treatmentId = searchParams.get('treatmentId') || '';
  
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    selectedHospitalId: providerId,
    providerName: providerName,
    treatmentId: treatmentId,
    preferredLocation: '',
    budget: '',
    preferredTimeline: '',
    inquiry: '',
    preferredLanguage: 'English'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setError('');
    
    try {
      const caseId = await createCase(currentUser.uid, formData);
      router.push(`/customer/cases/${caseId}`);
    } catch (err) {
      console.error(err);
      setError('Unable to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Link href="/customer/search" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Search
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Request a Treatment Quote</h1>
        <p className="text-gray-600 mb-6">Our support team will review your inquiry and connect with the provider.</p>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-2">
            <h3 className="font-semibold text-blue-900 mb-3">Selected Provider</h3>
            {providerName ? (
              <div>
                <p className="text-lg font-bold text-blue-800">{providerName}</p>
                <input type="hidden" name="selectedHospitalId" value={formData.selectedHospitalId} />
                <input type="hidden" name="providerName" value={formData.providerName} />
              </div>
            ) : (
              <p className="text-sm text-blue-700">No specific provider selected. Our team will help you find the best option.</p>
            )}
          </div>
          
          <div>
             <label className="block text-sm font-medium mb-1 text-gray-700">Treatment Needed *</label>
             <input type="text" name="treatmentId" value={formData.treatmentId} onChange={handleChange} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500" required placeholder="e.g. Knee Replacement" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium mb-1 text-gray-700">Preferred Location</label>
               <input type="text" name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Mumbai, India" />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1 text-gray-700">Approximate Budget</label>
               <input type="text" name="budget" value={formData.budget} onChange={handleChange} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. $5000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium mb-1 text-gray-700">Preferred Timeline</label>
               <select name="preferredTimeline" value={formData.preferredTimeline} onChange={handleChange} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Select Timeline</option>
                  <option value="Urgent (1-2 weeks)">Urgent (1-2 weeks)</option>
                  <option value="1 month">Within 1 month</option>
                  <option value="3 months">1-3 months</option>
                  <option value="Flexible">Flexible</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium mb-1 text-gray-700">Preferred Language</label>
               <input type="text" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-1 text-gray-700">Medical Inquiry *</label>
             <textarea name="inquiry" value={formData.inquiry} onChange={handleChange} rows={5} className="w-full border p-3 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Describe your condition and requirements briefly..." required></textarea>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded font-medium disabled:opacity-50 hover:bg-blue-700 text-lg">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuoteRequestPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <ProtectedRoute allowedRoles={['CUSTOMER']}>
        <QuoteRequestForm />
      </ProtectedRoute>
    </Suspense>
  );
}
