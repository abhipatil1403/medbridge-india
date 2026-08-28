'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../components/AuthProvider';

const ADMIN_NAVIGATION = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Hospitals', href: '/admin/providers' },
  { name: 'Doctors', href: '/admin/doctors' },
  { name: 'Specialties', href: '/admin/specialties' },
  { name: 'Treatments', href: '/admin/treatments' },
  { name: 'Sources', href: '/admin/sources' },
  { name: 'Verification', href: '/admin/verification', roles: ['ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER'] },
  { name: 'Corrections', href: '/admin/corrections', roles: ['ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER'] },
  { name: 'Compliance', href: '/admin/compliance', roles: ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_REVIEWER'] },
  { name: 'Cost Estimates', href: '/admin/cost-estimates' },
  { name: 'Audit Logs', href: '/admin/audit', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { roles, userProfile } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER', 'COMPLIANCE_REVIEWER']}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
              <span className="text-xl font-bold text-gray-900 tracking-tight">MedBridge Admin</span>
            </div>
            
            <div className="px-4 py-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.displayName || userProfile?.email}</p>
              <p className="text-xs text-gray-500 mt-1">Roles: {roles.join(', ')}</p>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {ADMIN_NAVIGATION.map((item) => {
                // Check if user has required role for this menu item
                if (item.roles && !item.roles.some(r => roles.includes(r as any))) {
                  return null;
                }

                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
              >
                ← Back to Site
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
