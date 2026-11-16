import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Wrench,
} from 'lucide-react';
import type { Product } from '../../types/nexora';
import { isValidExternalUrl } from '../../utils/url';
import { SafeImage } from '../common/SafeImage';

export { isValidExternalUrl };

function getStatusIndicator(status: Product['publicationStatus']) {
  switch (status) {
    case 'Live':
      return {
        label: 'Live',
        Icon: CheckCircle2,
        textClass: 'text-emerald-700 dark:text-emerald-400',
      };
    case 'Coming Soon':
      return {
        label: 'Coming Soon',
        Icon: Clock,
        textClass: 'text-blue-700 dark:text-blue-400',
      };
    case 'Under Development':
      return {
        label: 'Under Development',
        Icon: Wrench,
        textClass: 'text-amber-700 dark:text-amber-400',
      };
    default:
      return {
        label: status,
        Icon: Clock,
        textClass: 'text-slate-600 dark:text-slate-400',
      };
  }
}

export function ProductCard({ product }: { product: Product }) {
  const statusInfo = getStatusIndicator(product.publicationStatus);
  const StatusIcon = statusInfo.Icon;
  const hasWebsite = isValidExternalUrl(product.officialWebsiteUrl);
  const previewImage =
    product.coverImageUrl || product.screenshotGallery[0] || '';

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] overflow-hidden transition-colors hover:border-blue-500/50 dark:hover:border-blue-500/40">
      <Link
        to={`/products/${product.slug}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-[#0F1830] block"
      >
        <SafeImage
          src={previewImage}
          alt={`${product.name} preview`}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {product.logoUrl && (
          <div className="absolute bottom-3 left-3 h-11 w-11 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-[#060B19]/95 p-1.5 shadow-xs">
            <SafeImage
              src={product.logoUrl}
              alt={`${product.name} logo`}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>{product.categoryName}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{product.pricingType}</span>
          <span aria-hidden="true">&middot;</span>
          <span
            className={`inline-flex items-center gap-1 ${statusInfo.textClass}`}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {statusInfo.label}
          </span>
        </div>

        <h3 className="mt-2.5 text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
          <Link
            to={`/products/${product.slug}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 flex-1">
          {product.shortDescription}
        </p>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <Link
            to={`/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            Explore Details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {hasWebsite ? (
            <a
              href={product.officialWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              Visit Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Official website link will be available once released"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed whitespace-nowrap shrink-0"
            >
              Website Pending
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
