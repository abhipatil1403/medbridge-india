'use client';

import React, { useEffect, useState } from 'react';
import { adminProviderService } from '../../features/admin/adminProviderService';
import { adminVerificationService } from '../../features/admin/adminVerificationService';
import { adminComplianceService } from '../../features/admin/adminComplianceService';
import Link from 'next/link';
import { Badge } from '../../components/Badge';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    publishedHospitals: 0,
    draftHospitals: 0,
    publishedDoctors: 0,
    pendingVerifications: 0,
    pendingCompliance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [hospitals, doctors, verifications, compliance] = await Promise.all([
          adminProviderService.getHospitals(),
          adminProviderService.getDoctors(),
          adminVerificationService.getPendingVerifications(),
          adminComplianceService.getPendingReviews()
        ]);

        setStats({
          publishedHospitals: hospitals.filter(h => h.status === 'PUBLISHED').length,
          draftHospitals: hospitals.filter(h => h.status === 'DRAFT').length,
          publishedDoctors: doctors.filter(d => d.status === 'PUBLISHED').length,
          pendingVerifications: verifications.length,
          pendingCompliance: compliance.length
        });
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="pb-6 border-b border-slate-200 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 tracking-tight">Data Operations Center</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-600 font-medium">
            Overview of platform governance, providers, and compliance tasks.
          </p>
        </div>
        
        <div className="hidden sm:flex space-x-4">
          <Link href="/admin/providers/new" className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            Add Hospital
          </Link>
          <Link href="/admin/acquisition-jobs" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Data Acquisition
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading operational metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Hospitals */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-bold text-slate-500 uppercase tracking-wider truncate mb-1">Published Hospitals</dt>
                  <dd className="text-4xl font-black text-slate-900">{stats.publishedHospitals}</dd>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <Link href="/admin/providers" className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                Manage all <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:border-amber-200 transition-colors relative">
            {stats.draftHospitals > 0 && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-bold text-slate-500 uppercase tracking-wider truncate mb-1">Draft Hospitals</dt>
                  <dd className="text-4xl font-black text-slate-900">{stats.draftHospitals}</dd>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <Link href="/admin/providers" className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                Review drafts <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              {stats.draftHospitals > 0 && <Badge variant="warning">Needs Action</Badge>}
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-bold text-slate-500 uppercase tracking-wider truncate mb-1">Pending Verification</dt>
                  <dd className="text-4xl font-black text-slate-900">{stats.pendingVerifications}</dd>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <Link href="/admin/verification" className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                Review queue <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:border-rose-200 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-bold text-slate-500 uppercase tracking-wider truncate mb-1">Pending Compliance</dt>
                  <dd className="text-4xl font-black text-slate-900">{stats.pendingCompliance}</dd>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <Link href="/admin/compliance" className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                Review queue <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 sm:hidden">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-col space-y-4">
          <Link href="/admin/providers/new" className="inline-flex justify-center items-center px-4 py-3 border border-slate-300 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50">
            Add Hospital
          </Link>
          <Link href="/admin/acquisition-jobs" className="inline-flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
            Data Acquisition
          </Link>
        </div>
      </div>
    </div>
  );
}
