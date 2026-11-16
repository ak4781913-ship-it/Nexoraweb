import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Monitor,
  Wrench,
  X,
} from 'lucide-react';
import { NexoraLogo } from '../components/common/NexoraLogo';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { isValidExternalUrl, ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { fetchAllProductsAdmin } from '../services/firestoreService';
import type { Product } from '../types/nexora';
import { isSafeAssetUrl } from '../utils/url';
import { NotFoundPage } from './NotFoundPage';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';

  const { products, categories, settings, loading: siteLoading } = useSiteData();
  const { isAdmin, loading: authLoading } = useAuth();

  const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreviewMode || !isAdmin) {
      setAdminProducts(null);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    setAdminLoading(true);
    fetchAllProductsAdmin()
      .then((list) => {
        if (!cancelled) setAdminProducts(list);
      })
      .catch(() => {
        if (!cancelled) setAdminProducts([]);
      })
      .finally(() => {
        if (!cancelled) setAdminLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPreviewMode, isAdmin]);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage]);

  const product = useMemo(() => {
    const publicMatch = products.find((p) => p.slug === slug);
    if (publicMatch) return publicMatch;
    if (isPreviewMode && isAdmin && adminProducts) {
      return adminProducts.find((p) => p.slug === slug);
    }
    return undefined;
  }, [products, slug, isPreviewMode, isAdmin, adminProducts]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.categoryId === product.categoryId,
    );
    if (sameCategory.length >= 3) return sameCategory.slice(0, 3);
    const others = products.filter(
      (p) => p.id !== product.id && p.categoryId !== product.categoryId,
    );
    return [...sameCategory, ...others].slice(0, 3);
  }, [products, product]);

  if (siteLoading || (isPreviewMode && (authLoading || (isAdmin && adminLoading)))) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return <NotFoundPage />;
  }

  const hasWebsite = isValidExternalUrl(product.officialWebsiteUrl);
  const heroImage =
    product.coverImageUrl || product.screenshotGallery[0] || '';
  const isUnpublishedStatus =
    product.publicationStatus === 'Draft' ||
    product.publicationStatus === 'Archived';
  const matchedCategory = categories.find(
    (c) => c.id === product.categoryId || c.slug === product.categoryId,
  );
  const categoryPath = `/categories/${matchedCategory?.slug || product.categoryId}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    applicationCategory: product.categoryName,
    operatingSystem: product.supportedPlatforms.join(', ') || 'Web',
    description: product.seoDescription || product.shortDescription,
    url: hasWebsite
      ? product.officialWebsiteUrl
      : `${window.location.origin}/products/${product.slug}`,
    publisher: {
      '@type': 'Organization',
      name: settings.brandName || 'NEXORA',
    },
    ...(product.pricingType === 'Free'
      ? {
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }
      : {}),
  };

  const StatusIcon =
    product.publicationStatus === 'Live'
      ? CheckCircle2
      : product.publicationStatus === 'Under Development'
        ? Wrench
        : Clock;

  return (
    <>
      <SeoHead
        title={product.seoTitle || `${product.name} — A NEXORA Product`}
        description={product.seoDescription || product.shortDescription}
        canonicalPath={`/products/${product.slug}`}
        ogImage={heroImage || undefined}
        noIndex={isPreviewMode || isUnpublishedStatus}
        structuredData={structuredData}
      />

      {isPreviewMode && isAdmin && isUnpublishedStatus && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 py-2.5 px-4 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
          Administrator Preview Mode — This product is currently in{' '}
          {product.publicationStatus} status and is not visible to the public.
        </div>
      )}

      {/* 1–6: Product Hero, Logo, Name, Short Description, Status, Official Website Button */}
      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Products
          </Link>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326] p-2.5 flex items-center justify-center shrink-0">
                  {product.logoUrl ? (
                    <SafeImage
                      src={product.logoUrl}
                      alt={`${product.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <NexoraLogo showWordmark={false} size="md" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Link
                      to={categoryPath}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {product.categoryName}
                    </Link>
                    <span aria-hidden="true">&middot;</span>
                    <span>{product.productType}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400">
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {product.publicationStatus}
                    </span>
                  </div>
                  <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {product.name}
                  </h1>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {hasWebsite ? (
                  <a
                    href={product.officialWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors whitespace-nowrap"
                  >
                    Visit Official Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed whitespace-nowrap"
                    >
                      Official Website Pending
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Official website link will be available upon release.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[16/10] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0B1326]">
                <SafeImage
                  src={heroImage}
                  alt={`${product.name} interface preview`}
                  fallbackLabel={product.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7–12: Overview, Key Features, Benefits, Screenshots, Supported Platforms, Pricing */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* 7. Overview */}
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Overview
              </h2>
              <div className="mt-4 space-y-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.shortDescription}
              </div>
            </div>

            {/* 8. Key Features */}
            {product.features.length > 0 && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Key Features
                </h2>
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] p-4"
                    >
                      <Check className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-1" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 9. Benefits */}
            {product.benefits.length > 0 && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Benefits
                </h2>
                <ul className="mt-5 space-y-3">
                  {product.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-base text-slate-600 dark:text-slate-300"
                    >
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1.5 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 10. Screenshots Gallery */}
            {product.screenshotGallery.length > 0 && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Screenshots Gallery
                </h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.screenshotGallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxImage(imgUrl)}
                      className="group aspect-[16/10] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-[#0B1326] text-left focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <SafeImage
                        src={imgUrl}
                        alt={`${product.name} screenshot ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Supported Platforms, Pricing, Metadata, NEXORA Signature */}
          <aside className="lg:col-span-4 space-y-6">
            {/* 11. Supported Platforms & 12. Pricing Information */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pricing Model
                </h3>
                <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">
                  {product.pricingType}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {product.pricingType === 'Free'
                    ? 'Available at no cost with full public access.'
                    : product.pricingType === 'Freemium'
                      ? 'Core tools are accessible free of charge, with optional upgraded plans.'
                      : 'Dedicated premium software tier with full commercial capabilities.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Supported Platforms
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-2 text-sm text-slate-800 dark:text-slate-200">
                  {product.supportedPlatforms.length > 0 ? (
                    product.supportedPlatforms.map((plat, i) => (
                      <span key={plat} className="inline-flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                        {plat}
                        {i < product.supportedPlatforms.length - 1 && (
                          <span className="text-slate-300 dark:text-slate-700 ml-1">
                            /
                          </span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span>Web Browser</span>
                  )}
                </div>
              </div>

              {product.launchDate && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Release Date
                  </h3>
                  <p className="mt-1 text-sm font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {product.launchDate}
                  </p>
                </div>
              )}

              {product.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Topics
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {product.tags.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* 14. A NEXORA Product Brand Signature */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080F22] p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <NexoraLogo size="sm" showWordmark={false} />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  A NEXORA Product
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Engineered and maintained as part of the official NEXORA
                digital products portfolio.
              </p>
              <Link
                to="/about"
                className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn about NEXORA standards
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* 13. Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Related NEXORA Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && isSafeAssetUrl(lightboxImage) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close screenshot preview"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged product screenshot"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded-xl border border-slate-700 object-contain"
          />
        </div>
      )}
    </>
  );
}
