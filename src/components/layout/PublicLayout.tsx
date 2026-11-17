import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import { trackAnalyticsEvent } from '../../services/firestoreService';
import { MawaAiAssistant } from '../ai/MawaAiAssistant';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

const CONSENT_KEY = 'mawa_analytics_consent';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { settings } = useSiteData();
  const [consentChoice, setConsentChoice] = useState<'granted' | 'declined' | null>(
    () => {
      if (typeof window === 'undefined') return null;
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === 'granted' || saved === 'declined') return saved;
      return null;
    },
  );

  // Anonymous first-party page view telemetry (never stores PII)
  useEffect(() => {
    const source = document.referrer
      ? (() => {
          try {
            return new URL(document.referrer).hostname || 'referral';
          } catch {
            return 'referral';
          }
        })()
      : 'direct';

    void trackAnalyticsEvent({
      eventType: 'page_view',
      path: pathname || '/',
      referrerSource: source,
    });
  }, [pathname]);

  // Privacy-first optional GA4 activation ONLY when Admin configures ID AND user consents
  useEffect(() => {
    const gaId = (settings.gaMeasurementId || '').trim();
    if (!gaId || consentChoice !== 'granted' || !/^G-[A-Z0-9]+$/i.test(gaId)) {
      return;
    }

    const existing = document.getElementById('mawa-ga4-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'mawa-ga4-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);

      const inline = document.createElement('script');
      inline.id = 'mawa-ga4-config';
      inline.textContent = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`;
      document.head.appendChild(inline);
    }
  }, [settings.gaMeasurementId, consentChoice]);

  const handleConsent = (choice: 'granted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, choice);
    setConsentChoice(choice);
  };

  const showConsentBanner =
    Boolean((settings.gaMeasurementId || '').trim()) && consentChoice === null;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#060B19] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MawaAiAssistant />

      {showConsentBanner && (
        <div
          role="dialog"
          aria-label="Analytics consent"
          className="fixed bottom-5 left-5 z-40 max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326] p-4 shadow-xl"
        >
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-2.5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                MAWA uses privacy-respecting analytics only with your permission
                to understand which products and guides are most helpful.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConsent('granted')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Allow Analytics
                </button>
                <button
                  type="button"
                  onClick={() => handleConsent('declined')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
