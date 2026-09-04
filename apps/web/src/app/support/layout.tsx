'use client';

import React from 'react';
import DashboardLayout, { NavItem } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const supportNavItems: NavItem[] = [
  { label: 'Overview', href: '/support' },
  { label: 'All Cases', href: '/support/cases' },
];

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout navItems={supportNavItems} title="Support Portal" roleContext="Customer Support">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
