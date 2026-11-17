import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Youtube } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import { isValidExternalUrl } from '../../utils/url';
import { NexoraLogo } from '../common/NexoraLogo';

export function Footer() {
  const { settings, categories } = useSiteData();
  const year = new Date().getFullYear();

  const socialItems = [
    { label: 'GitHub', href: settings.socialGithub, icon: Github },
    { label: 'LinkedIn', href: settings.socialLinkedin, icon: Linkedin },
    { label: 'YouTube', href: settings.socialYoutube, icon: Youtube },
  ].filter((item) => isValidExternalUrl(item.href));

  const hasValidX = isValidExternalUrl(settings.socialX);

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#050914] text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block">
              <NexoraLogo
                logoUrl={settings.brandLogoUrl}
                brandName={settings.brandName || 'MAWA'}
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
              {settings.brandDescription}
            </p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {settings.tagline}
            </p>

            {(socialItems.length > 0 || hasValidX || settings.contactEmail) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {settings.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    aria-label="Email MAWA"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {socialItems.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
                {hasValidX && (
                  <a
                    href={settings.socialX}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    X
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/products"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/roadmap"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Public Roadmap
                </Link>
              </li>
              <li>
                <Link
                  to="/downloads"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Download Center
                </Link>
              </li>
              <li>
                <Link
                  to="/changelog"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  to="/updates"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  What&apos;s New
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Categories &amp; Programs
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/developers"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Developers &amp; Ecosystem
                </Link>
              </li>
              <li>
                <Link
                  to="/partnerships"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Partnerships
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Support &amp; Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/faq"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  FAQ &amp; Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/business"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Business Inquiries
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/unsubscribe"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Newsletter Unsubscribe
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>
            &copy; {year} {settings.brandName || 'MAWA'}. All rights reserved.
          </p>
          <p>{settings.contactLocation}</p>
        </div>
      </div>
    </footer>
  );
}
