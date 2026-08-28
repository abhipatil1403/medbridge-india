'use client';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function SupportDashboard() {
  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Support Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border p-4 rounded bg-blue-50">
            <h3 className="text-gray-600 text-sm font-medium">New Cases</h3>
            <p className="text-2xl font-bold">Queue</p>
          </div>
          <div className="border p-4 rounded bg-green-50">
            <h3 className="text-gray-600 text-sm font-medium">Assigned to Me</h3>
            <p className="text-2xl font-bold">Active</p>
          </div>
          <div className="border p-4 rounded bg-yellow-50">
            <h3 className="text-gray-600 text-sm font-medium">Waiting for Customer</h3>
            <p className="text-2xl font-bold">Pending</p>
          </div>
          <div className="border p-4 rounded bg-red-50">
            <h3 className="text-gray-600 text-sm font-medium">Escalated</h3>
            <p className="text-2xl font-bold">Alert</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/support/cases" className="bg-blue-600 text-white px-6 py-2 rounded">
            View Case Queue
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
