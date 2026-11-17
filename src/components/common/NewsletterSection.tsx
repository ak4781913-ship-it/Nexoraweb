import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import { subscribeNewsletter } from '../../services/firestoreService';
import { checkClientCooldown, markClientCooldown } from '../../utils/rateLimit';

export function NewsletterSection({ source = 'home' }: { source?: string }) {
  const { settings } = useSiteData();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ updated: boolean } | null>(null);

  if (settings.newsletterEnabled === false) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Please confirm your consent to receive MAWA product announcements.');
      return;
    }
    if (honeypot.trim().length > 0) {
      setDone({ updated: false });
      return;
    }

    const waitSeconds = checkClientCooldown('newsletter_sub', 10_000);
    if (waitSeconds > 0) {
      setError(`Please wait ${waitSeconds} seconds before trying again.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await subscribeNewsletter({
        email: trimmed,
        consent: true,
        source,
        honeypot: '',
      });
      markClientCooldown('newsletter_sub');
      setDone({ updated: res.updatedExisting });
      setEmail('');
      setConsent(false);
    } catch {
      setError('Unable to complete subscription right now. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-14 sm:py-16 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              <Mail className="h-3.5 w-3.5" />
              Platform Dispatch
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Stay Informed on New MAWA Releases
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Receive occasional announcements when new MAWA products, software
              updates, or public roadmap milestones ship. No spam, and you can{' '}
              <Link
                to="/unsubscribe"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                unsubscribe anytime
              </Link>
              .
            </p>
          </div>

          <div className="lg:col-span-6">
            {done ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">
                    {done.updated
                      ? 'Your MAWA newsletter subscription is active.'
                      : 'Subscribed to MAWA updates.'}
                  </p>
                  <p className="mt-1 text-xs opacity-90">
                    Thank you for following A Legacy of Innovation.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <input
                  type="text"
                  name="company_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    aria-label="Email address for MAWA newsletter"
                    className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    {submitting ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    I consent to receive MAWA product release announcements under
                    the{' '}
                    <Link
                      to="/privacy"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
