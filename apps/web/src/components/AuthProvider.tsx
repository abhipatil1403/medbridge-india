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

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/client';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user: any) => {
      setCurrentUser(user);
      if (user) {
        let roles: Role[] = ['CUSTOMER'];
        let primaryRole: Role = 'CUSTOMER';
        let panel = 'Customer Panel';
        let status = 'ACTIVE';

        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.roles)) {
              roles = data.roles;
            } else if (data.roles && typeof data.roles === 'object') {
              roles = Object.keys(data.roles).filter((k) => data.roles[k]) as Role[];
            }
            if (data.primaryRole) primaryRole = data.primaryRole;
            if (data.panel) panel = data.panel;
            if (data.status) status = data.status;
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }

        setUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          roles,
          primaryRole,
          panel,
          status,
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
