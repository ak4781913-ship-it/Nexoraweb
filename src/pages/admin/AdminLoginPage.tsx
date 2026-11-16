import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';
import { NexoraLogo } from '../../components/common/NexoraLogo';
import { SeoHead } from '../../components/common/SeoHead';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';

export function AdminLoginPage() {
  const { user, isAdmin, loading, authError, signInWithGoogle, logout } =
    useAuth();
  const { settings } = useSiteData();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  const rawFrom = (location.state as { from?: string } | null)?.from;
  const destination =
    rawFrom && rawFrom.startsWith('/admin') && !rawFrom.startsWith('/admin/login')
      ? rawFrom
      : '/admin/dashboard';

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate(destination, { replace: true });
    }
  }, [loading, user, isAdmin, navigate, destination]);

  const handleSignIn = async () => {
    setSigningIn(true);
    const ok = await signInWithGoogle();
    setSigningIn(false);
    if (ok) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <>
      <SeoHead
        title="Administrator Sign In — NEXORA"
        description="Restricted administrative portal for NEXORA platform management."
        noIndex
      />

      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 dark:bg-[#060B19]">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <NexoraLogo
              logoUrl={settings.brandLogoUrl}
              brandName={settings.brandName || 'NEXORA'}
            />
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Admin Console Sign In
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Sign in with an authorized Google administrator account to manage
              NEXORA products, categories, announcements, and inquiries.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 leading-relaxed"
            >
              {authError}
            </div>
          )}

          {user && !isAdmin && !loading && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3">
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                Signed in as <strong>{user.email}</strong>, which is not listed
                as a NEXORA administrator.
              </p>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-xs font-semibold text-amber-900 dark:text-amber-200 underline"
              >
                Sign out and switch account
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={signingIn || loading}
            onClick={handleSignIn}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {signingIn ? 'Verifying Credentials...' : 'Sign In with Google'}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Public account creation is disabled. Access is enforced by Firebase
            Authentication and Firestore Security Rules.
          </p>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
