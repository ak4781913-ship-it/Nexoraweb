import { useEffect, useState } from 'react';
import { isSafeAssetUrl } from '../../utils/url';

interface NexoraLogoProps {
  logoUrl?: string;
  brandName?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function NexoraLogo({
  logoUrl,
  brandName = 'NEXORA',
  size = 'md',
  showWordmark = true,
}: NexoraLogoProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const safeLogoUrl = logoUrl && isSafeAssetUrl(logoUrl) ? logoUrl : '';

  const dims =
    size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const textClass =
    size === 'sm'
      ? 'text-base font-bold tracking-tight'
      : size === 'lg'
        ? 'text-xl font-bold tracking-tight'
        : 'text-lg font-bold tracking-tight';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {safeLogoUrl && !imgError ? (
        <img
          src={safeLogoUrl}
          alt={brandName}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`${dims} rounded-lg object-contain`}
        />
      ) : (
        <svg
          className={`${dims} shrink-0`}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <rect width="64" height="64" rx="14" className="fill-[#0B1226]" />
          <rect
            x="1.5"
            y="1.5"
            width="61"
            height="61"
            rx="12.5"
            className="stroke-slate-700/80"
            strokeWidth="1.5"
          />
          <path
            d="M18 46V18H25.2L39.6 37.2V18H46V46H38.8L24.4 26.8V46H18Z"
            fill="url(#nexora_brand_grad)"
          />
          <path
            d="M46 18L36 28.5"
            stroke="#22D3EE"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="nexora_brand_grad"
              x1="18"
              y1="18"
              x2="46"
              y2="46"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#60A5FA" />
              <stop offset="0.55" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      )}
      {showWordmark && (
        <span
          className={`font-display ${textClass} text-slate-900 dark:text-white`}
        >
          {brandName}
        </span>
      )}
    </span>
  );
}
