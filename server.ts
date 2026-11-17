import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import appletConfig from './firebase-applet-config.json' with { type: 'json' };

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const BOOTSTRAP_ADMIN_EMAIL = 'khanabs1512@gmail.com';
const MODEL_NAME = 'gemini-4-hydrogen';

const firebaseApiKey =
  process.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey;
const firebaseProjectId =
  process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId;
const firestoreDatabaseId =
  process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  appletConfig.firestoreDatabaseId;

function getConfiguredGeminiKey(): string | null {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return key;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = getConfiguredGeminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// TRUSTED CORS ORIGINS
// ============================================================================

function parseAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const addOrigin = (raw?: string) => {
    const val = (raw || '').trim();
    if (!val || val === 'MY_APP_URL') return;
    try {
      const parsed = new URL(val);
      origins.add(parsed.origin);
    } catch {
      if (/^https?:\/\/[^/\s]+$/i.test(val)) {
        origins.add(val.replace(/\/+$/, ''));
      }
    }
  };

  addOrigin(process.env.APP_URL);
  addOrigin(process.env.SITE_URL);
  for (const item of (process.env.ALLOWED_ORIGINS || '').split(',')) {
    addOrigin(item);
  }

  if (!IS_PRODUCTION) {
    origins.add(`http://localhost:${PORT}`);
    origins.add(`http://127.0.0.1:${PORT}`);
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return origins;
}

const allowedOrigins = parseAllowedOrigins();

function isOriginAllowed(req: Request, origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Always permit same-origin requests matching the current Host header
  const host = req.get('host');
  if (host) {
    if (origin === `https://${host}` || origin === `http://${host}`) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// PLUGGABLE RATE LIMITER (Upstash Redis REST in multi-instance prod + bounded memory fallback)
// ============================================================================

const upstashUrl = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
const upstashToken = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const HAS_REDIS_RATE_LIMITER = Boolean(upstashUrl && upstashToken);

const rateBuckets = new Map<string, number[]>();
const MAX_LOCAL_BUCKETS = 5000;

const usageStats = {
  publicAssistantCalls: 0,
  recommendationCalls: 0,
  adminAssistCalls: 0,
  rejectedRateLimit: 0,
  lastActivityAt: null as string | null,
};

function pruneLocalBuckets(now: number, maxAgeMs: number): void {
  if (rateBuckets.size <= MAX_LOCAL_BUCKETS) return;
  for (const [k, stamps] of rateBuckets.entries()) {
    const active = stamps.filter((t) => now - t < maxAgeMs);
    if (active.length === 0) {
      rateBuckets.delete(k);
    } else {
      rateBuckets.set(k, active);
    }
  }
}

async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  if (HAS_REDIS_RATE_LIMITER) {
    try {
      const redisKey = `mawa:rl:${key}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['PEXPIRE', redisKey, String(windowMs), 'NX'],
        ]),
      });
      if (res.ok) {
        const data = (await res.json()) as Array<{ result?: number }>;
        const count = Number(data?.[0]?.result ?? 1);
        if (count > maxRequests) {
          usageStats.rejectedRateLimit += 1;
          return false;
        }
        return true;
      }
    } catch {
      // Fail over safely to in-memory bucket if Redis network call hiccups
    }
  }

  const now = Date.now();
  pruneLocalBuckets(now, windowMs);
  const timestamps = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    usageStats.rejectedRateLimit += 1;
    rateBuckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(key, timestamps);
  return true;
}

// ============================================================================
// SAFE GEMINI ERROR DIAGNOSTICS
// ============================================================================

function mapGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('429') || lower.includes('resource_exhausted')) {
    return {
      status: 429,
      message: 'AI quota or rate limit reached temporarily. Please try again in a moment.',
    };
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return {
      status: 503,
      message: 'AI model is temporarily experiencing high demand. Catalog fallback remains available.',
    };
  }
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('403')
  ) {
    return {
      status: 502,
      message: 'AI credentials require server environment verification.',
    };
  }
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 502,
      message: 'Configured AI model is currently unavailable.',
    };
  }
  return {
    status: 502,
    message: 'Unable to reach AI generation service right now.',
  };
}

// ============================================================================
// FIREBASE ADMIN BEARER TOKEN VERIFICATION
// ============================================================================

interface VerifiedAdminUser {
  uid: string;
  email: string;
  role: 'Super Admin' | 'Editor';
}

async function verifyFirebaseAdminBearer(
  authHeader: string | undefined,
): Promise<VerifiedAdminUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 4096) return null;

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!lookupRes.ok) return null;
    const lookupData = (await lookupRes.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
    const user = lookupData.users?.[0];
    if (!user || !user.localId || !user.email || !user.emailVerified) {
      return null;
    }

    if (user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { uid: user.localId, email: user.email, role: 'Super Admin' };
    }

    const dbPath = firestoreDatabaseId || '(default)';
    const adminDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/databases/${encodeURIComponent(dbPath)}/documents/administrators/${encodeURIComponent(user.localId)}`;
    const adminDocRes = await fetch(adminDocUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!adminDocRes.ok) return null;
    const adminDoc = (await adminDocRes.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    const roleVal = adminDoc.fields?.role?.stringValue;
    return {
      uid: user.localId,
      email: user.email,
      role: roleVal === 'Super Admin' ? 'Super Admin' : 'Editor',
    };
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '96kb' }));

  // Basic security headers for Node server responses
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  // Strict origin-checked CORS for /api/* (protects standalone Hostinger -> Cloud Run backend calls)
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      if (!isOriginAllowed(req, origin)) {
        res.status(403).json({
          error: 'CORS_ORIGIN_DENIED',
          message: 'Origin is not permitted to access this API.',
        });
        return;
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Health & AI capability check (exposes no secrets)
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    const configured = Boolean(getConfiguredGeminiKey());
    res.json({
      configured,
      model: MODEL_NAME,
      rateLimiter: HAS_REDIS_RATE_LIMITER
        ? 'upstash-redis'
        : 'in-memory-single-instance',
      usage: usageStats,
    });
  });

  // Public MAWA AI Assistant
  app.post('/api/ai/assistant', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (!(await checkRateLimit(`public:${clientIp}`, 20, 60_000))) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment before asking again.',
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        configured: false,
        message: 'MAWA AI Assistant is currently running in offline catalog mode.',
      });
      return;
    }

    const body = req.body as {
      question?: unknown;
      catalogSummary?: unknown;
      history?: unknown;
    };
    const question =
      typeof body.question === 'string' ? body.question.trim().slice(0, 600) : '';
    if (question.length < 2) {
      res
        .status(400)
        .json({ error: 'INVALID_INPUT', message: 'Question is required.' });
      return;
    }

    const catalogSummary =
      typeof body.catalogSummary === 'string'
        ? body.catalogSummary.slice(0, 12000)
        : '';
    const history = Array.isArray(body.history)
      ? body.history
          .slice(-6)
          .filter(
            (m): m is { role: 'user' | 'assistant'; text: string } =>
              Boolean(m) &&
              typeof m === 'object' &&
              ('role' in m
                ? m.role === 'user' || m.role === 'assistant'
                : false) &&
              typeof (m as { text?: unknown }).text === 'string',
          )
          .map(
            (m) =>
              `${m.role === 'user' ? 'Visitor' : 'MAWA AI'}: ${m.text.slice(0, 400)}`,
          )
          .join('\n')
      : '';

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Catalog Context:\n${catalogSummary}\n\nRecent Conversation:\n${history || 'None'}\n\nVisitor Question: ${question}`,
        config: {
          systemInstruction:
            'You are the official MAWA Platform Assistant. MAWA ("A Legacy of Innovation.") is a digital products and technology innovation brand. Answer strictly using the provided MAWA Catalog Context and general platform information (public pages: /products, /categories, /roadmap, /downloads, /changelog, /faq, /developers, /partnerships, /business, /about, /contact). Recommend matching MAWA products with their exact route (/products/<slug>) and official website URL only if present in the context. Never invent unreleased product details, prices, or emails. Keep answers concise, clear, and structured in plain readable text.',
        },
      });
      usageStats.publicAssistantCalls += 1;
      usageStats.lastActivityAt = new Date().toISOString();
      res.json({
        answer: (response.text || '').trim(),
        model: MODEL_NAME,
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      console.error('[AI Assistant Error]', mapped.status, err instanceof Error ? err.message : err);
      res.status(mapped.status).json({
        error: 'UPSTREAM_ERROR',
        message: mapped.message,
      });
    }
  });

  // Public AI Product Recommender
  app.post('/api/ai/recommend', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (!(await checkRateLimit(`recommend:${clientIp}`, 15, 60_000))) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many recommendation requests. Please try again shortly.',
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        configured: false,
        message: 'AI recommendation service is not configured on this host.',
      });
      return;
    }

    const body = req.body as {
      goal?: unknown;
      platform?: unknown;
      pricing?: unknown;
      catalogSummary?: unknown;
    };
    const goal =
      typeof body.goal === 'string' ? body.goal.trim().slice(0, 400) : '';
    const platform =
      typeof body.platform === 'string'
        ? body.platform.trim().slice(0, 80)
        : 'Any';
    const pricing =
      typeof body.pricing === 'string'
        ? body.pricing.trim().slice(0, 40)
        : 'Any';
    const catalogSummary =
      typeof body.catalogSummary === 'string'
        ? body.catalogSummary.slice(0, 12000)
        : '';

    if (goal.length < 3) {
      res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Please describe what you are looking for.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Visitor Goal: ${goal}\nPreferred Platform: ${platform}\nPreferred Pricing: ${pricing}\n\nAvailable MAWA Catalog:\n${catalogSummary}`,
        config: {
          systemInstruction:
            'You are MAWA Product Advisor. Recommend up to 3 best-matching products strictly from the provided Available MAWA Catalog slugs. Explain concisely why each fits.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slug: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    fitLabel: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });
      usageStats.recommendationCalls += 1;
      usageStats.lastActivityAt = new Date().toISOString();
      const parsed = JSON.parse((response.text || '{}').trim()) as {
        summary?: string;
        recommendations?: Array<{
          slug: string;
          reason: string;
          fitLabel: string;
        }>;
      };
      res.json({
        summary: parsed.summary || '',
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 3)
          : [],
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      console.error('[AI Recommend Error]', mapped.status, err instanceof Error ? err.message : err);
      res.status(mapped.status).json({
        error: 'UPSTREAM_ERROR',
        message: mapped.message,
      });
    }
  });

  // Protected Admin AI Content Assistant (Verified Administrator Only)
  app.post('/api/ai/admin-assist', async (req: Request, res: Response) => {
    const admin = await verifyFirebaseAdminBearer(req.headers.authorization);
    if (!admin) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Verified MAWA administrator credentials are required.',
      });
      return;
    }

    if (!(await checkRateLimit(`admin:${admin.uid}`, 40, 60_000))) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Administrator AI rate limit reached. Please wait a minute.',
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        configured: false,
        message: 'GEMINI_API_KEY is not configured in server environment.',
      });
      return;
    }

    const body = req.body as {
      task?: unknown;
      productName?: unknown;
      draftText?: unknown;
      categoryName?: unknown;
      productType?: unknown;
    };
    const task = typeof body.task === 'string' ? body.task : 'description';
    const productName =
      typeof body.productName === 'string'
        ? body.productName.trim().slice(0, 120)
        : '';
    const draftText =
      typeof body.draftText === 'string'
        ? body.draftText.trim().slice(0, 6000)
        : '';
    const categoryName =
      typeof body.categoryName === 'string'
        ? body.categoryName.trim().slice(0, 120)
        : '';
    const productType =
      typeof body.productType === 'string'
        ? body.productType.trim().slice(0, 80)
        : '';

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Task: ${task}\nProduct Name: ${productName}\nCategory: ${categoryName}\nFormat: ${productType}\nExisting Draft / Notes:\n${draftText}`,
        config: {
          systemInstruction:
            'You are an editorial copywriter for MAWA ("A Legacy of Innovation."). Generate clean, trustworthy, non-hype drafts for administrator review before publication. For SEO title keep 40-65 chars; for SEO description keep 110-155 chars; for tags provide 5-8 concise tags.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shortDescription: { type: Type.STRING },
              fullDescription: { type: Type.STRING },
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              faqDrafts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                  },
                },
              },
              polishedText: { type: Type.STRING },
            },
          },
        },
      });
      usageStats.adminAssistCalls += 1;
      usageStats.lastActivityAt = new Date().toISOString();
      const parsed = JSON.parse((response.text || '{}').trim()) as Record<
        string,
        unknown
      >;
      res.json({ result: parsed, model: MODEL_NAME });
    } catch (err) {
      const mapped = mapGeminiError(err);
      console.error('[Admin AI Assist Error]', mapped.status, err instanceof Error ? err.message : err);
      res.status(mapped.status).json({
        error: 'UPSTREAM_ERROR',
        message: mapped.message,
      });
    }
  });

  // Ensure unknown /api/* requests always return JSON 404 before Vite or SPA fallback
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'API endpoint not found.',
    });
  });

  // Malformed JSON or Express middleware error guard
  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON.',
        });
        return;
      }
      if (req.path.startsWith('/api')) {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        });
        return;
      }
      next(err);
    },
  );

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    // Express 4 compatible SPA catch-all
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`MAWA server running at http://${HOST}:${PORT}`);
  });
}

void startServer();
