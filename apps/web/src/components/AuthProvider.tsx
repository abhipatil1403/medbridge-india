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
