'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminProviderService } from '../../../../features/admin/adminProviderService';
import { useAuth } from '../../../../components/AuthProvider';

export default function NewDoctorPage() {
  const router = useRouter();
  const { currentUser, primaryRole } = useAuth();
  
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [treatments, setTreatments] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) {
      setError('Doctor Name and City are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminProviderService.createDoctor({
        name,
        city,
        state: state || null,
        specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
        treatments: treatments.split(',').map(t => t.trim()).filter(Boolean),
        experienceYears: experience ? parseInt(experience, 10) : 0,
        qualifications: [],
        associatedHospitals: hospitalId ? [hospitalId] : [],
        languages: [],
        status: 'DRAFT',
        source: 'MANUAL',
        verificationStatus: 'VERIFIED',
        lastCheckedAt: new Date().toISOString(),
        providerType: 'DOCTOR',
      }, currentUser?.uid || 'admin', primaryRole || 'ADMIN');
      
      router.push('/admin/doctors');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Doctor</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6 border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
          <input 
            type="text" 
            required
            placeholder="Dr. John Doe"
            className="w-full border border-gray-300 rounded-md p-2" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-md p-2" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md p-2" 
              value={state} 
              onChange={(e) => setState(e.target.value)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input 
              type="number" 
              placeholder="15"
              className="w-full border border-gray-300 rounded-md p-2" 
              value={experience} 
              onChange={(e) => setExperience(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Associated Hospital ID</label>
            <input 
              type="text" 
              placeholder="Hospital Document ID"
              className="w-full border border-gray-300 rounded-md p-2" 
              value={hospitalId} 
              onChange={(e) => setHospitalId(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma-separated)</label>
          <input 
            type="text" 
            placeholder="Cardiology, Cardiac Surgery"
            className="w-full border border-gray-300 rounded-md p-2" 
            value={specialties} 
            onChange={(e) => setSpecialties(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatments (comma-separated)</label>
          <input 
            type="text" 
            placeholder="Angioplasty, Pacemaker Implantation"
            className="w-full border border-gray-300 rounded-md p-2" 
            value={treatments} 
            onChange={(e) => setTreatments(e.target.value)} 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create Doctor (Draft)'}
          </button>
        </div>
      </form>
    </div>
  );
}
