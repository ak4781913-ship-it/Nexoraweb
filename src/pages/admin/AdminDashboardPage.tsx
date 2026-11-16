import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Database,
  FolderTree,
  Mail,
  Megaphone,
  Package,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useSiteData } from '../../context/SiteDataContext';
import {
  fetchAllCategoriesAdmin,
  fetchAllProductsAdmin,
  fetchAllUpdatesAdmin,
  fetchContactMessagesAdmin,
  initializeCatalogDefaults,
} from '../../services/firestoreService';
import type {
  Category,
  ContactMessage,
  Product,
  UpdatePost,
} from '../../types/nexora';

export function AdminDashboardPage() {
  const { showToast } = useToast();
  const { refreshPublicData } = useSiteData();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, upds, msgs] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
        fetchAllUpdatesAdmin(),
        fetchContactMessagesAdmin(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setUpdates(upds);
      setMessages(msgs);
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
  const comingSoonCount = products.filter(
    (p) => p.publicationStatus === 'Coming Soon',
  ).length;
  const unreadMessages = messages.filter((m) => m.status === 'New').length;

  const needsInitialSeed =
    !loading && (products.length === 0 || categories.length === 0);

  return (
    <AdminLayout title="Dashboard" breadcrumb="NEXORA Admin / Overview">
      <SeoHead
        title="Admin Dashboard — NEXORA"
        description="NEXORA administrative overview."
        noIndex
      />

      <div className="space-y-8">
        {needsInitialSeed && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Initialize Default NEXORA Catalog
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Populate Firestore with the 8 standard categories, global brand
                settings, initial announcements, and the 5 planned NEXORA
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: products.length },
            { label: 'Live Products', value: liveCount },
            { label: 'Draft Products', value: draftCount },
            { label: 'Coming Soon', value: comingSoonCount },
            { label: 'Total Categories', value: categories.length },
            { label: 'Updates & News', value: updates.length },
            { label: 'Contact Messages', value: messages.length },
            { label: 'Unread Inquiries', value: unreadMessages },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Edit drafts, upload media, publish
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
        </div>

        {/* Recent Updates & Recent Contact Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
      </div>
    </AdminLayout>
  );
}
