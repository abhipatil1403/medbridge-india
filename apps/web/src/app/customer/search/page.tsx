'use client';

import React, { useState } from 'react';
import { searchProviders } from '../../../features/search/searchService';
import { Hospital } from '../../../types/models';
import Link from 'next/link';

export default function SearchPage() {
  const [treatment, setTreatment] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchProviders(treatment, specialty, location);
      setResults(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search Providers</h1>
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
        <input 
          placeholder="What treatment are you looking for?" 
          value={treatment} 
          onChange={(e) => setTreatment(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input 
          placeholder="Specialty (e.g. Orthopedics)" 
          value={specialty} 
          onChange={(e) => setSpecialty(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input 
          placeholder="Where? (e.g. Mumbai)" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div>
        {loading && <p>Loading...</p>}
        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded">
            <p>No matching providers are currently available in our platform data.</p>
            <button onClick={() => setHasSearched(false)} className="text-blue-600 mt-2">Change Filters</button>
          </div>
        )}
        {!loading && results.map(hospital => (
          <div key={hospital.id} className="border p-4 rounded mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{hospital.name}</h2>
              <p className="text-gray-600">{hospital.city}</p>
              <p className="text-sm mt-1">Specialties: {hospital.specialties.join(', ')}</p>
            </div>
            <Link href={`/customer/providers/${hospital.id}`} className="bg-gray-100 px-4 py-2 rounded text-blue-600">
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
