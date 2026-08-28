'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminProviderService } from '../../../features/admin/adminProviderService';
import { Hospital } from '../../../types/models';

export default function ProvidersListPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminProviderService.getHospitals();
        setHospitals(data);
      } catch (err) {
        console.error('Failed to load hospitals', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Hospitals</h1>
          <p className="mt-2 text-sm text-gray-500">
            A list of all hospitals in the platform including their status and location.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/providers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Hospital
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="px-6 py-4 text-center text-sm text-gray-500">Loading hospitals...</li>
          ) : hospitals.length === 0 ? (
            <li className="px-6 py-4 text-center text-sm text-gray-500">No hospitals found.</li>
          ) : (
            hospitals.map((hospital) => (
              <li key={hospital.id}>
                <Link href={`/admin/providers/${hospital.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{hospital.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${hospital.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                            hospital.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {hospital.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {hospital.city}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Updated {new Date(hospital.lastCheckedAt || new Date()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
