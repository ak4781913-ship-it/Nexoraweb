import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, Package } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';

type TimelineEntry = {
  id: string;
  title: string;
  date: string;
  badge: string;
  summary: string;
  details: string;
  linkTo: string;
  linkLabel: string;
};

export function ChangelogPage() {
  const { updates, products, loading } = useSiteData();
  const [filter, setFilter] = useState<string>('All');

  const entries = useMemo<TimelineEntry[]>(() => {
    const postEntries: TimelineEntry[] = updates.map((u) => ({
      id: `upd-${u.id}`,
      title: u.title,
      date: u.publishedAt || '',
      badge: u.type,
      summary: u.summary,
      details: u.content,
      linkTo: u.relatedProductSlug
        ? `/products/${u.relatedProductSlug}`
        : `/updates?post=${encodeURIComponent(u.slug)}`,
      linkLabel: u.relatedProductSlug ? 'View Related Product' : 'Read Full Post',
    }));

    const productReleaseEntries: TimelineEntry[] = products
      .filter((p) => Boolean(p.changelog?.trim() || p.version?.trim()))
      .map((p) => ({
        id: `prod-${p.id}`,
        title: `${p.name}${p.version ? ` (${p.version})` : ''}`,
        date: p.releaseDate || p.launchDate || '',
        badge: 'Product Release',
        summary: p.shortDescription,
        details: p.changelog || '',
        linkTo: `/products/${p.slug}`,
        linkLabel: 'View Product Profile',
      }));

    return [...postEntries, ...productReleaseEntries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [updates, products]);

  const badges = useMemo(
    () => ['All', ...Array.from(new Set(entries.map((e) => e.badge)))],
    [entries],
  );

  const visibleEntries = useMemo(
    () => (filter === 'All' ? entries : entries.filter((e) => e.badge === filter)),
    [entries, filter],
  );

  return (
    <>
      <SeoHead
        title="Release Notes & Changelog — MAWA"
        description="Chronological release notes, product launches, and platform engineering updates across the MAWA ecosystem."
        canonicalPath="/changelog"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Version History
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            MAWA Changelog &amp; Release Notes
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Every verified platform improvement, product launch milestone, and
            software version release in chronological order.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setFilter(b)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  filter === b
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-slate-100 dark:bg-[#0B1326] animate-pulse"
                />
              ))}
            </div>
          ) : visibleEntries.length > 0 ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 space-y-8">
              {visibleEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-3"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[31px] top-7 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#060B19]"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-blue-600 dark:text-cyan-400">
                      {entry.badge}
                    </span>
                    {entry.date && (
                      <>
                        <span className="text-slate-400">&middot;</span>
                        <time className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {entry.date}
                        </time>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {entry.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {entry.summary}
                  </p>
                  {entry.details && (
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line pt-2 border-t border-slate-100 dark:border-slate-800">
                      {entry.details}
                    </div>
                  )}
                  <div className="pt-2">
                    <Link
                      to={entry.linkTo}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {entry.linkLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center">
              <History className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                No changelog entries available for this filter yet.
              </p>
              <Link
                to="/products"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                <Package className="h-3.5 w-3.5" />
                Explore Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
