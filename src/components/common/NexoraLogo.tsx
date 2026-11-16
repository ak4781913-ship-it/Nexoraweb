import { useEffect, useState } from 'react';
import { isSafeAssetUrl } from '../../utils/url';

interface NexoraLogoProps {
  logoUrl?: string;
  brandName?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function NexoraLogo({
  logoUrl,
  brandName = 'MAWA',
  size = 'md',
  showWordmark = true,
  showTagline = false,
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
      ? 'text-base font-bold tracking-[0.06em]'
      : size === 'lg'
        ? 'text-xl font-extrabold tracking-[0.08em]'
        : 'text-lg font-bold tracking-[0.06em]';

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
          <defs>
            <linearGradient
              id="mawa_brand_bg"
              x1="6"
              y1="4"
              x2="58"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#0C1736" />
              <stop offset="100%" stopColor="#060B19" />
            </linearGradient>
            <linearGradient
              id="mawa_brand_grad"
              x1="12"
              y1="48"
              x2="52"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient
              id="mawa_swoosh_grad"
              x1="8"
              y1="44"
              x2="56"
              y2="18"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
          </defs>

          <rect width="64" height="64" rx="14" fill="url(#mawa_brand_bg)" />
          <rect
            x="1.25"
            y="1.25"
            width="61.5"
            height="61.5"
            rx="12.75"
            stroke="#1E2D52"
            strokeWidth="1.5"
          />

          <path
            d="M15.5 46V21.5L26 35L32.5 26.5"
            stroke="url(#mawa_brand_grad)"
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28.5 46L39.5 19.5L49.5 46"
            stroke="url(#mawa_brand_grad)"
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M33.2 37.5H45.2"
            stroke="#38BDF8"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          <path
            d="M10.5 39.5C18.5 46.5 38.5 43.5 52.5 22.5"
            stroke="url(#mawa_swoosh_grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          <path
            d="M50.5 12L52.1 15.9L56 17.5L52.1 19.1L50.5 23L48.9 19.1L45 17.5L48.9 15.9L50.5 12Z"
            fill="#E0F2FE"
          />
        </svg>
      )}
      {showWordmark && (
        <span className="inline-flex flex-col leading-none">
          <span
            className={`font-display ${textClass} text-slate-900 dark:text-white`}
          >
            {brandName}
          </span>
          {showTagline && (
            <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-cyan-300/80 mt-0.5">
              A Legacy of Innovation.
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export const BrandLogo = NexoraLogo;
