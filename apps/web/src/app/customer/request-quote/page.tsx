'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { createCase } from '../../../features/cases/caseService';

function QuoteRequestForm() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get('providerId') || '';
  const treatmentId = searchParams.get('treatmentId') || '';
  
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    selectedHospitalId: providerId,
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
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Patient Intake & Quote Request</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 border rounded shadow-sm">
        <div>
           <label className="block text-sm font-medium mb-1">Selected Hospital ID</label>
           <input type="text" name="selectedHospitalId" value={formData.selectedHospitalId} onChange={handleChange} className="w-full border p-2 rounded bg-gray-50" readOnly />
        </div>
        
        <div>
           <label className="block text-sm font-medium mb-1">Treatment Requested</label>
           <input type="text" name="treatmentId" value={formData.treatmentId} onChange={handleChange} className="w-full border p-2 rounded" required placeholder="e.g. Knee Replacement" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Location</label>
             <input type="text" name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. Mumbai, India" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Approximate Budget</label>
             <input type="text" name="budget" value={formData.budget} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. $5000" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Timeline</label>
             <select name="preferredTimeline" value={formData.preferredTimeline} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="">Select Timeline</option>
                <option value="Urgent (1-2 weeks)">Urgent (1-2 weeks)</option>
                <option value="1 month">Within 1 month</option>
                <option value="3 months">1-3 months</option>
                <option value="Flexible">Flexible</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Language</label>
             <input type="text" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium mb-1">Short Description / Inquiry</label>
           <textarea name="inquiry" value={formData.inquiry} onChange={handleChange} rows={4} className="w-full border p-2 rounded" placeholder="Describe your condition and requirements briefly..." required></textarea>
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-medium disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

export default function QuoteRequestPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <QuoteRequestForm />
    </ProtectedRoute>
  );
}
