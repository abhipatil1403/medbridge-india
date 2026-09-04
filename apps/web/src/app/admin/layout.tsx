'use client';

import React from 'react';
import DashboardLayout, { NavItem } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const adminNavItems: NavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'Providers', href: '/admin/providers' },
  { label: 'Treatments', href: '/admin/treatments' },
  { label: 'Provider Services', href: '/admin/provider-services' },
  { label: 'Verification Queue', href: '/admin/verification' },
  { label: 'Acquisition Jobs', href: '/admin/acquisition-jobs' },
  { label: 'Data Quality', href: '/admin/data-quality' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER']}>
      <DashboardLayout navItems={adminNavItems} title="Admin Portal" roleContext="Administration Panel">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
