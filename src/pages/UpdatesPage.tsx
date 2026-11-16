import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';
import type { UpdateType } from '../types/nexora';

const TYPE_FILTERS: Array<'All' | UpdateType> = [
  'All',
  'Product Launch',
  'Platform Update',
  'Announcement',
  'Roadmap',
];

export function UpdatesPage() {
  const { updates, products } = useSiteData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<'All' | UpdateType>('All');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(
    () => searchParams.get('post') || null,
  );

  useEffect(() => {
    const param = searchParams.get('post');
    setExpandedSlug(param || null);
  }, [searchParams]);

  const filtered = updates.filter((u) =>
    typeFilter === 'All' ? true : u.type === typeFilter,
  );

  const toggleExpand = (slug: string) => {
    const next = expandedSlug === slug ? null : slug;
    setExpandedSlug(next);
    if (next) {
      setSearchParams({ post: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <>
      <SeoHead
        title="What's New & Announcements — MAWA"
        description="Official product launches, platform updates, and engineering announcements from MAWA."
        canonicalPath="/updates"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Changelog &amp; News
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            What&apos;s New at MAWA
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Official release notes, product announcements, and platform roadmap
            milestones.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800 w-fit max-w-full">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-6">
              {filtered.map((post) => {
                const isExpanded = expandedSlug === post.slug;
                const linkedProduct = post.relatedProductSlug
                  ? products.find((p) => p.slug === post.relatedProductSlug)
                  : undefined;

                return (
                  <article
                    key={post.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      {post.coverImageUrl && (
                        <div className="md:col-span-4 aspect-[16/10] md:aspect-auto bg-slate-100 dark:bg-[#0F1830]">
                          <SafeImage
                            src={post.coverImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`p-6 sm:p-8 flex flex-col justify-between ${
                          post.coverImageUrl ? 'md:col-span-8' : 'md:col-span-12'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-blue-600 dark:text-cyan-400">
                              {post.type}
                            </span>
                            <span aria-hidden="true">&middot;</span>
                            <time className="font-mono tabular-nums">
                              {post.publishedAt}
                            </time>
                          </div>
                          <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            {post.title}
                          </h2>
                          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                            {post.summary}
                          </p>

                          {isExpanded && post.content && (
                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-4">
                          {post.content && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(post.slug)}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {isExpanded ? 'Show Less' : 'Read Full Update'}
                            </button>
                          )}
                          {linkedProduct && (
                            <Link
                              to={`/products/${linkedProduct.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              View {linkedProduct.name}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No updates published in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
