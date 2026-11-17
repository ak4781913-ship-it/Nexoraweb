import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { DEFAULT_FAQ_ITEMS } from '../data/defaults';
import type { FaqEntry } from '../types/nexora';

const CATEGORIES: Array<'All' | FaqEntry['category']> = [
  'All',
  'General',
  'Products',
  'Privacy & Security',
  'Developers & API',
];

export function FaqPage() {
  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState<'All' | FaqEntry['category']>('All');
  const [openId, setOpenId] = useState<string>(DEFAULT_FAQ_ITEMS[0]?.id || '');

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return DEFAULT_FAQ_ITEMS.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (
        q &&
        !item.question.toLowerCase().includes(q) &&
        !item.answer.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [queryText, category]);

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: DEFAULT_FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }),
    [],
  );

  return (
    <>
      <SeoHead
        title="Frequently Asked Questions — MAWA"
        description="Answers to common questions about MAWA digital products, pricing, release roadmap, privacy, downloads, and partnerships."
        canonicalPath="/faq"
        structuredData={faqSchema}
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Knowledge Base
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Clear answers about the MAWA platform, product access, security
            verification, and support channels.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search frequently asked questions"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    category === c
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? '' : item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                        {item.category}
                      </span>
                      <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                        {item.question}
                      </h2>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <HelpCircle className="h-7 w-7 text-slate-400 mx-auto" />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  No FAQ entries matched your search. Still have a question?
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white"
                >
                  Contact Support
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
