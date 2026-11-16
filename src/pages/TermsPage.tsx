import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';

export function TermsPage() {
  const { settings } = useSiteData();

  return (
    <>
      <SeoHead
        title="Terms of Service — NEXORA"
        description="Terms governing the use of the official NEXORA digital products platform and directory."
        canonicalPath="/terms"
      />

      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              Legal
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Effective Date: November 15, 2026
            </p>
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing the official {settings.brandName || 'NEXORA'}{' '}
                website and product directory, you agree to comply with these
                Terms of Service and all applicable laws.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                2. Platform Directory &amp; Product Availability
              </h2>
              <p>
                NEXORA serves as the central catalog for independently hosted
                NEXORA websites, web applications, mobile apps, and AI tools.
                Product publication statuses (such as Live, Coming Soon, or
                Under Development), pricing tiers, and feature sets may evolve
                as individual platforms are updated.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                3. Intellectual Property
              </h2>
              <p>
                The NEXORA name, emblem, typography, visual assets, and product
                descriptions published on this site belong to NEXORA and may not
                be redistributed or misrepresented without prior authorization.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                4. Acceptable Use
              </h2>
              <p>
                Visitors agree not to attempt unauthorized access to
                administrative routes, disrupt database services, or submit
                automated spam through public inquiry forms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                5. Questions
              </h2>
              <p>
                Questions regarding these Terms may be directed to{' '}
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
