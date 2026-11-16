import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SafeImage } from '../../components/common/SafeImage';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { DEFAULT_CATEGORIES } from '../../data/defaults';
import { useSiteData } from '../../context/SiteDataContext';
import {
  deleteProduct,
  fetchAllCategoriesAdmin,
  fetchAllProductsAdmin,
  saveProduct,
  slugify,
  toggleProductFeatured,
  updateProductStatus,
} from '../../services/firestoreService';
import { uploadMediaFile } from '../../services/storageService';
import { isSafeAssetUrl, isValidExternalUrl } from '../../utils/url';
import type {
  Category,
  PricingType,
  Product,
  ProductInput,
  ProductType,
  PublicationStatus,
} from '../../types/nexora';

const STATUS_TABS: Array<'All' | PublicationStatus> = [
  'All',
  'Live',
  'Coming Soon',
  'Under Development',
  'Draft',
  'Archived',
];

const PRODUCT_TYPES: ProductType[] = [
  'Website',
  'Web Application',
  'Mobile Application',
  'AI Tool',
  'Online Service',
  'Digital Platform',
];

const PRICING_TYPES: PricingType[] = ['Free', 'Freemium', 'Premium'];

const EMPTY_PRODUCT: ProductInput = {
  name: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  logoUrl: '',
  coverImageUrl: '',
  screenshotGallery: [],
  categoryId: 'ai-innovation',
  categoryName: 'AI & Innovation',
  tags: [],
  features: [],
  benefits: [],
  officialWebsiteUrl: '',
  productType: 'Web Application',
  pricingType: 'Free',
  supportedPlatforms: ['Web'],
  launchDate: '',
  featured: false,
  displayOrder: 1,
  seoTitle: '',
  seoDescription: '',
  publicationStatus: 'Draft',
};

export function AdminProductsPage() {
  const { showToast } = useToast();
  const { refreshPublicData } = useSiteData();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | PublicationStatus>(
    'All',
  );
  const [searchText, setSearchText] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_PRODUCT);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tagDraft, setTagDraft] = useState('');
  const [featureDraft, setFeatureDraft] = useState('');
  const [benefitDraft, setBenefitDraft] = useState('');
  const [platformDraft, setPlatformDraft] = useState('');
  const [screenshotUrlDraft, setScreenshotUrlDraft] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchAllCategoriesAdmin(),
      ]);
      setProducts(prods);
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load products.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!editorOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setEditorOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editorOpen, saving]);

  const openCreate = () => {
    const firstCat = categories[0] || DEFAULT_CATEGORIES[0];
    setEditingId(null);
    setSlugLocked(false);
    setForm({
      ...EMPTY_PRODUCT,
      categoryId: firstCat.id,
      categoryName: firstCat.name,
      displayOrder: products.length + 1,
    });
    setEditorOpen(true);
  };

  const openEdit = (p: Product) => {
    const matchedCat = categories.find(
      (c) => c.id === p.categoryId || c.slug === p.categoryId,
    );
    setEditingId(p.id);
    setSlugLocked(true);
    setForm({
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      logoUrl: p.logoUrl,
      coverImageUrl: p.coverImageUrl,
      screenshotGallery: [...p.screenshotGallery],
      categoryId: matchedCat?.id || p.categoryId,
      categoryName: matchedCat?.name || p.categoryName,
      tags: [...p.tags],
      features: [...p.features],
      benefits: [...p.benefits],
      officialWebsiteUrl: p.officialWebsiteUrl,
      productType: p.productType,
      pricingType: p.pricingType,
      supportedPlatforms: [...p.supportedPlatforms],
      launchDate: p.launchDate,
      featured: p.featured,
      displayOrder: p.displayOrder,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      publicationStatus: p.publicationStatus,
    });
    setEditorOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugLocked ? prev.slug : slugify(value),
    }));
  };

  const handleCategorySelect = (catId: string) => {
    const cat = categories.find((c) => c.id === catId || c.slug === catId);
    setForm((prev) => ({
      ...prev,
      categoryId: catId,
      categoryName: cat?.name || prev.categoryName,
    }));
  };

  const handleFileUpload = async (
    file: File,
    field: 'logoUrl' | 'coverImageUrl' | 'screenshot',
  ) => {
    setUploadingField(field);
    try {
      const url = await uploadMediaFile(file, 'products');
      if (field === 'screenshot') {
        setForm((prev) => ({
          ...prev,
          screenshotGallery: [...prev.screenshotGallery, url].slice(0, 12),
        }));
      } else {
        setForm((prev) => ({ ...prev, [field]: url }));
      }
      showToast('Image uploaded to Firebase Storage.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Upload failed.',
        'error',
      );
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      showToast('Product name must be at least 2 characters.', 'error');
      return;
    }
    if (form.shortDescription.trim().length < 2) {
      showToast('Short description is required.', 'error');
      return;
    }
    if (
      form.officialWebsiteUrl.trim() &&
      !isValidExternalUrl(form.officialWebsiteUrl)
    ) {
      showToast('Official URL must start with https:// or http://', 'error');
      return;
    }
    if (form.logoUrl.trim() && !isSafeAssetUrl(form.logoUrl)) {
      showToast('Logo URL must be a valid https://, http://, or local asset path.', 'error');
      return;
    }
    if (form.coverImageUrl.trim() && !isSafeAssetUrl(form.coverImageUrl)) {
      showToast('Cover image URL must be a valid https://, http://, or local asset path.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveProduct(editingId, form);
      showToast(
        editingId
          ? `Updated "${form.name}".`
          : `Created "${form.name}".`,
        'success',
      );
      setEditorOpen(false);
      await Promise.all([loadData(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to save product.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (
    p: Product,
    nextStatus: PublicationStatus,
  ) => {
    try {
      await updateProductStatus(p.id, nextStatus);
      showToast(`"${p.name}" marked as ${nextStatus}.`, 'success');
      await Promise.all([loadData(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Status update failed.',
        'error',
      );
    }
  };

  const handleToggleFeatured = async (p: Product) => {
    try {
      await toggleProductFeatured(p.id, !p.featured);
      showToast(
        !p.featured
          ? `"${p.name}" featured on homepage.`
          : `"${p.name}" removed from featured.`,
        'success',
      );
      await Promise.all([loadData(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to toggle featured.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      showToast(`Deleted "${deleteTarget.name}".`, 'success');
      setDeleteTarget(null);
      await Promise.all([loadData(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter((p) => {
    if (statusFilter !== 'All' && p.publicationStatus !== statusFilter) {
      return false;
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout
      title="Products"
      breadcrumb="MAWA Admin / Product Directory"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      }
    >
      <SeoHead
        title="Manage Products — MAWA Admin"
        description="MAWA product catalog management."
        noIndex
      />

      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800 w-fit max-w-full">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter products..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type &amp; Pricing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Featured</th>
                <th className="py-3 px-4 text-right">Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                          <SafeImage
                            src={p.logoUrl || p.coverImageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                            /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {p.categoryName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {p.productType} &middot; {p.pricingType}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          p.publicationStatus === 'Live'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : p.publicationStatus === 'Coming Soon'
                              ? 'text-blue-600 dark:text-cyan-400'
                              : p.publicationStatus === 'Draft'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {p.publicationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => void handleToggleFeatured(p)}
                        aria-label={`Toggle featured for ${p.name}`}
                        className={`p-1.5 rounded-md transition-colors ${
                          p.featured
                            ? 'text-amber-500'
                            : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                        }`}
                      >
                        <Star
                          className="h-4 w-4"
                          fill={p.featured ? 'currentColor' : 'none'}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {p.displayOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/products/${p.slug}?preview=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview Product"
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {p.publicationStatus !== 'Live' ? (
                          <button
                            type="button"
                            onClick={() => void handleQuickStatus(p, 'Live')}
                            title="Publish Live"
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleQuickStatus(p, 'Draft')}
                            title="Unpublish to Draft"
                            className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          title="Edit Product"
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete Product"
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No products found matching this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Editor Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? `Edit Product: ${form.name}` : 'Add New Product'}
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Product Slug *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setForm((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Short Description * (max 280 chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={280}
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Full Overview Description
                </label>
                <textarea
                  rows={4}
                  maxLength={15000}
                  value={form.fullDescription}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fullDescription: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                />
              </div>

              {/* Taxonomy & Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Product Type
                  </label>
                  <select
                    value={form.productType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        productType: e.target.value as ProductType,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Pricing Type
                  </label>
                  <select
                    value={form.pricingType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricingType: e.target.value as PricingType,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  >
                    {PRICING_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={form.publicationStatus}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publicationStatus: e.target.value as PublicationStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  >
                    {(
                      [
                        'Draft',
                        'Coming Soon',
                        'Live',
                        'Under Development',
                        'Archived',
                      ] as PublicationStatus[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL, Launch Date, Display Order, Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Official Website URL (leave blank if pending)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      maxLength={1000}
                      placeholder="https://product.mawa..."
                      value={form.officialWebsiteUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          officialWebsiteUrl: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                    />
                    {form.officialWebsiteUrl && (
                      <a
                        href={form.officialWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        title="Test external URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Launch Date
                  </label>
                  <input
                    type="date"
                    value={form.launchDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        launchDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        displayOrder: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          featured: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300"
                    />
                    Featured
                  </label>
                </div>
              </div>

              {/* Media Uploads: Logo & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Product Logo URL or Upload
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://... or upload"
                      value={form.logoUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          logoUrl: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingField === 'logoUrl' ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) void handleFileUpload(file, 'logoUrl');
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Cover Image URL or Upload
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://... or upload"
                      value={form.coverImageUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          coverImageUrl: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingField === 'coverImageUrl' ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) void handleFileUpload(file, 'coverImageUrl');
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Screenshots Gallery */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Screenshots Gallery ({form.screenshotGallery.length}/12)
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Paste screenshot URL..."
                    value={screenshotUrlDraft}
                    onChange={(e) => setScreenshotUrlDraft(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = screenshotUrlDraft.trim();
                      if (!trimmed) return;
                      if (!isSafeAssetUrl(trimmed)) {
                        showToast('Please enter a valid https://, http://, or local asset URL.', 'error');
                        return;
                      }
                      setForm((prev) => ({
                        ...prev,
                        screenshotGallery: [
                          ...prev.screenshotGallery,
                          trimmed,
                        ].slice(0, 12),
                      }));
                      setScreenshotUrlDraft('');
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Add URL
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingField === 'screenshot' ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleFileUpload(file, 'screenshot');
                      }}
                    />
                  </label>
                </div>
                {form.screenshotGallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {form.screenshotGallery.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900"
                      >
                        <SafeImage
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              screenshotGallery: prev.screenshotGallery.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-slate-950/80 text-white flex items-center justify-center text-xs"
                          aria-label="Remove screenshot"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lists: Features, Benefits, Platforms, Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* Features */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Key Features ({form.features.length}/25)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureDraft}
                      onChange={(e) => setFeatureDraft(e.target.value)}
                      placeholder="Add a feature..."
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (featureDraft.trim()) {
                          setForm((prev) => ({
                            ...prev,
                            features: [
                              ...prev.features,
                              featureDraft.trim(),
                            ].slice(0, 25),
                          }));
                          setFeatureDraft('');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {form.features.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-800/60"
                      >
                        <span className="truncate">{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              features: prev.features.filter(
                                (_, idx) => idx !== i,
                              ),
                            }))
                          }
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Benefits ({form.benefits.length}/25)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={benefitDraft}
                      onChange={(e) => setBenefitDraft(e.target.value)}
                      placeholder="Add a benefit..."
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (benefitDraft.trim()) {
                          setForm((prev) => ({
                            ...prev,
                            benefits: [
                              ...prev.benefits,
                              benefitDraft.trim(),
                            ].slice(0, 25),
                          }));
                          setBenefitDraft('');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {form.benefits.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-800/60"
                      >
                        <span className="truncate">{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              benefits: prev.benefits.filter(
                                (_, idx) => idx !== i,
                              ),
                            }))
                          }
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Platforms */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Supported Platforms
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={platformDraft}
                      onChange={(e) => setPlatformDraft(e.target.value)}
                      placeholder="e.g., Web, iOS, Android, macOS"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (platformDraft.trim()) {
                          setForm((prev) => ({
                            ...prev,
                            supportedPlatforms: [
                              ...prev.supportedPlatforms,
                              platformDraft.trim(),
                            ].slice(0, 12),
                          }));
                          setPlatformDraft('');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {form.supportedPlatforms.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              supportedPlatforms:
                                prev.supportedPlatforms.filter(
                                  (_, idx) => idx !== i,
                                ),
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      placeholder="Add keyword tag..."
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagDraft.trim()) {
                          setForm((prev) => ({
                            ...prev,
                            tags: [...prev.tags, tagDraft.trim()].slice(0, 15),
                          }));
                          setTagDraft('');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {form.tags.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((_, idx) => idx !== i),
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    SEO Title ({form.seoTitle.length}/140)
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={form.seoTitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, seoTitle: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    SEO Description ({form.seoDescription.length}/320)
                  </label>
                  <input
                    type="text"
                    maxLength={320}
                    value={form.seoDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        seoDescription: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
