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
