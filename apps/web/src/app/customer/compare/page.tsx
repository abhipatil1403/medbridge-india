'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById } from '../../../features/providers/providerService';
import { Hospital } from '../../../types/models';

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  
  const [providers, setProviders] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      
      const toFetch = ids.slice(0, 3); // Max 3 providers
      try {
        const results = await Promise.all(toFetch.map(id => getHospitalById(id)));
        setProviders(results.filter(r => r !== null) as Hospital[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams]);

  if (loading) {
    return <div className="p-12 text-center">Loading comparison...</div>;
  }

  if (providers.length === 0) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Compare Providers</h1>
        <p className="mb-4 text-gray-600">No providers selected for comparison.</p>
        <Link href="/customer/search" className="text-blue-600 hover:underline">
          Go to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/customer/search" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Search
        </Link>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Compare Providers</h1>
      
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-r bg-gray-50 w-48 shrink-0 font-medium text-gray-700">Features</th>
              {providers.map(p => (
                <th key={`head-${p.id}`} className="p-4 border-b min-w-[250px] align-top bg-white">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h2>
                  <Link href={`/customer/providers/${p.id}`} className="text-sm text-blue-600 hover:underline block mb-2">View Profile</Link>
                  <Link href={`/customer/request-quote?providerId=${p.id}&providerName=${encodeURIComponent(p.name)}`} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded inline-block font-medium hover:bg-blue-700">
                    Request Quote
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Location</td>
              {providers.map(p => (
                <td key={`loc-${p.id}`} className="p-4 border-b align-top">
                  {[p.town, p.city, p.district, p.state].filter(Boolean).join(', ') || 'Not available'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Care Type</td>
              {providers.map(p => (
                <td key={`care-${p.id}`} className="p-4 border-b align-top">{p.careType || '-'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Category</td>
              {providers.map(p => (
                <td key={`cat-${p.id}`} className="p-4 border-b align-top">{p.category || '-'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Specialties</td>
              {providers.map(p => (
                <td key={`spec-${p.id}`} className="p-4 border-b align-top">
                  {p.specialties && p.specialties.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {p.specialties.map(s => <li key={s}>{s}</li>)}
                    </ul>
                  ) : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Facilities</td>
              {providers.map(p => (
                <td key={`fac-${p.id}`} className="p-4 border-b align-top">
                  {p.facilities && p.facilities.length > 0 ? p.facilities.join(', ') : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Emergency Services</td>
              {providers.map(p => (
                <td key={`emg-${p.id}`} className="p-4 border-b align-top">{p.emergencyServices || '-'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Bed Capacity</td>
              {providers.map(p => (
                <td key={`beds-${p.id}`} className="p-4 border-b align-top">{p.beds !== null && p.beds !== undefined ? `${p.beds} beds` : '-'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Systems of Medicine</td>
              {providers.map(p => (
                <td key={`med-${p.id}`} className="p-4 border-b align-top">
                  {p.systemsOfMedicine && p.systemsOfMedicine.length > 0 ? p.systemsOfMedicine.join(', ') : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r bg-gray-50 font-medium text-gray-700">Source</td>
              {providers.map(p => (
                <td key={`src-${p.id}`} className="p-4 border-b align-top text-gray-600">
                  <div className="font-medium text-gray-900">{p.source}</div>
                  <div className="mt-1">Last retrieved: {new Date(p.lastCheckedAt).toLocaleDateString()}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default function CompareProvidersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
