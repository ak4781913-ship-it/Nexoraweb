import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';

export function PrivacyPage() {
  const { settings } = useSiteData();

  return (
    <>
      <SeoHead
        title="Privacy Policy — MAWA"
        description="Privacy Policy explaining how MAWA collects, secures, and handles contact inquiries and platform data."
        canonicalPath="/privacy"
      />

      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              Legal
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Effective Date: November 15, 2026
            </p>
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                1. Information We Collect
              </h2>
              <p>
                When you browse the public MAWA platform, no personal account
                registration is required. When you voluntarily submit an inquiry
                through our Contact page, we collect the name, email address,
                subject, and message content you provide so our team can respond
                to your request.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                2. Local Preferences
              </h2>
              <p>
                We store your preferred color theme (light, dark, or system) in
                your browser&apos;s local storage so your visual preference
                persists across visits.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                3. Data Access &amp; Security
              </h2>
              <p>
                Contact submissions are stored in Cloud Firestore and protected
                by strict server-enforced security rules. Private messages are
                accessible solely to authorized MAWA administrators and are
                never sold or disclosed publicly.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                4. External Product Websites
              </h2>
              <p>
                Individual MAWA products may link to their own dedicated
                domains and applications. Each external product website maintains
                its own applicable privacy disclosures for product-specific
                features.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                5. Contact for Privacy Requests
              </h2>
              <p>
                For questions or deletion requests regarding contact inquiries,
                please reach out via{' '}
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {settings.contactEmail}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
