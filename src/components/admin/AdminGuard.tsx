import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminGuard({
  children,
  requireSuperAdmin = false,
}: {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}) {
  const { user, isAdmin, isSuperAdmin, adminRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060B19]">
        <div className="space-y-3 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060B19] px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Super Admin Access Required
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your account ({user.email}) is currently assigned the{' '}
            <strong>{adminRole || 'Editor'}</strong> role. Backups and
            system-level restoration require <strong>Super Admin</strong>{' '}
            privileges.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
