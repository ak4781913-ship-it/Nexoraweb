import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  googleProvider,
} from '../lib/firebase';
import {
  getAdministratorProfile,
  logAdminActivity,
} from '../services/firestoreService';
import type { AdminRole } from '../types/nexora';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: AdminRole | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function verifyAdminStatus(
  currentUser: User | null,
): Promise<{ isAdmin: boolean; role: AdminRole | null }> {
  if (!currentUser || !currentUser.emailVerified) {
    return { isAdmin: false, role: null };
  }
  if (
    currentUser.email &&
    currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  ) {
    return { isAdmin: true, role: 'Super Admin' };
  }
  return getAdministratorProfile(currentUser.uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authSeqRef = useRef(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      const seq = ++authSeqRef.current;
      setLoading(true);
      setUser(nextUser);
      if (nextUser) {
        const profile = await verifyAdminStatus(nextUser);
        if (authSeqRef.current !== seq) return;
        setIsAdmin(profile.isAdmin);
        setAdminRole(profile.role);
      } else {
        setIsAdmin(false);
        setAdminRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await verifyAdminStatus(cred.user);
      setIsAdmin(profile.isAdmin);
      setAdminRole(profile.role);
      if (!profile.isAdmin) {
        setAuthError(
          `The account ${cred.user.email ?? 'selected'} does not have administrator privileges for MAWA.`,
        );
        return false;
      }
      void logAdminActivity({
        actionType: 'ADMIN_SIGN_IN',
        targetCollection: 'administrators',
        targetId: cred.user.uid,
        summary: `Administrator ${cred.user.email ?? cred.user.uid} signed in (${profile.role})`,
        adminRole: profile.role,
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication could not be completed.';
      if (!message.includes('popup-closed-by-user')) {
        setAuthError(message);
      }
      return false;
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
    setIsAdmin(false);
    setAdminRole(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin: isAdmin && adminRole === 'Super Admin',
        adminRole,
        loading,
        authError,
        signInWithGoogle,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
