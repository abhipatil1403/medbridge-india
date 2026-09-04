'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';

export default function ProviderRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Contact Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Review and respond to inquiries from MedBridge patients.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {/* Mock Request 1 */}
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded mb-2">NEW</span>
                <h3 className="text-lg font-bold text-gray-900">Reference: MB-PAT-8832</h3>
                <p className="text-sm text-gray-600">Treatment: Coronary Artery Bypass Grafting (CABG)</p>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <div>Requested: Today</div>
                <div>Status: Action Required</div>
              </div>
            </div>
            
            <div className="bg-white border p-3 rounded text-sm text-gray-700 mb-4">
              <strong>Patient Requirements:</strong> Needs cost confirmation and availability for next month. Traveling with 1 companion.
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Provide Quote Estimate</button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50">Decline Request</button>
            </div>
          </div>

        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-6 text-center max-w-2xl mx-auto">
        To protect patient privacy, MedBridge only shares necessary requirements. Direct contact information is not shared until explicitly authorized by the patient. Do not ask for unnecessary medical records through this portal.
      </div>
    </div>
  );
}
