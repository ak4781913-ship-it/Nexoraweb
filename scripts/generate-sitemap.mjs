import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.warn('[generate-sitemap] dist/ directory not found; run vite build first.');
  process.exit(0);
}

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)',
};

if (fs.existsSync(configPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firebaseConfig = {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || parsed.projectId || '',
      firestoreDatabaseId:
        process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
        parsed.firestoreDatabaseId ||
        '(default)',
    };
  } catch {
    // Ignore malformed config override; fallback cleanly
  }
}

function resolveBaseUrl() {
  const siteUrl = (process.env.SITE_URL || '').trim();
  const appUrl = (process.env.APP_URL || '').trim();
  const candidate =
    siteUrl && siteUrl !== 'MY_APP_URL'
      ? siteUrl
      : appUrl && appUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(appUrl)
        ? appUrl
        : '';
  return candidate ? candidate.replace(/\/+$/, '') : 'https://REPLACE-WITH-YOUR-DOMAIN';
}

const baseUrl = resolveBaseUrl();
const isPlaceholderDomain = baseUrl.includes('REPLACE-WITH-YOUR-DOMAIN');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/categories', changefreq: 'weekly', priority: '0.8' },
  { path: '/roadmap', changefreq: 'weekly', priority: '0.7' },
  { path: '/downloads', changefreq: 'weekly', priority: '0.7' },
  { path: '/changelog', changefreq: 'weekly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/developers', changefreq: 'monthly', priority: '0.6' },
  { path: '/partnerships', changefreq: 'monthly', priority: '0.6' },
  { path: '/business', changefreq: 'monthly', priority: '0.6' },
  { path: '/updates', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

async function fetchPublicCatalogEntries() {
  const dynamicRoutes = [];
  if (!firebaseConfig.projectId) return dynamicRoutes;

  const queryEndpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId,
  )}/databases/${encodeURIComponent(firebaseConfig.firestoreDatabaseId)}/documents:runQuery`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(queryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'categories' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'publicationStatus' },
                op: 'EQUAL',
                value: { stringValue: 'Published' },
              },
            },
          },
        }),
      }),
      fetch(queryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'products' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'publicationStatus' },
                op: 'IN',
                value: {
                  arrayValue: {
                    values: [
                      { stringValue: 'Live' },
                      { stringValue: 'Coming Soon' },
                      { stringValue: 'Under Development' },
                    ],
                  },
                },
              },
            },
          },
        }),
      }),
    ]);

    if (catRes.ok) {
      const catRows = await catRes.json();
      for (const row of Array.isArray(catRows) ? catRows : []) {
        const slug = row?.document?.fields?.slug?.stringValue;
        if (slug && /^[a-z0-9-]+$/.test(slug)) {
          dynamicRoutes.push({
            path: `/categories/${slug}`,
            changefreq: 'weekly',
            priority: '0.7',
          });
        }
      }
    }

    if (prodRes.ok) {
      const prodRows = await prodRes.json();
      for (const row of Array.isArray(prodRows) ? prodRows : []) {
        const slug = row?.document?.fields?.slug?.stringValue;
        if (slug && /^[a-z0-9-]+$/.test(slug)) {
          dynamicRoutes.push({
            path: `/products/${slug}`,
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      }
    }
  } catch {
    console.warn(
      '[generate-sitemap] Skipping dynamic Firestore entries (network unavailable during build). Static routes generated.',
    );
  } finally {
    clearTimeout(timer);
  }

  return dynamicRoutes;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const dynamicRoutes = await fetchPublicCatalogEntries();
const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

const urls = allRoutes
  .map(
    (r) => `  <url>
    <loc>${escapeXml(`${baseUrl}${r.path}`)}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(
  `[generate-sitemap] Wrote dist/sitemap.xml (${allRoutes.length} URLs: ${STATIC_ROUTES.length} static + ${dynamicRoutes.length} dynamic) & dist/robots.txt for ${baseUrl}`,
);
if (isPlaceholderDomain) {
  console.warn(
    '[generate-sitemap] NOTICE: Using placeholder https://REPLACE-WITH-YOUR-DOMAIN. Pass SITE_URL=https://yourdomain.com before deploying dist/ to Hostinger.',
  );
}
