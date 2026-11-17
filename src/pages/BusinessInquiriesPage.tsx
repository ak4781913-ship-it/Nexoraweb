import { useState } from 'react';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { submitContactMessage } from '../services/firestoreService';
import { checkClientCooldown, markClientCooldown } from '../utils/rateLimit';

const INQUIRY_TYPES = [
  'Enterprise Licensing',
  'Strategic Partnership',
  'Custom Product Collaboration',
  'Media & Press',
  'Developer Integration',
];

export function BusinessInquiriesPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [inquiryType, setInquiryType] = useState(INQUIRY_TYPES[0]);
  const [details, setDetails] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid work or contact email.');
      return;
    }
    if (details.trim().length < 15) {
      setError('Please share at least 15 characters describing your inquiry.');
      return;
    }
    if (honeypot.trim().length > 0) {
      setSubmitted(true);
      return;
    }

    const waitSeconds = checkClientCooldown('business_inquiry', 15_000);
    if (waitSeconds > 0) {
      setError(`Please wait ${waitSeconds} seconds before submitting another business inquiry.`);
      return;
    }

    const orgLabel = organization.trim() ? ` (${organization.trim()})` : '';
    const formattedSubject = `[Business: ${inquiryType}]${orgLabel}`.slice(0, 160);
    const formattedMessage = organization.trim()
      ? `Organization: ${organization.trim()}\nInquiry Type: ${inquiryType}\n\n${details.trim()}`
      : `Inquiry Type: ${inquiryType}\n\n${details.trim()}`;

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: formattedSubject,
        message: formattedMessage.slice(0, 4000),
        honeypot: '',
      });
      markClientCooldown('business_inquiry');
      setSubmitted(true);
    } catch {
      setError('Unable to submit your inquiry right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Business Inquiries — MAWA"
        description="Submit enterprise licensing, strategic partnership, custom collaboration, or press inquiries to MAWA."
        canonicalPath="/business"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Commercial &amp; Collaborations
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Business &amp; Partnership Inquiries
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Connect directly with MAWA leadership regarding commercial licensing,
            ecosystem integrations, or institutional collaborations.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-8 space-y-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Business Inquiry Received
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your inquiry has been securely recorded for the MAWA
                administration team. We will respond via email after reviewing
                your proposal.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 sm:p-8 space-y-5"
              noValidate
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Submit Business Proposal
              </div>

              <input
                type="text"
                name="fax_number"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Organization / Company (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Company or institution name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Inquiry Category
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    {INQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Scope &amp; Message
                </label>
                <textarea
                  required
                  rows={6}
                  maxLength={3600}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Share objectives, timeline, relevant MAWA products, and how we can collaborate..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Sending Inquiry...' : 'Submit Business Inquiry'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
