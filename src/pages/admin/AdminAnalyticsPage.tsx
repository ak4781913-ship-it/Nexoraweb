import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useSiteData } from '../../context/SiteDataContext';
import { fetchAiStatus, type AiStatusResponse } from '../../services/aiService';
import {
  fetchAllCategoriesAdmin,
  fetchAllProductsAdmin,
  fetchAllReviewsAdmin,
  fetchAnalyticsEventsAdmin,
  fetchContactMessagesAdmin,
  fetchSubscribersAdmin,
  toTimestampMs,
} from '../../services/firestoreService';
import type {
  AnalyticsEvent,
  Category,
  ContactMessage,
  NewsletterSubscriber,
  Product,
  ProductReview,
} from '../../types/nexora';

export function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const { settings } = useSiteData();

  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [evs, prods, cats, revs, subs, msgs, ai] = await Promise.all([
        fetchAnalyticsEventsAdmin(500),
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
        fetchAllReviewsAdmin(),
        fetchSubscribersAdmin(),
        fetchContactMessagesAdmin(),
        fetchAiStatus(),
      ]);
      setEvents(evs);
      setProducts(prods);
      setCategories(cats);
      setReviews(revs);
      setSubscribers(subs);
      setMessages(msgs);
      setAiStatus(ai);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load analytics.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const eventBreakdown = useMemo(() => {
    const counts = {
      page_view: 0,
      product_view: 0,
      download_click: 0,
      ai_query: 0,
    };
    for (const ev of events) {
      if (ev.eventType in counts) {
        counts[ev.eventType] += 1;
      }
    }
    return counts;
  }, [events]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (ev.eventType === 'product_view' && ev.productSlug) {
        map.set(ev.productSlug, (map.get(ev.productSlug) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([slug, views]) => {
        const prod = products.find((p) => p.slug === slug);
        return {
          slug,
          name: prod?.name || slug,
          status: prod?.publicationStatus || 'Unknown',
          views,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [events, products]);

  const topPaths = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (ev.eventType === 'page_view' && ev.path) {
        map.set(ev.path, (map.get(ev.path) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [events]);

  const avgRating = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'Approved');
    if (approved.length === 0) return null;
    const sum = approved.reduce((acc, r) => acc + r.rating, 0);
    return (sum / approved.length).toFixed(1);
  }, [reviews]);

  return (
    <AdminLayout
      title="Platform Analytics"
      breadcrumb="MAWA Admin / Real Telemetry & Catalog Metrics"
      actions={
        <button
          type="button"
          onClick={() => void loadAnalytics()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326] hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <SeoHead
        title="Analytics — MAWA Admin"
        description="Real-time Firestore telemetry, catalog metrics, and AI usage."
        noIndex
      />

      <div className="space-y-8">
        {/* Primary KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Recorded Page Views', value: eventBreakdown.page_view },
            { label: 'Product Detail Views', value: eventBreakdown.product_view },
            { label: 'Download Clicks', value: eventBreakdown.download_click },
            { label: 'AI Assistant Queries', value: eventBreakdown.ai_query },
            {
              label: 'Live / Total Products',
              value: `${products.filter((p) => p.publicationStatus === 'Live').length} / ${products.length}`,
            },
            {
              label: 'Active Categories',
              value: categories.filter((c) => c.publicationStatus === 'Published').length,
            },
            {
              label: 'Subscribers (Active)',
              value: subscribers.filter((s) => s.status === 'Subscribed').length,
            },
            {
              label: 'Approved Avg Rating',
              value: avgRating ? `${avgRating} / 5` : 'No reviews',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {loading ? '—' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Product Views & Top Paths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Top Viewed Products (Last 500 Telemetry Events)
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {topProducts.length > 0 ? (
                topProducts.map((item) => (
                  <div
                    key={item.slug}
                    className="px-6 py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs font-mono text-slate-500 truncate">
                        /products/{item.slug} &middot; {item.status}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-blue-600 dark:text-cyan-400 shrink-0">
                      {item.views} views
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No product view events recorded yet. Visits to /products/:slug
                  appear here automatically.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Most Visited Public Routes
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {topPaths.length > 0 ? (
                topPaths.map((item) => (
                  <div
                    key={item.path}
                    className="px-6 py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
                      {item.path}
                    </span>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                      {item.count} views
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No route page view events recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Runtime & Google Analytics Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              MAWA AI Backend Runtime
            </h2>
            {aiStatus ? (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Status:</strong>{' '}
                  {aiStatus.configured ? 'Gemini API Configured' : 'API Key Missing'}
                </p>
                <p>
                  <strong>Model:</strong>{' '}
                  <span className="font-mono">{aiStatus.model}</span>
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono tabular-nums">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#060B19]">
                    <span className="block text-[11px] text-slate-500">
                      Assistant Calls
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {aiStatus.usage.publicAssistantCalls}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#060B19]">
                    <span className="block text-[11px] text-slate-500">
                      Recommender Calls
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {aiStatus.usage.recommendationCalls}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#060B19]">
                    <span className="block text-[11px] text-slate-500">
                      Admin AI Assist
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {aiStatus.usage.adminAssistCalls}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#060B19]">
                    <span className="block text-[11px] text-slate-500">
                      Rate-Limited
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {aiStatus.usage.rejectedRateLimit}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI runtime endpoint is offline on this host (normal on static
                Hostinger builds unless VITE_AI_API_URL is configured).
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              External Google Analytics 4 &amp; Recent Telemetry
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>GA4 Measurement ID:</strong>{' '}
              <span className="font-mono">
                {settings.gaMeasurementId || 'Not configured'}
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unread inquiries: {messages.filter((m) => m.status === 'New').length}{' '}
              &middot; Latest telemetry timestamp:{' '}
              <span className="font-mono">
                {events[0] && toTimestampMs(events[0].createdAt)
                  ? new Date(toTimestampMs(events[0].createdAt)).toLocaleString()
                  : 'N/A'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
