'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';

export default function ProviderServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Services</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the treatments and estimated costs displayed to patients.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700">
          Request New Service
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Cost</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Coronary Artery Bypass Grafting (CABG)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹ 350,000 - ₹ 500,000</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Published</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900">Request Edit</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Heart Valve Replacement</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹ 400,000 - ₹ 650,000</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Review</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-gray-400 cursor-not-allowed" disabled>Under Review</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 mt-4">
        <strong>Note:</strong> Service cost updates are not published immediately. They enter a <code>PENDING_REVIEW</code> state and must be verified by a MedBridge admin. MedBridge never guarantees exact costs to patients, only estimates.
      </div>
    </div>
  );
}
