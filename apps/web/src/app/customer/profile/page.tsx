'use client';

import React from 'react';
import { useAuth } from '../../../components/AuthProvider';

export default function ProfilePage() {
  const { userProfile } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
            <div className="text-gray-900 font-medium">{userProfile?.displayName || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <div className="text-gray-900 font-medium">{userProfile?.email}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Travel Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">We do not store permanent medical records. Travel preferences are saved to make planning easier.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Country of Origin</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-700" placeholder="e.g. United Kingdom" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Dietary Preferences</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-700" placeholder="e.g. Vegetarian, Halal" disabled />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded font-medium cursor-not-allowed">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
