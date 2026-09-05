'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { Badge } from '../../components/Badge';

export default function ProviderDashboardPage() {
  const { userProfile } = useAuth();
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Provider Dashboard</h1>
        <p className="text-slate-600 font-medium">
          Welcome back, {userProfile?.displayName || userProfile?.email}. Manage your presence on MedBridge.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Profile Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-lg font-bold text-slate-900">Profile Status</h3>
            <Badge variant="warning">80% Complete</Badge>
          </div>
          <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed relative z-10">
            Your public profile is missing some logistical details like local transport availability and accommodation references. 
          </p>
          <div className="mt-auto relative z-10">
            <Link href="/provider/profile" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
              Complete your profile <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>

        {/* Services Listed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="text-lg font-bold text-slate-900">Services Listed</h3>
            <span className="text-3xl font-black text-indigo-700">12</span>
          </div>
          <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed relative z-10">
            You have 12 treatments listed. <strong>1</strong> requires cost verification updates.
          </p>
          <div className="mt-auto relative z-10">
            <Link href="/provider/services" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
              Manage services <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>

        {/* Patient Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="text-lg font-bold text-slate-900">Patient Requests</h3>
            <span className="text-3xl font-black text-emerald-700">3</span>
          </div>
          <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed relative z-10">
            You have 3 new patient contact requests pending quote preparation.
          </p>
          <div className="mt-auto relative z-10">
            <Link href="/provider/requests" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
              View requests <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>

      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
         <h2 className="text-lg font-bold text-slate-900 mb-2">Provider Guidelines</h2>
         <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5 font-medium">
            <li>Ensure all treatment costs are accurate estimates based on public or verified internal data.</li>
            <li>Respond to patient requests within 48 hours to maintain a high provider responsiveness score.</li>
            <li>Update your profile with accurate logistics (nearest airport, transport) to help patients plan their travel.</li>
         </ul>
      </div>
    </div>
  );
}
