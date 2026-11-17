import { auth } from '../lib/firebase';
import type { Product } from '../types/nexora';

const API_BASE = (import.meta.env.VITE_AI_API_URL || '').replace(/\/+$/, '');

export interface AiStatusResponse {
  configured: boolean;
  model: string;
  usage: {
    publicAssistantCalls: number;
    recommendationCalls: number;
    adminAssistCalls: number;
    rejectedRateLimit: number;
    lastActivityAt: string | null;
  };
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface RecommendationItem {
  slug: string;
  reason: string;
  fitLabel: string;
}

export interface AdminAssistResult {
  shortDescription?: string;
  fullDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  suggestedTags?: string[];
  faqDrafts?: Array<{ question: string; answer: string }>;
  polishedText?: string;
}

export function buildCatalogSummary(products: Product[]): string {
  if (products.length === 0) {
    return 'No public products are currently live in the catalog yet.';
  }
  return products
    .slice(0, 40)
    .map((p) => {
      const parts = [
        `Name: ${p.name}`,
        `Slug: ${p.slug}`,
        `Route: /products/${p.slug}`,
        `Status: ${p.publicationStatus}`,
        `Category: ${p.categoryName}`,
        `Type: ${p.productType}`,
        `Pricing: ${p.pricingType}`,
        `Platforms: ${p.supportedPlatforms.join(', ') || 'Web'}`,
        `Summary: ${p.shortDescription}`,
      ];
      if (p.officialWebsiteUrl) {
        parts.push(`Official URL: ${p.officialWebsiteUrl}`);
      }
      if (p.tags.length > 0) {
        parts.push(`Tags: ${p.tags.join(', ')}`);
      }
      return parts.join(' | ');
    })
    .join('\n');
}

export async function fetchAiStatus(): Promise<AiStatusResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/status`);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return (await res.json()) as AiStatusResponse;
  } catch {
    return null;
  }
}

export async function askMawaAssistant(
  question: string,
  products: Product[],
  history: ChatTurn[],
): Promise<{ answer: string; fallbackUsed: boolean; model?: string }> {
  const catalogSummary = buildCatalogSummary(products);
  try {
    const res = await fetch(`${API_BASE}/api/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, catalogSummary, history }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = (await res.json()) as { answer?: string; model?: string };
      if (data.answer) {
        return { answer: data.answer, fallbackUsed: false, model: data.model };
      }
    }
  } catch {
    // Fall back gracefully on static hosting (e.g. Hostinger without AI proxy URL)
  }

  // Deterministic local catalog matcher (never invents fake AI output; clearly labeled offline catalog lookup)
  const q = question.toLowerCase();
  const matched = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.tags.some((t) => q.includes(t.toLowerCase()) || t.toLowerCase().includes(q)),
  );

  if (matched.length > 0) {
    const list = matched
      .slice(0, 3)
      .map(
        (p) =>
          `• ${p.name} (${p.publicationStatus}, ${p.pricingType}) — ${p.shortDescription} View: /products/${p.slug}`,
      )
      .join('\n');
    return {
      fallbackUsed: true,
      answer: `Catalog matches from MAWA directory (AI server is currently offline or unconfigured on this host):\n\n${list}`,
    };
  }

  return {
    fallbackUsed: true,
    answer:
      'Live AI responses require an active MAWA AI backend (configured on AI Studio/Node server or via VITE_AI_API_URL). Meanwhile, you can browse /products, /categories, /roadmap, /downloads, /faq, or reach out at /contact.',
  };
}

export async function requestAiProductRecommendations(
  goal: string,
  platform: string,
  pricing: string,
  products: Product[],
): Promise<{
  summary: string;
  recommendations: RecommendationItem[];
  fallbackUsed: boolean;
}> {
  const catalogSummary = buildCatalogSummary(products);
  try {
    const res = await fetch(`${API_BASE}/api/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, platform, pricing, catalogSummary }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = (await res.json()) as {
        summary?: string;
        recommendations?: RecommendationItem[];
      };
      if (data.recommendations) {
        return {
          summary: data.summary || '',
          recommendations: data.recommendations,
          fallbackUsed: false,
        };
      }
    }
  } catch {
    // Graceful static-host fallback
  }

  const terms = goal
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const scored = products
    .map((p) => {
      const hay = `${p.name} ${p.shortDescription} ${p.categoryName} ${p.tags.join(' ')} ${p.supportedPlatforms.join(' ')}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (hay.includes(term)) score += 2;
      }
      if (platform !== 'Any' && p.supportedPlatforms.some((sp) => sp.toLowerCase().includes(platform.toLowerCase()))) {
        score += 2;
      }
      if (pricing !== 'Any' && p.pricingType.toLowerCase() === pricing.toLowerCase()) {
        score += 1;
      }
      if (p.featured) score += 0.5;
      return { p, score };
    })
    .filter((item) => item.score > 0 || products.length <= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    fallbackUsed: true,
    summary:
      scored.length > 0
        ? 'Matched using local catalog filtering (connect AI backend for semantic recommendations).'
        : 'No exact catalog match was found for those criteria yet. Check our Roadmap or all Products.',
    recommendations: scored.map(({ p }) => ({
      slug: p.slug,
      fitLabel: `${p.categoryName} · ${p.pricingType}`,
      reason: p.shortDescription,
    })),
  };
}

export async function requestAdminAiAssist(params: {
  task: 'description' | 'seo' | 'tags' | 'faq' | 'polish';
  productName: string;
  draftText: string;
  categoryName?: string;
  productType?: string;
}): Promise<AdminAssistResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in as an authorized administrator to use AI Content Assistant.');
  }
  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/ai/admin-assist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(params),
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(
      'AI backend endpoint is unavailable on this static host. Configure VITE_AI_API_URL or run the Node server.',
    );
  }
  const data = (await res.json()) as {
    result?: AdminAssistResult;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || 'Admin AI request could not be completed.');
  }
  return data.result || {};
}
