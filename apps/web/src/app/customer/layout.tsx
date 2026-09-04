'use client';

import React from 'react';
import DashboardLayout, { NavItem } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const customerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/customer/dashboard' },
  { label: 'Find a Treatment', href: '/customer/requirements' },
  { label: 'My Options', href: '/customer/options' },
  { label: 'My Shortlist', href: '/customer/shortlist' },
  { label: 'Past Searches', href: '/customer/searches' },
  { label: 'AI Assistant', href: '/customer/assistant' },
  { label: 'Value-Added Services', href: '/customer/services' },
  { label: 'My Profile', href: '/customer/profile' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <DashboardLayout navItems={customerNavItems} title="Patient Portal" roleContext="Patient Panel">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
