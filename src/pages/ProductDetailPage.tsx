import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MessageSquarePlus,
  Monitor,
  Star,
  Wrench,
  X,
} from 'lucide-react';
import { NexoraLogo } from '../components/common/NexoraLogo';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { isValidExternalUrl, ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import {
  fetchAllProductsAdmin,
  fetchApprovedReviewsByProduct,
  submitProductReview,
  trackAnalyticsEvent,
} from '../services/firestoreService';
import type { Product, ProductReview } from '../types/nexora';
import { isSafeAssetUrl } from '../utils/url';
import { checkClientCooldown, markClientCooldown } from '../utils/rateLimit';
import { NotFoundPage } from './NotFoundPage';

function getEmbedVideoUrl(url?: string): string | null {
  if (!url || !isValidExternalUrl(url)) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.replace(/\//g, '');
      if (/^\d{4,15}$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';

  const { products, categories, settings, loading: siteLoading } = useSiteData();
  const { isAdmin, loading: authLoading } = useAuth();

  const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!product || isPreviewMode) return;
    void trackAnalyticsEvent({
      eventType: 'product_view',
      path: `/products/${product.slug}`,
      productId: product.id,
      productSlug: product.slug,
      referrerSource: 'catalog',
    });
  }, [product, isPreviewMode]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetchApprovedReviewsByProduct(product.slug)
      .then((list) => {
        if (!cancelled) setReviews(list);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const explicitIds = product.relatedProductIds || [];
    const explicit = explicitIds
      .map((rid) => products.find((p) => (p.id === rid || p.slug === rid) && p.id !== product.id))
      .filter((p): p is Product => Boolean(p));
    const sameCategory = products.filter(
      (p) =>
        p.id !== product.id &&
        p.categoryId === product.categoryId &&
        !explicit.some((e) => e.id === p.id),
    );
    const others = products.filter(
      (p) =>
        p.id !== product.id &&
        p.categoryId !== product.categoryId &&
        !explicit.some((e) => e.id === p.id),
    );
    return [...explicit, ...sameCategory, ...others].slice(0, 3);
  }, [products, product]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

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
  const hasDownloadUrl = isValidExternalUrl(product.downloadUrl || '');
  const embedVideoUrl = getEmbedVideoUrl(product.demoVideoUrl);
  const heroImage =
    product.coverImageUrl || product.screenshotGallery[0] || '';
  const isUnpublishedStatus =
    product.publicationStatus === 'Draft' ||
    product.publicationStatus === 'Archived';
  const matchedCategory = categories.find(
    (c) => c.id === product.categoryId || c.slug === product.categoryId,
  );
  const categoryPath = `/categories/${matchedCategory?.slug || product.categoryId}`;

  const siteOrigin = (settings.canonicalDomain || '').trim().replace(/\/+$/, '') || window.location.origin;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
      applicationCategory: product.categoryName,
      operatingSystem: product.supportedPlatforms.join(', ') || 'Web',
      softwareVersion: product.version || undefined,
      description: product.seoDescription || product.shortDescription,
      url: hasWebsite
        ? product.officialWebsiteUrl
        : `${siteOrigin}/products/${product.slug}`,
      publisher: {
        '@type': 'Organization',
        name: settings.brandName || 'MAWA',
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteOrigin}/products` },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `${siteOrigin}/products/${product.slug}`,
        },
      ],
    },
  ];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewNotice(null);

    if (authorName.trim().length < 2) {
      setReviewError('Please provide your name.');
      return;
    }
    if (reviewTitle.trim().length < 2) {
      setReviewError('Please add a brief headline for your review.');
      return;
    }
    if (comment.trim().length < 5) {
      setReviewError('Please enter at least a few words of feedback.');
      return;
    }
    if (honeypot.trim().length > 0) {
      setReviewNotice('Thank you! Your feedback has been submitted.');
      return;
    }

    const cooldownKey = `review_${product.id}`;
    const waitSeconds = checkClientCooldown(cooldownKey, 20_000);
    if (waitSeconds > 0) {
      setReviewError(`Please wait ${waitSeconds} seconds before submitting another review.`);
      return;
    }

    setReviewSubmitting(true);
    try {
      await submitProductReview({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        authorName,
        rating,
        title: reviewTitle,
        comment,
        suggestion,
        honeypot: '',
      });
      markClientCooldown(cooldownKey);
      setAuthorName('');
      setRating(5);
      setReviewTitle('');
      setComment('');
      setSuggestion('');
      setReviewNotice(
        'Thank you! Your review has been queued for administrator moderation and will appear once approved.',
      );
    } catch {
      setReviewError('Unable to submit review right now. Please try again shortly.');
    } finally {
      setReviewSubmitting(false);
    }
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
        title={product.seoTitle || `${product.name} — A MAWA Product`}
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

      {/* Hero Section */}
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
                    {product.version && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span className="font-mono">{product.version}</span>
                      </>
                    )}
                  </div>
                  <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {product.name}
                  </h1>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
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
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed whitespace-nowrap"
                  >
                    Official Website Pending
                  </button>
                )}

                {hasDownloadUrl && (
                  <a
                    href={product.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      void trackAnalyticsEvent({
                        eventType: 'download_click',
                        path: `/products/${product.slug}`,
                        productId: product.id,
                        productSlug: product.slug,
                      })
                    }
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    Download Package
                  </a>
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

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Overview */}
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Overview
              </h2>
              <div className="mt-4 space-y-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.shortDescription}
              </div>
            </div>

            {/* Optional Demo Video */}
            {embedVideoUrl && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Product Walkthrough
                </h2>
                <div className="mt-5 aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                  <iframe
                    src={embedVideoUrl}
                    title={`${product.name} walkthrough video`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Key Features */}
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

            {/* Benefits */}
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

            {/* Screenshots Gallery */}
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

            {/* Release Changelog */}
            {product.changelog && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Release Notes &amp; Changelog
                </h2>
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                  {product.changelog}
                </div>
              </div>
            )}

            {/* Community Reviews & Feedback (Moderated) */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    Community Reviews &amp; Suggestions
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    All feedback is reviewed by MAWA moderators prior to public
                    display.
                  </p>
                </div>
                {averageRating && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] px-3 py-1.5 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="tabular-nums text-slate-900 dark:text-white">
                      {averageRating} / 5.0
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="h-24 rounded-xl bg-slate-100 dark:bg-[#0B1326] animate-pulse" />
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {rev.title}
                        </h3>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }, (_, idx) => (
                            <Star
                              key={idx}
                              className={`h-3.5 w-3.5 ${
                                idx < rev.rating ? 'fill-amber-500' : 'opacity-25'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                      {rev.suggestion && (
                        <p className="text-xs text-blue-700 dark:text-cyan-400 pt-1">
                          Suggestion: {rev.suggestion}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                        — {rev.authorName}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No published reviews for this product yet. Be the first to
                  share your experience below.
                </p>
              )}

              {/* Submit Review Form */}
              <form
                onSubmit={handleReviewSubmit}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080F22] p-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <MessageSquarePlus className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                  Leave a Review or Feature Suggestion
                </div>

                <input
                  type="text"
                  name="company_ref"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Rating
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white"
                    >
                      <option value={5}>5 Stars — Excellent</option>
                      <option value={4}>4 Stars — Very Good</option>
                      <option value={3}>3 Stars — Good</option>
                      <option value={2}>2 Stars — Fair</option>
                      <option value={1}>1 Star — Needs Work</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Concise summary of your experience"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Review Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share how you use this product and what works well..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Feature Suggestion (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Any feature or integration you would love to see next"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060B19] text-slate-900 dark:text-white"
                  />
                </div>

                {reviewError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {reviewError}
                  </p>
                )}
                {reviewNotice && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {reviewNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Rail */}
          <aside className="lg:col-span-4 space-y-6">
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

              {(product.releaseDate || product.launchDate) && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Release Date
                  </h3>
                  <p className="mt-1 text-sm font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {product.releaseDate || product.launchDate}
                  </p>
                </div>
              )}

              {product.version && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Version
                  </h3>
                  <p className="mt-1 text-sm font-mono text-slate-800 dark:text-slate-200">
                    {product.version}
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

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080F22] p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <NexoraLogo
                  logoUrl={settings.brandLogoUrl}
                  brandName={settings.brandName || 'MAWA'}
                  size="sm"
                  showWordmark={false}
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  A MAWA Product
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Engineered and maintained as part of the official MAWA
                digital products portfolio.
              </p>
              <Link
                to="/about"
                className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn about MAWA standards
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Related MAWA Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
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
