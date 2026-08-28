import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

root = r"f:\ALL\ABHI\VIT\INDUSTRY PROJECT\MedBridge\Project\medbridge-india"

# 1. Types
auth_types = """
export type Role = 
  | 'CUSTOMER'
  | 'SUPPORT_AGENT'
  | 'CASE_MANAGER'
  | 'DATA_REVIEWER'
  | 'COMPLIANCE_REVIEWER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  // Future roles
  | 'PROVIDER'
  | 'PARTNER';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roles: Role[];
  primaryRole: Role;
  panel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface AuthContextType {
  currentUser: any | null; // Firebase User
  userProfile: UserProfile | null;
  loading: boolean;
  roles: Role[];
  primaryRole: Role | null;
  isAuthenticated: boolean;
  panel: string | null;
  signOut: () => Promise<void>;
}
"""
write_file(f"{root}/apps/web/src/types/auth.ts", auth_types)

# 2. Firebase Config
firebase_config = """
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
"""
write_file(f"{root}/apps/web/src/lib/firebase/config.ts", firebase_config)

# 3. Firebase Client
firebase_client = """
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Singleton pattern to prevent multiple initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
"""
write_file(f"{root}/apps/web/src/lib/firebase/client.ts", firebase_client)

# 4. Firebase Auth
firebase_auth = """
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './client';

export const signUp = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signIn = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const getCurrentUser = () => auth.currentUser;

export const observeAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
"""
write_file(f"{root}/apps/web/src/lib/firebase/auth.ts", firebase_auth)

# 5. Firebase Firestore & Storage Placeholders
write_file(f"{root}/apps/web/src/lib/firebase/firestore.ts", "// Firestore utilities go here")
write_file(f"{root}/apps/web/src/lib/firebase/storage.ts", "// Storage utilities go here")

# 6. Auth Provider Component
auth_provider = """
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { observeAuthState, signOut as authSignOut } from '@/lib/firebase/auth';
import { AuthContextType, UserProfile, Role } from '@/types/auth';

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
    const unsubscribe = observeAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        // In a real app, fetch the profile from Firestore here
        // For Phase 1 initial structure, we mock an empty profile to avoid errors
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

# 7. Route Guards
route_guard = """
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/types/auth';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: Role[] }) => {
  const { isAuthenticated, loading, roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const hasAccess = roles.some(role => allowedRoles.includes(role));
        if (!hasAccess) {
          router.push('/unauthorized');
        }
      }
    }
  }, [loading, isAuthenticated, roles, router, allowedRoles]);

  if (loading || !isAuthenticated) return <div>Loading...</div>;

  const hasAccess = roles.some(role => allowedRoles.includes(role));
  if (!hasAccess) return null; // Or unauthorized component

  return <>{children}</>;
};
"""
write_file(f"{root}/apps/web/src/components/ProtectedRoute.tsx", route_guard)

# 8. Placeholder Routes
def write_page(path, content):
    write_file(path, content)

write_page(f"{root}/apps/web/src/app/customer/page.tsx", """
import { ProtectedRoute } from '@/components/ProtectedRoute';
export default function CustomerPage() {
  return <ProtectedRoute allowedRoles={['CUSTOMER']}><div>Customer Panel</div></ProtectedRoute>;
}
""")

write_page(f"{root}/apps/web/src/app/support/page.tsx", """
import { ProtectedRoute } from '@/components/ProtectedRoute';
export default function SupportPage() {
  return <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}><div>Support Panel</div></ProtectedRoute>;
}
""")

write_page(f"{root}/apps/web/src/app/admin/page.tsx", """
import { ProtectedRoute } from '@/components/ProtectedRoute';
export default function AdminPage() {
  return <ProtectedRoute allowedRoles={['DATA_REVIEWER', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']}><div>Admin Panel</div></ProtectedRoute>;
}
""")

write_page(f"{root}/apps/web/src/app/unauthorized/page.tsx", """
export default function UnauthorizedPage() {
  return <div>Unauthorized Access</div>;
}
""")

write_page(f"{root}/apps/web/src/app/login/page.tsx", """
export default function LoginPage() {
  return <div>Login Page Placeholder</div>;
}
""")

# Update layout to include AuthProvider
layout_content = """
import { AuthProvider } from '@/components/AuthProvider';

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
"""
write_file(f"{root}/apps/web/src/app/layout.tsx", layout_content)

# 9. Firebase Security Rules
firestore_rules = """
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    // Currently roles are trusted from token custom claims in production
    // or from server-side updates. A user cannot assign their own roles.
    function hasRole(role) {
      // In Phase 1, role checking via claims or secure server is required.
      // E.g. request.auth.token.roles.hasAny([role])
      return isAuthenticated() && (request.auth.token[role] == true || request.auth.token.role == role || request.auth.token.primaryRole == role);
    }
    
    function isSuperAdmin() {
      return hasRole('SUPER_ADMIN');
    }

    function isAdmin() {
      return hasRole('ADMIN') || isSuperAdmin();
    }

    // Collections
    
    match /users/{userId} {
      // Users can read their own profile. Admins can read all.
      allow read: if isOwner(userId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      // Users can update their profile safely (preventing role self-assignment)
      allow update: if isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'primaryRole', 'panel', 'status']));
      allow write: if isSuperAdmin();
    }

    match /patients/{patientId} {
      allow read: if isOwner(patientId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      // Patient write operations should ideally be handled by backend
      allow write: if isSuperAdmin();
    }

    match /staffProfiles/{staffId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }

    match /cases/{caseId} {
      // Need a mechanism to check assigned cases for support. 
      // For now, patient can read their case if patientId == their uid
      allow read: if isSuperAdmin() || isAdmin() || (isAuthenticated() && resource.data.patientId == request.auth.uid) || (isAuthenticated() && resource.data.assignedTo == request.auth.uid);
      allow write: if isSuperAdmin();
    }
    
    // Other collections (doctors, hospitals, cases, quotes, etc.) defaults to deny
    // Read operations should be tailored to publication status or specific roles.
    
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin() || isAdmin();
      allow write: if false; // Only backend can write audit logs
    }
  }
}
"""
write_file(f"{root}/firebase/firestore.rules", firestore_rules)

storage_rules = """
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Default Deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
    
    match /patient-documents/{patientId}/{caseId}/{fileName} {
      // Patient can read their own documents. Admins/support can read.
      allow read: if request.auth != null && (request.auth.uid == patientId || request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'CASE_MANAGER']);
      // Uploads should ideally go through backend to verify case access and virus scan
      allow write: if false; 
    }
    
    match /provider-media/{providerId}/{fileName} {
      allow read: if true; // Public access for approved media
      allow write: if false;
    }
  }
}
"""
write_file(f"{root}/firebase/storage.rules", storage_rules)

write_file(f"{root}/firebase/firestore.indexes.json", '{\n  "indexes": [],\n  "fieldOverrides": []\n}')

# 10. FastAPI Firebase Integration
firebase_py = """
# apps/api/app/core/firebase.py
# Placeholder for future Firebase Admin token verification.
# 
# Future implementation:
# 1. Initialize firebase_admin
# 2. Endpoint dependency to verify token: `firebase_admin.auth.verify_id_token(token)`
# 3. Extract UID and custom claims (roles).
# 4. Enforce backend authorization.
#
# Do NOT initialize Admin SDK with service-account JSON in client code.
"""
write_file(f"{root}/apps/api/app/core/firebase.py", firebase_py)

# 11. Documentation
docs_firebase = """
# Firebase Setup

## Steps
1. Create Firebase project.
2. Enable Authentication (Email/Password, Google).
3. Enable Firestore Database.
4. Enable Firebase Storage.
5. Setup service account for backend (DO NOT COMMIT).

## Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Future Migration
Firebase handles Auth/Data for MVP. Backend FastAPI can be extended to fully replace Firebase later.
"""
write_file(f"{root}/docs/FIREBASE.md", docs_firebase)

docs_rbac = """
# Role-Based Access Control (RBAC)

## Roles
- `CUSTOMER`: Customer Panel
- `SUPPORT_AGENT`: Support Panel
- `CASE_MANAGER`: Support Panel
- `DATA_REVIEWER`: Admin Panel
- `COMPLIANCE_REVIEWER`: Admin Panel
- `ADMIN`: Admin Panel
- `SUPER_ADMIN`: Admin Panel
- (Future) `PROVIDER`: Provider Panel
- (Future) `PARTNER`: Partner Panel

## Security Model
- Firestore Security Rules enforce access at the database level.
- Frontend Route Guards prevent unauthorized UI access.
- Roles are trusted only from server/Firebase Auth custom claims.
- Users cannot assign their own roles.
"""
write_file(f"{root}/docs/RBAC.md", docs_rbac)

docs_db = """
# Firestore Database Structure

## Collections
- `users`: User profiles and role assignments.
- `patients`: Patient-specific data.
- `staffProfiles`: Staff profiles.
- `doctors`, `hospitals`, `specialties`, `treatments`: Provider data.
- `sources`, `sourceRecords`, `dataFields`, `verificationReviews`, `correctionRequests`, `outcomeStatistics`: Verification data.
- `costEstimates`, `cases`, `caseEvents`, `caseMessages`, `caseDocuments`, `quotes`: Workflow data.
- `aiConversations`, `aiMessages`, `aiSafetyEvents`: AI data.
- `complianceReviews`, `auditLogs`, `systemConfig`: Admin data.
"""
write_file(f"{root}/docs/DATABASE.md", docs_db)

docs_arch = """
# Architecture

- **Frontend**: Next.js (TypeScript) + Firebase SDK
- **Backend**: FastAPI (Python)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage

Browser -> Next.js -> Firebase Auth -> Next.js Protected Routes
Firestore -> User Data
Storage -> File Storage
FastAPI -> Server Operations & Admin Verification
"""
write_file(f"{root}/docs/ARCHITECTURE.md", docs_arch)

print("Firebase setup complete.")
