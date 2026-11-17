import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MailMinus } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { unsubscribeNewsletter } from '../services/firestoreService';
import { checkClientCooldown, markClientCooldown } from '../utils/rateLimit';

export function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    const waitSeconds = checkClientCooldown('newsletter_unsub', 10_000);
    if (waitSeconds > 0) {
      setError(`Please wait ${waitSeconds} seconds before submitting again.`);
      return;
    }

    setSubmitting(true);
    try {
      await unsubscribeNewsletter(trimmed);
      markClientCooldown('newsletter_unsub');
      setDone(true);
    } catch {
      // Do not leak subscriber existence publicly; treat not-found safely or clarify
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Newsletter Unsubscribe — MAWA"
        description="Manage or unsubscribe your email address from MAWA newsletter announcements."
        canonicalPath="/unsubscribe"
        noIndex
      />

      <section className="py-16 sm:py-24">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-7 sm:p-9 space-y-5">
            <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <MailMinus className="h-5 w-5" />
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Unsubscribe from MAWA Updates
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter the email address you wish to remove from MAWA product
                announcement emails.
              </p>
            </div>

            {done ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Preference Updated
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  If that email was subscribed to MAWA newsletter updates, its
                  status is now set to Unsubscribed.
                </p>
                <Link
                  to="/"
                  className="inline-block pt-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Return to MAWA Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleUnsubscribe} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Updating...' : 'Confirm Unsubscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
