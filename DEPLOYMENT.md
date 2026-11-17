# MAWA Digital Products Platform — Production Deployment Guide

## Fixed Firebase Project Architecture (Do Not Alter)
- **Project ID:** `hopeful-atlas-6mn89`
- **Named Firestore Database ID:** `ai-studio-80b53fef-edbe-4c89-8e26-45393e1f5d49`
- **Storage Bucket:** `hopeful-atlas-6mn89.firebasestorage.app` (`nexora-media/` paths preserved)
- **Bootstrap Super Admin:** `khanabs1512@gmail.com`

---

## 1. Deploying Firebase Security Rules

### Firestore Rules (`/firestore.rules`)
Deploy via Firebase CLI (targeting the project configured in `.firebaserc` / `firebase-applet-config.json`) or via **Firebase Console → Firestore Database → (`ai-studio-80b53fef-edbe-4c89-8e26-45393e1f5d49`) → Rules**:
```bash
npm run lint:rules
firebase deploy --only firestore:rules
```

### Firebase Storage Rules (`/storage.rules`)
Storage rules enforce `Super Admin` & `Editor` role checks directly against database `ai-studio-80b53fef-edbe-4c89-8e26-45393e1f5d49`, allow PNG/JPG/WebP up to 5 MB, block SVG/scripts, and restrict deletes to `Super Admin`:
1. Open **Firebase Console → Storage → Rules** (`hopeful-atlas-6mn89.firebasestorage.app`).
2. Paste the contents of `/storage.rules` verbatim and click **Publish** (or deploy via `firebase deploy --only storage`).

### Google OAuth Authorized Domains
In **Firebase Console → Authentication → Settings → Authorized domains**, verify ALL active domains are listed:
- AI Studio Dev URL: `ais-dev-h3armcm7vv2dx2gjkktf75-175888916769.europe-west2.run.app`
- AI Studio Shared URL: `ais-pre-h3armcm7vv2dx2gjkktf75-175888916769.europe-west2.run.app`
- Your final production domain (e.g., `yourdomain.com` and `www.yourdomain.com`)

---

## 2. Frontend Deployment: GitHub + Hostinger Static Hosting (`dist/`)

> **Important:** Hostinger shared/static hosting serves the compiled Vite `dist/` bundle over Apache/LiteSpeed and **does not** run the persistent Express (`server.ts`) AI server. See Section 3 below to host the Express AI backend separately if needed.

1. **Connect GitHub Repository:**
   - Push to `main`. GitHub Actions (`.github/workflows/ci.yml`) automatically runs `npm ci`, `npm run lint`, `npm run lint:rules`, `npm run build`, and verifies `dist/` artifacts and secret hygiene.
2. **Build with your Real Domain (optional AI proxy URL if configured):**
   ```bash
   SITE_URL=https://yourdomain.com VITE_AI_API_URL=https://api.yourdomain.com npm run build
   ```
   - `scripts/generate-sitemap.mjs` generates `dist/sitemap.xml` (all public static routes + live public `/products/:slug` & `/categories/:slug` entries, excluding `/admin/`) and `dist/robots.txt`.
   - `public/.htaccess` is copied directly into `dist/.htaccess` for Apache React Router SPA fallback (`RewriteRule ^ index.html [L]`), security headers, gzip compression, and immutable asset caching (with `no-cache` on `index.html`).
3. **Upload to Hostinger:**
   - Upload the **entire contents of `dist/`** (make sure dotfiles like `.htaccess` are included!) into your domain's `public_html/` folder via Hostinger File Manager, SFTP, or Hostinger Git deployment (`npm ci && SITE_URL=https://yourdomain.com npm run build` publishing `dist/`).
   - Verify direct reloads on `/products`, `/roadmap`, `/downloads`, and `/admin/login` return the SPA cleanly without 404 errors, while `/assets/*` and `/mawa-logo.png` load directly.

---

## 3. Gemini AI Express Backend Deployment (`server.ts`) — Cloud Run / Node.js

If you want live Gemini AI responses (`/api/ai/assistant`, `/api/ai/recommend`, `/api/ai/admin-assist`) on your custom Hostinger domain (without it, `aiService.ts` automatically falls back to deterministic local catalog matching):

1. Deploy this Node.js service (`npm ci && npm run build && npm run start`) to **Google Cloud Run**, **Render**, **Railway**, or a **Node.js VPS** on port `3000` (or platform `PORT`).
2. Set server-side environment variables securely in your host's Secrets manager (never in GitHub or frontend code):
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=<your-server-gemini-api-key>`
   - `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
   - `APP_URL=https://api.yourdomain.com`
   - Optional (multi-instance rate limiting): `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
3. Rebuild your Hostinger frontend with `VITE_AI_API_URL=https://api.yourdomain.com`.
4. Verify backend health: `GET https://api.yourdomain.com/api/ai/status`.
