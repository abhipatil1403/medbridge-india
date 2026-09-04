'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Role } from '../types/auth';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: Role[] }) => {
  const { isAuthenticated, loading, roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AUTH DEBUG] ProtectedRoute useEffect triggered', {
      pathname: window.location.pathname,
      authLoading: loading,
      isAuthenticated,
      roles,
      allowedRoles,
    });
    if (!loading) {
      if (!isAuthenticated) {
        console.log('[AUTH DEBUG] Not authenticated, redirecting to /login');
        router.push('/login');
      } else {
        const hasAccess = roles.some((role: any) => allowedRoles.includes(role));
        console.log('[AUTH DEBUG] hasAccess check', { hasAccess, roles, allowedRoles });
        if (!hasAccess) {
          console.log('[AUTH DEBUG] Unauthorized, redirecting to /unauthorized');
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
