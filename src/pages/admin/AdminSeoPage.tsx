import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  Save,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import {
  fetchAllCategoriesAdmin,
  fetchAllProductsAdmin,
  saveSiteSettings,
} from '../../services/firestoreService';
import type { Category, Product } from '../../types/nexora';

const STATIC_PUBLIC_ROUTES = [
  '/',
  '/products',
  '/categories',
  '/roadmap',
  '/downloads',
  '/changelog',
  '/faq',
  '/developers',
  '/partnerships',
  '/business',
  '/updates',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function AdminSeoPage() {
  const { settings, refreshPublicData } = useSiteData();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [canonicalDomain, setCanonicalDomain] = useState(
    settings.canonicalDomain || '',
  );
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(
    settings.seoDescription || '',
  );
  const [ogImageUrl, setOgImageUrl] = useState(
    settings.ogImageUrl || '/mawa-og.png',
  );
  const [gaMeasurementId, setGaMeasurementId] = useState(
    settings.gaMeasurementId || '',
  );

  useEffect(() => {
    setCanonicalDomain(settings.canonicalDomain || '');
    setSeoTitle(settings.seoTitle || '');
    setSeoDescription(settings.seoDescription || '');
    setOgImageUrl(settings.ogImageUrl || '/mawa-og.png');
    setGaMeasurementId(settings.gaMeasurementId || '');
  }, [settings]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [prodList, catList] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
      ]);
      setProducts(prodList);
      setCategories(catList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load catalog SEO data.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const baseUrl = useMemo(() => {
    const raw = (canonicalDomain || window.location.origin).trim();
    return raw.replace(/\/+$/, '');
  }, [canonicalDomain]);

  const sitemapXml = useMemo(() => {
    const publicProducts = products.filter((p) =>
      ['Live', 'Coming Soon', 'Under Development'].includes(p.publicationStatus),
    );
    const publishedCategories = categories.filter(
      (c) => c.publicationStatus === 'Published',
    );

    const urls: Array<{ loc: string; priority: string; changefreq: string }> = [
      ...STATIC_PUBLIC_ROUTES.map((path) => ({
        loc: `${baseUrl}${path}`,
        priority: path === '/' ? '1.0' : path === '/products' ? '0.9' : '0.7',
        changefreq: path === '/products' ? 'daily' : 'weekly',
      })),
      ...publishedCategories.map((cat) => ({
        loc: `${baseUrl}/categories/${cat.slug}`,
        priority: '0.7',
        changefreq: 'weekly',
      })),
      ...publicProducts.map((prod) => ({
        loc: `${baseUrl}/products/${prod.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
      })),
    ];

    const entries = urls
      .map(
        (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  }, [baseUrl, categories, products]);

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSaving(true);
    try {
      const { updatedAt: _u, ...rest } = settings;
      await saveSiteSettings({
        ...rest,
        canonicalDomain: canonicalDomain.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        ogImageUrl: ogImageUrl.trim(),
        gaMeasurementId: gaMeasurementId.trim(),
      });
      await refreshPublicData();
      showToast('SEO & Analytics settings saved.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save SEO settings.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopySitemap = async () => {
    try {
      await navigator.clipboard.writeText(sitemapXml);
      showToast('sitemap.xml copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  const handleDownloadSitemap = () => {
    const blob = new Blob([sitemapXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      title="SEO, Sitemap & Metadata"
      breadcrumb="MAWA Admin / Search & Indexing"
    >
      <SeoHead
        title="SEO & Sitemap — MAWA Admin"
        description="Inspect product SEO metadata completeness and generate sitemap.xml."
        noIndex
      />

      <div className="space-y-8">
        <form
          onSubmit={handleSaveSeo}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Global Canonical, OpenGraph & Analytics
              </h2>
            </div>
            {!isSuperAdmin && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Read-only for Editor accounts (Super Admin required to save)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Canonical Production Domain (https://)
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                placeholder="https://yourdomain.com"
                value={canonicalDomain}
                onChange={(e) => setCanonicalDomain(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Google Analytics 4 Measurement ID (optional)
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                maxLength={40}
                placeholder="G-XXXXXXXXXX"
                value={gaMeasurementId}
                onChange={(e) => setGaMeasurementId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Default SEO Title ({seoTitle.length}/120)
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                maxLength={120}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Default OpenGraph Image Path or URL
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                maxLength={2000}
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Default Meta Description ({seoDescription.length}/320)
            </label>
            <textarea
              rows={2}
              disabled={!isSuperAdmin}
              maxLength={320}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
            />
          </div>

          {isSuperAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Global SEO'}
              </button>
            </div>
          )}
        </form>

        {/* Product SEO Audit */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Product SEO Metadata Audit ({products.length})
            </h2>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Edit Products
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[660px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SEO Title</th>
                  <th className="py-2.5 px-3">Meta Description</th>
                  <th className="py-2.5 px-3">Cover Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                      Auditing products...
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const hasTitle = Boolean(p.seoTitle?.trim());
                    const hasDesc = Boolean(p.seoDescription?.trim());
                    const hasCover = Boolean(p.coverImageUrl?.trim());
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            /products/{p.slug}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {p.publicationStatus}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {hasTitle ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              OK ({p.seoTitle.length}ch)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {hasDesc ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              OK ({p.seoDescription.length}ch)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {hasCover ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Set
                            </span>
                          ) : (
                            <span className="text-slate-400">Fallback OG</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sitemap XML Generator */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Dynamic Sitemap XML Generator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Includes all static routes plus published categories and public
                product detail URLs using <span className="font-mono">{baseUrl}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopySitemap()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy XML
              </button>
              <button
                type="button"
                onClick={handleDownloadSitemap}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Download sitemap.xml
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
            {sitemapXml}
          </pre>
        </div>
      </div>
    </AdminLayout>
  );
}
