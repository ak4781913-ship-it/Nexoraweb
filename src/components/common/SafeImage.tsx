import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { isSafeAssetUrl } from '../../utils/url';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  loading?: 'lazy' | 'eager';
}

export function SafeImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  loading = 'lazy',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const safeSrc = src && isSafeAssetUrl(src) ? src : '';

  if (!safeSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/70 dark:from-[#0C1428] dark:via-[#0A1124] dark:to-[#111C38] text-slate-400 dark:text-slate-500 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="h-6 w-6 text-blue-600/70 dark:text-blue-400/70" />
        {fallbackLabel && (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center line-clamp-2 max-w-[16rem]">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
