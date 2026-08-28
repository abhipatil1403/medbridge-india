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
