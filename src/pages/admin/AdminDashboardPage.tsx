import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Database,
  FolderTree,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Package,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useSiteData } from '../../context/SiteDataContext';
import {
  fetchActivityLogsAdmin,
  fetchAllCategoriesAdmin,
  fetchAllDownloadsAdmin,
  fetchAllProductsAdmin,
  fetchAllReviewsAdmin,
  fetchAllRoadmapAdmin,
  fetchAllUpdatesAdmin,
  fetchContactMessagesAdmin,
  fetchSubscribersAdmin,
  initializeCatalogDefaults,
  toTimestampMs,
} from '../../services/firestoreService';
import type {
  ActivityLog,
  Category,
  ContactMessage,
  DownloadItem,
  NewsletterSubscriber,
  Product,
  ProductReview,
  RoadmapItem,
  UpdatePost,
} from '../../types/nexora';

export function AdminDashboardPage() {
  const { showToast } = useToast();
  const { refreshPublicData } = useSiteData();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [
        prods,
        cats,
        upds,
        msgs,
        revs,
        subs,
        road,
        dls,
        recentLogs,
      ] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
        fetchAllUpdatesAdmin(),
        fetchContactMessagesAdmin(),
        fetchAllReviewsAdmin(),
        fetchSubscribersAdmin(),
        fetchAllRoadmapAdmin(),
        fetchAllDownloadsAdmin(),
        fetchActivityLogsAdmin(6),
      ]);
      setProducts(prods);
      setCategories(cats);
      setUpdates(upds);
      setMessages(msgs);
      setReviews(revs);
      setSubscribers(subs);
      setRoadmap(road);
      setDownloads(dls);
      setLogs(recentLogs);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard metrics.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const result = await initializeCatalogDefaults();
      showToast(
        `Initialized ${result.seededCategories} categories, ${result.seededProducts} planned Draft products, and ${result.seededUpdates} announcements.`,
        'success',
      );
      await Promise.all([loadDashboard(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Initialization failed.',
        'error',
      );
    } finally {
      setSeeding(false);
    }
  };

  const liveCount = products.filter(
    (p) => p.publicationStatus === 'Live',
  ).length;
  const draftCount = products.filter(
    (p) => p.publicationStatus === 'Draft',
  ).length;
  const unreadMessages = messages.filter((m) => m.status === 'New').length;
  const pendingReviews = reviews.filter((r) => r.status === 'Pending').length;
  const activeSubscribers = subscribers.filter(
    (s) => s.status === 'Subscribed',
  ).length;

  const needsInitialSeed =
    !loading && (products.length === 0 || categories.length === 0);

  return (
    <AdminLayout title="Dashboard" breadcrumb="MAWA Admin / Overview">
      <SeoHead
        title="Admin Dashboard — MAWA"
        description="MAWA administrative overview."
        noIndex
      />

      <div className="space-y-8">
        {needsInitialSeed && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Initialize Default MAWA Catalog
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Populate Firestore with the 8 standard categories, global brand
                settings, initial announcements, and the 5 planned MAWA
                products in Draft status.
              </p>
            </div>
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedDefaults}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {seeding ? 'Initializing...' : 'Initialize Catalog'}
            </button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Products', value: products.length },
            { label: 'Live Products', value: liveCount },
            { label: 'Draft Products', value: draftCount },
            { label: 'Categories', value: categories.length },
            { label: 'Updates & News', value: updates.length },
            { label: 'Unread Inquiries', value: unreadMessages },
            { label: 'Pending Reviews', value: pendingReviews },
            { label: 'Active Subscribers', value: activeSubscribers },
            { label: 'Roadmap Items', value: roadmap.length },
            { label: 'Downloads Listed', value: downloads.length },
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/products"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Manage Products
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Edit drafts, AI assist, publish
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/reviews"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Review Queue ({pendingReviews})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approve or reject visitor reviews
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/analytics"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Platform Analytics
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Catalog views &amp; AI usage metrics
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/categories"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FolderTree className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Manage Categories
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Order, icons, visibility
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/updates"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Publish Updates
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Launch notes &amp; announcements
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/notifications"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notifications Center
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inquiries, reviews &amp; alerts
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>

        {/* Recent Updates, Messages & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Updates
              </h2>
              <Link
                to="/admin/updates"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {updates.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {u.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.type} &middot;{' '}
                      <span className="font-mono tabular-nums">
                        {u.publishedAt}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                    {u.publicationStatus}
                  </span>
                </div>
              ))}
              {!loading && updates.length === 0 && (
                <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No updates created yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Recent Contact Messages
              </h2>
              <Link
                to="/admin/messages"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Inbox
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {messages.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {m.subject}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {m.name} &middot; {m.email}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      m.status === 'New'
                        ? 'text-blue-600 dark:text-cyan-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
              {!loading && messages.length === 0 && (
                <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No contact submissions received yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Recent Activity Logs
              </h2>
              <Link
                to="/admin/logs"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Audit Log
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {logs.map((entry) => (
                <div key={entry.id} className="px-6 py-3.5 space-y-1">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {entry.summary}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {entry.actionType} &middot;{' '}
                    {toTimestampMs(entry.createdAt)
                      ? new Date(toTimestampMs(entry.createdAt)).toLocaleDateString()
                      : 'Just now'}
                  </p>
                </div>
              ))}
              {!loading && logs.length === 0 && (
                <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  Administrative actions will appear here automatically.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
