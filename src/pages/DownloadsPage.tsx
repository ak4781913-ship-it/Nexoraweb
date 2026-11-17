import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Monitor,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import {
  fetchPublicDownloads,
  trackAnalyticsEvent,
} from '../services/firestoreService';
import type { DownloadCategory, DownloadItem } from '../types/nexora';
import { isValidExternalUrl } from '../utils/url';

const CATEGORIES: Array<'All' | DownloadCategory> = [
  'All',
  'Windows Application',
  'Android APK',
  'Web Application',
  'Document & Resource',
];

function getCatIcon(cat: DownloadCategory) {
  switch (cat) {
    case 'Windows Application':
      return Monitor;
    case 'Android APK':
      return Smartphone;
    case 'Web Application':
      return Globe;
    default:
      return FileText;
  }
}

export function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<'All' | DownloadCategory>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicDownloads()
      .then((list) => {
        if (!cancelled) setDownloads(list);
      })
      .catch(() => {
        if (!cancelled) setDownloads([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      catFilter === 'All'
        ? downloads
        : downloads.filter((d) => d.category === catFilter),
    [downloads, catFilter],
  );

  const handleCopyChecksum = async (id: string, checksum: string) => {
    try {
      await navigator.clipboard.writeText(checksum);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <>
      <SeoHead
        title="Download Center — MAWA"
        description="Official MAWA software builds, desktop utilities, Android packages, web apps, and verified documentation."
        canonicalPath="/downloads"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Verified Distribution
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            MAWA Download Center
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Access official MAWA installers, Android packages, web app launch
            links, and verified guides published by MAWA administrators.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800"
              role="group"
              aria-label="Filter downloads by format"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFilter(c)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    catFilter === c
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              SHA-256 integrity verification supported
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1326] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((item) => {
                const Icon = getCatIcon(item.category);
                const validUrl = isValidExternalUrl(item.downloadUrl);
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-cyan-400">
                          <Icon className="h-3.5 w-3.5" />
                          {item.category}
                        </span>
                        <span>&middot;</span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                          v{item.version}
                        </span>
                        {item.fileSize && (
                          <>
                            <span>&middot;</span>
                            <span className="font-mono">{item.fileSize}</span>
                          </>
                        )}
                        {item.releaseDate && (
                          <>
                            <span>&middot;</span>
                            <time className="font-mono">{item.releaseDate}</time>
                          </>
                        )}
                      </div>

                      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>

                      {item.releaseNotes && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                          {item.releaseNotes}
                        </p>
                      )}

                      {item.checksumSha256 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            SHA-256:
                          </span>
                          <code className="text-[11px] font-mono bg-slate-100 dark:bg-[#060B19] px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 break-all">
                            {item.checksumSha256}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyChecksum(item.id, item.checksumSha256)
                            }
                            aria-label="Copy SHA-256 checksum"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {item.productSlug && (
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="px-4 py-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          Product Details
                        </Link>
                      )}
                      {validUrl ? (
                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            void trackAnalyticsEvent({
                              eventType: 'download_click',
                              path: '/downloads',
                              productId: item.productId || item.id,
                              productSlug: item.productSlug,
                            })
                          }
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors whitespace-nowrap"
                        >
                          <Download className="h-4 w-4" />
                          Download Release
                        </a>
                      ) : (
                        <span className="px-4 py-2.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Link Pending
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center max-w-2xl mx-auto space-y-4">
              <Download className="h-8 w-8 text-slate-400 mx-auto" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                No Standalone Packages Published Yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Verified Windows, Android, and resource downloads will appear
                here as products complete release packaging. Meanwhile, explore
                our browser-ready products or follow the roadmap.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  to="/products"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Browse Products
                </Link>
                <Link
                  to="/roadmap"
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  View Roadmap
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
