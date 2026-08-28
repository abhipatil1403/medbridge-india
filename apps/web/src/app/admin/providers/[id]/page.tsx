'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminProviderService } from '../../../../features/admin/adminProviderService';
import { Hospital } from '../../../../types/models';
import { useAuth } from '../../../../components/AuthProvider';

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';
  const router = useRouter();
  const { userProfile, roles } = useAuth();
  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  const isReviewer = roles.includes('DATA_REVIEWER');

  const [hospital, setHospital] = useState<Partial<Hospital>>({
    name: '',
    city: '',
    specialties: [],
    treatments: [],
    status: 'DRAFT',
    source: 'ADMIN_MANUAL',
    verificationStatus: 'UNVERIFIED',
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      async function load() {
        try {
          const data = await adminProviderService.getHospital(params.id);
          if (data) setHospital(data);
          else setError('Hospital not found');
        } catch (err) {
          setError('Failed to load hospital');
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [isNew, params.id]);

  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const newId = await adminProviderService.createHospital(hospital as Omit<Hospital, 'id'>, userProfile.uid, userProfile.primaryRole);
        router.push(`/admin/providers/${newId}`);
      } else {
        await adminProviderService.updateHospital(params.id, hospital, userProfile.uid, userProfile.primaryRole);
        alert('Saved successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    setError('');
    try {
      await adminProviderService.publishHospital(params.id, userProfile.uid, userProfile.primaryRole);
      setHospital(prev => ({ ...prev, status: 'PUBLISHED' }));
      alert('Published successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    setError('');
    try {
      await adminProviderService.unpublishHospital(params.id, userProfile.uid, userProfile.primaryRole);
      setHospital(prev => ({ ...prev, status: 'DRAFT' }));
      alert('Unpublished successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">
            {isNew ? 'New Hospital' : hospital.name}
          </h1>
          {!isNew && (
            <p className="mt-2 text-sm text-gray-500">
              Status: <span className="font-semibold">{hospital.status}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/admin/providers')}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          {(isAdmin || isReviewer) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          {!isNew && isAdmin && hospital.status !== 'PUBLISHED' && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {!isNew && isAdmin && hospital.status === 'PUBLISHED' && (
            <button
              onClick={handleUnpublish}
              disabled={saving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Public details displayed to customers.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
              <input
                type="text"
                value={hospital.name || ''}
                onChange={(e) => setHospital({ ...hospital, name: e.target.value })}
                disabled={!(isAdmin || isReviewer)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={hospital.city || ''}
                  onChange={(e) => setHospital({ ...hospital, city: e.target.value })}
                  disabled={!(isAdmin || isReviewer)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specialties (comma separated)</label>
              <input
                type="text"
                value={hospital.specialties?.join(', ') || ''}
                onChange={(e) => setHospital({ ...hospital, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                disabled={!(isAdmin || isReviewer)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Treatments (comma separated)</label>
              <input
                type="text"
                value={hospital.treatments?.join(', ') || ''}
                onChange={(e) => setHospital({ ...hospital, treatments: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                disabled={!(isAdmin || isReviewer)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
