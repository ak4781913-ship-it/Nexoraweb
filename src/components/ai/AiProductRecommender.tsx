import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import {
  requestAiProductRecommendations,
  type RecommendationItem,
} from '../../services/aiService';
import { trackAnalyticsEvent } from '../../services/firestoreService';

export function AiProductRecommender() {
  const { products, settings } = useSiteData();
  const [goal, setGoal] = useState('');
  const [platform, setPlatform] = useState('Any');
  const [pricing, setPricing] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendationItem[]>([]);

  if (settings.aiAssistantEnabled === false) {
    return null;
  }

  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim().length < 3 || loading) return;
    setLoading(true);
    void trackAnalyticsEvent({
      eventType: 'ai_query',
      path: window.location.pathname,
      referrerSource: 'product_recommender',
    });
    try {
      const res = await requestAiProductRecommendations(
        goal,
        platform,
        pricing,
        products,
      );
      setSummary(res.summary);
      setResults(res.recommendations);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 sm:py-16 border-b border-slate-200 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-[#0B1326] dark:to-[#080F22] p-7 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-cyan-400">
                <Compass className="h-3.5 w-3.5" />
                Smart Discovery
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                MAWA Product Recommender
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Describe what workflow, tool, or platform you need and find the
                best-fitting MAWA product in seconds.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              Open Full Directory
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <form
            onSubmit={handleFind}
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Free browser utilities, AI prompt library, or language learning..."
              aria-label="Describe what product you need"
              className="md:col-span-6 px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              aria-label="Preferred platform"
              className="md:col-span-2 px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="Any">Any Platform</option>
              <option value="Web">Web</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
            </select>
            <select
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
              aria-label="Preferred pricing"
              className="md:col-span-2 px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="Any">Any Pricing</option>
              <option value="Free">Free</option>
              <option value="Freemium">Freemium</option>
              <option value="Premium">Premium</option>
            </select>
            <button
              type="submit"
              disabled={loading || goal.trim().length < 3}
              className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Matching...' : 'Recommend'}
            </button>
          </form>

          {summary && (
            <div className="pt-2 space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {summary}
              </p>
              {results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.map((rec) => {
                    const matched = products.find((p) => p.slug === rec.slug);
                    return (
                      <Link
                        key={rec.slug}
                        to={`/products/${rec.slug}`}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060B19] p-5 hover:border-blue-500 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                            {rec.fitLabel}
                          </p>
                          <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white">
                            {matched ? matched.name : rec.slug}
                          </h3>
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Explore Product
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
