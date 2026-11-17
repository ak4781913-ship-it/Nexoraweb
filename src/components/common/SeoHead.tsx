import { useEffect } from 'react';
import { useSiteData } from '../../context/SiteDataContext';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noIndex?: boolean;
  structuredData?:
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  noIndex = false,
  structuredData,
}: SeoHeadProps) {
  const { settings } = useSiteData();

  useEffect(() => {
    document.title = title;
    const configuredDomain = (settings.canonicalDomain || '')
      .trim()
      .replace(/\/+$/, '');
    const origin = configuredDomain || window.location.origin;
    const canonicalUrl = canonicalPath
      ? `${origin}${canonicalPath}`
      : `${origin}${window.location.pathname}`;

    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow',
    );
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    const effectiveOgImage = ogImage || settings.ogImageUrl || '/mawa-og.png';
    const fullImg = effectiveOgImage.startsWith('http')
      ? effectiveOgImage
      : `${origin}${effectiveOgImage}`;
    upsertMeta('property', 'og:image', fullImg);
    upsertMeta('name', 'twitter:image', fullImg);

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    document
      .querySelectorAll('script[data-mawa-jsonld="true"]')
      .forEach((node) => node.remove());

    const legacyScript = document.getElementById('mawa-dynamic-jsonld');
    if (legacyScript) legacyScript.remove();

    if (structuredData) {
      const schemas = Array.isArray(structuredData)
        ? structuredData
        : [structuredData];
      schemas.forEach((schema, idx) => {
        const script = document.createElement('script');
        script.id = idx === 0 ? 'mawa-dynamic-jsonld' : `mawa-dynamic-jsonld-${idx}`;
        script.setAttribute('data-mawa-jsonld', 'true');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    return () => {
      document
        .querySelectorAll('script[data-mawa-jsonld="true"]')
        .forEach((node) => node.remove());
    };
  }, [
    title,
    description,
    canonicalPath,
    ogType,
    ogImage,
    noIndex,
    structuredData,
    settings.canonicalDomain,
    settings.ogImageUrl,
  ]);

  return null;
}
