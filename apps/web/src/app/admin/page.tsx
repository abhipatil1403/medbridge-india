'use client';

import React, { useEffect, useState } from 'react';
import { adminProviderService } from '../../features/admin/adminProviderService';
import { adminVerificationService } from '../../features/admin/adminVerificationService';
import { adminComplianceService } from '../../features/admin/adminComplianceService';
import Link from 'next/link';

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
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold leading-6 text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Overview of platform governance, providers, and compliance tasks.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Published Hospitals</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.publishedHospitals}</dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/providers" className="font-medium text-blue-700 hover:text-blue-900">View all</Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft Hospitals</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.draftHospitals}</dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/providers" className="font-medium text-blue-700 hover:text-blue-900">Review drafts</Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Published Doctors</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.publishedDoctors}</dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/doctors" className="font-medium text-blue-700 hover:text-blue-900">View all</Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Verifications</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingVerifications}</dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/verification" className="font-medium text-blue-700 hover:text-blue-900">Review queue</Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Compliance</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingCompliance}</dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/compliance" className="font-medium text-blue-700 hover:text-blue-900">Review queue</Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <Link href="/admin/providers/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Add Hospital
          </Link>
          <Link href="/admin/doctors/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Add Doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
