'use client';

import React, { useState } from 'react';
import EmptyState from '../../../components/EmptyState';

export default function ProviderProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Hospital Profile</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Provider Name</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-900" disabled={!isEditing} defaultValue="Example Hospital" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Provider Type</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-900 bg-gray-50" disabled value="HOSPITAL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-900" disabled={!isEditing} placeholder="+91 XXXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <input type="email" className="w-full border rounded p-2 text-sm text-gray-900" disabled={!isEditing} placeholder="contact@hospital.com" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Logistics (Patient Information)</h2>
        <p className="text-sm text-gray-500 mb-4">This information helps patients plan their travel and stay.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Nearest Airport Code</label>
            <input type="text" className="w-full border rounded p-2 text-sm text-gray-900" disabled={!isEditing} placeholder="e.g. BOM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Local Transport Availability</label>
            <select className="w-full border rounded p-2 text-sm text-gray-900" disabled={!isEditing}>
              <option value="true">Available (Taxis, Cabs nearby)</option>
              <option value="false">Not reliably available</option>
            </select>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 shadow-sm">
              Submit Changes for Review
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
        <strong>Note:</strong> Profile changes are not published immediately. They enter a <code>PENDING_REVIEW</code> state and must be verified by a MedBridge admin to maintain data integrity.
      </div>
    </div>
  );
}
