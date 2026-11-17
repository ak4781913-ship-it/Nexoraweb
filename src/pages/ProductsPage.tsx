import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { ProductCard } from '../components/products/ProductCard';
import { useSiteData } from '../context/SiteDataContext';
import type {
  PricingType,
  Product,
  ProductType,
  PublicationStatus,
} from '../types/nexora';

const PAGE_SIZE = 9;

const PRICING_OPTIONS: Array<'All' | PricingType> = [
  'All',
  'Free',
  'Freemium',
  'Premium',
];

const STATUS_OPTIONS: Array<'All' | PublicationStatus> = [
  'All',
  'Live',
  'Coming Soon',
  'Under Development',
];

const PRODUCT_TYPES: Array<'All' | ProductType> = [
  'All',
  'AI Tool',
  'Digital Platform',
  'Web Application',
  'Mobile Application',
  'Online Service',
  'Website',
];

type SortOption = 'order' | 'featured' | 'latest' | 'az';

export function ProductsPage() {
  const { products, categories, loading } = useSiteData();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  const [queryText, setQueryText] = useState(
    () => searchParams.get('q') || '',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [pricingFilter, setPricingFilter] = useState<'All' | PricingType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PublicationStatus>(
    'All',
  );
  const [typeFilter, setTypeFilter] = useState<'All' | ProductType>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [currentPage, setCurrentPage] = useState(1);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    const paramQ = searchParams.get('q') || '';
    setQueryText(paramQ);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    queryText,
    categoryFilter,
    pricingFilter,
    statusFilter,
    typeFilter,
    platformFilter,
    featuredOnly,
    sortBy,
  ]);

  const availablePlatforms = useMemo(() => {
    const set = new Set<string>(['Web', 'Mobile Web', 'Desktop', 'Windows', 'Android']);
    products.forEach((p) =>
      p.supportedPlatforms.forEach((plat) => {
        if (plat.trim()) set.add(plat.trim());
      }),
    );
    return ['All', ...Array.from(set)];
  }, [products]);

  const spotlightProduct = useMemo(
    () => products.find((p) => p.featured) || products[0] || null,
    [products],
  );

  const handleQueryChange = (value: string) => {
    setQueryText(value);
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const resetFilters = () => {
    setQueryText('');
    setCategoryFilter('All');
    setPricingFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
    setPlatformFilter('All');
    setFeaturedOnly(false);
    setSortBy('order');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    queryText.trim() !== '' ||
    categoryFilter !== 'All' ||
    pricingFilter !== 'All' ||
    statusFilter !== 'All' ||
    typeFilter !== 'All' ||
    platformFilter !== 'All' ||
    featuredOnly;

  const filteredProducts = useMemo(() => {
    const q = queryText.trim().toLowerCase();

    const list = products.filter((p) => {
      if (categoryFilter !== 'All') {
        const matchesCat =
          p.categoryId === categoryFilter || p.categoryName === categoryFilter;
        if (!matchesCat) return false;
      }
      if (pricingFilter !== 'All' && p.pricingType !== pricingFilter) {
        return false;
      }
      if (statusFilter !== 'All' && p.publicationStatus !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'All' && p.productType !== typeFilter) {
        return false;
      }
      if (
        platformFilter !== 'All' &&
        !p.supportedPlatforms.some(
          (plat) => plat.toLowerCase() === platformFilter.toLowerCase(),
        )
      ) {
        return false;
      }
      if (featuredOnly && !p.featured) {
        return false;
      }
      if (q) {
        const haystack = [
          p.name,
          p.shortDescription,
          p.fullDescription,
          p.categoryName,
          p.productType,
          ...p.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.displayOrder - b.displayOrder;
      }
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'latest') {
        const dateA = a.releaseDate || a.launchDate || '';
        const dateB = b.releaseDate || b.launchDate || '';
        return dateB.localeCompare(dateA) || a.displayOrder - b.displayOrder;
      }
      return a.displayOrder - b.displayOrder;
    });
  }, [
    products,
    queryText,
    categoryFilter,
    pricingFilter,
    statusFilter,
    typeFilter,
    platformFilter,
    featuredOnly,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, safePage]);

  const comparedProducts = useMemo(
    () =>
      compareIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [compareIds, products],
  );

  const toggleCompare = (product: Product) => {
    setCompareIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), product.id];
      }
      return [...prev, product.id];
    });
  };

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SeoHead
        title="Products Directory — MAWA"
        description="Search and filter digital products, AI tools, web applications, and online platforms built under the MAWA brand."
        canonicalPath="/products"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
              MAWA Directory
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Digital Products &amp; Platforms
            </h1>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Explore all publicly released and upcoming software applications, AI
              tools, and online services created by MAWA.
            </p>
          </div>
          {spotlightProduct && (
            <Link
              to={`/products/${spotlightProduct.slug}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-4 max-w-sm hover:border-blue-500 transition-colors shrink-0"
            >
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                Featured Spotlight
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {spotlightProduct.name}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {spotlightProduct.shortDescription}
              </p>
            </Link>
          )}
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Search and Filter Controls */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
              <div className="sm:col-span-2 lg:col-span-4 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={queryText}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search by product name, keyword, or tag..."
                  aria-label="Search products"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by product type"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as 'All' | ProductType)
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All Formats' : t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by platform"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  {availablePlatforms.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat === 'All' ? 'All Platforms' : plat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="order">Sort: Curated Order</option>
                  <option value="featured">Sort: Featured First</option>
                  <option value="latest">Sort: Latest Releases</option>
                  <option value="az">Sort: A to Z</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3 max-w-full">
                <div
                  className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#060B19] max-w-full"
                  role="group"
                  aria-label="Filter by pricing"
                >
                  {PRICING_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPricingFilter(opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        pricingFilter === opt
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div
                  className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#060B19] max-w-full"
                  role="group"
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStatusFilter(opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        statusFilter === opt
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setFeaturedOnly((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    featuredOnly
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  Featured Only
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="tabular-nums">
                  {filteredProducts.length}{' '}
                  {filteredProducts.length === 1 ? 'result' : 'results'}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div ref={resultsTopRef} />

          {/* Product Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1326] animate-pulse"
                />
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isCompared={compareIds.includes(product.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Products pagination"
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/80"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filteredProducts.length)} of{' '}
                    {filteredProducts.length} products
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => goToPage(safePage - 1)}
                      aria-label="Previous page"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => goToPage(pageNum)}
                          aria-current={pageNum === safePage ? 'page' : undefined}
                          className={`h-8 min-w-8 px-2.5 text-xs font-medium rounded-lg transition-colors tabular-nums ${
                            pageNum === safePage
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => goToPage(safePage + 1)}
                      aria-label="Next page"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </nav>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center max-w-2xl mx-auto">
              <SlidersHorizontal className="h-8 w-8 text-slate-400 mx-auto" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {products.length === 0
                  ? 'No Public Products Published Yet'
                  : 'No Products Match Your Active Filters'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {products.length === 0
                  ? 'MAWA products are currently in preparation and will appear here as soon as they are verified and published.'
                  : 'Try clearing one or more filters or adjusting your search keywords.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <Link
                    to="/categories"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Explore Categories
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Compare Tray */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-2rem)] max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0C1428] p-3.5 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Scale className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              Compare ({comparedProducts.length}/3):{' '}
              <span className="font-normal text-slate-600 dark:text-slate-300">
                {comparedProducts.map((p) => p.name).join(', ')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Compare Now
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {compareModalOpen && comparedProducts.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Compare MAWA Products"
          onClick={() => setCompareModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                MAWA Product Comparison
              </h2>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                aria-label="Close comparison"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 pr-4 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Specification
                    </th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Category
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.categoryName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Format
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.productType}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Pricing
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.pricingType}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Status
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.publicationStatus}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Platforms
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.supportedPlatforms.join(', ') || 'Web'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                      Key Highlights
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {p.features.slice(0, 3).join(' · ') || p.shortDescription}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
