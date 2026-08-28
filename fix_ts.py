import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

root = r"f:\ALL\ABHI\VIT\INDUSTRY PROJECT\MedBridge\Project\medbridge-india"

# Fix page.tsx imports
write_file(f"{root}/apps/web/src/app/customer/page.tsx", """
import { ProtectedRoute } from '../../components/ProtectedRoute';
export default function CustomerPage() {
  return <ProtectedRoute allowedRoles={['CUSTOMER']}><div>Customer Panel</div></ProtectedRoute>;
}
""")

write_file(f"{root}/apps/web/src/app/support/page.tsx", """
import { ProtectedRoute } from '../../components/ProtectedRoute';
export default function SupportPage() {
  return <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}><div>Support Panel</div></ProtectedRoute>;
}
""")

write_file(f"{root}/apps/web/src/app/admin/page.tsx", """
import { ProtectedRoute } from '../../components/ProtectedRoute';
export default function AdminPage() {
  return <ProtectedRoute allowedRoles={['DATA_REVIEWER', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']}><div>Admin Panel</div></ProtectedRoute>;
}
""")

write_file(f"{root}/apps/web/src/app/layout.tsx", """
import { AuthProvider } from '../components/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
""")

# Fix components
auth_provider = """
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { observeAuthState, signOut as authSignOut } from '../lib/firebase/auth';
import { AuthContextType, UserProfile, Role } from '../types/auth';

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  roles: [],
  primaryRole: null,
  isAuthenticated: false,
  panel: null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user: any) => {
      setCurrentUser(user);
      if (user) {
        setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            roles: ['CUSTOMER'],
            primaryRole: 'CUSTOMER',
            panel: 'Customer Panel',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const roles = userProfile?.roles || [];
  const primaryRole = userProfile?.primaryRole || null;
  const isAuthenticated = !!currentUser;
  const panel = userProfile?.panel || null;

  const value = {
    currentUser,
    userProfile,
    loading,
    roles,
    primaryRole,
    isAuthenticated,
    panel,
    signOut: authSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
"""
write_file(f"{root}/apps/web/src/components/AuthProvider.tsx", auth_provider)

route_guard = """
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Role } from '../types/auth';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: Role[] }) => {
  const { isAuthenticated, loading, roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const hasAccess = roles.some((role: any) => allowedRoles.includes(role));
        if (!hasAccess) {
          router.push('/unauthorized');
        }
      }
    }
  }, [loading, isAuthenticated, roles, router, allowedRoles]);

  if (loading || !isAuthenticated) return <div>Loading...</div>;

  const hasAccess = roles.some((role: any) => allowedRoles.includes(role));
  if (!hasAccess) return null; // Or unauthorized component

  return <>{children}</>;
};
"""
write_file(f"{root}/apps/web/src/components/ProtectedRoute.tsx", route_guard)
