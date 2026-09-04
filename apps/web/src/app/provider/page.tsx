'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function ProviderDashboardPage() {
  const { userProfile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Provider Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, {userProfile?.displayName || userProfile?.email}. Here is your account overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Profile Status</h3>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
              80% Complete
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Your public profile is missing some logistical details like local transport availability and accommodation references. 
          </p>
          <Link href="/provider/profile" className="text-sm font-medium text-blue-600 hover:underline">
            Complete your profile &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Services Listed</h3>
            <span className="text-2xl font-bold text-gray-900">12</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            You have 12 treatments/services listed on MedBridge. 1 requires cost verification.
          </p>
          <Link href="/provider/services" className="text-sm font-medium text-blue-600 hover:underline">
            Manage services &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Patient Requests</h3>
            <span className="text-2xl font-bold text-gray-900">3</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            You have 3 new patient contact requests pending.
          </p>
          <Link href="/provider/requests" className="text-sm font-medium text-blue-600 hover:underline">
            View requests &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
