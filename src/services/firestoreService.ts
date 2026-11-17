import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_UPDATES,
  PLANNED_DRAFT_PRODUCTS,
} from '../data/defaults';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type {
  ActivityLog,
  Administrator,
  AdminNotification,
  AdminRole,
  AnalyticsEvent,
  AnalyticsEventType,
  BackupPayload,
  BackupSnapshot,
  Category,
  CategoryInput,
  ContactMessage,
  ContactMessageInput,
  ContactStatus,
  DownloadItem,
  DownloadItemInput,
  NewsletterStatus,
  NewsletterSubscriber,
  NotificationType,
  Product,
  ProductInput,
  ProductReview,
  ProductReviewInput,
  PublicationStatus,
  RecycleBinItem,
  RecycleEntityType,
  ReviewStatus,
  RoadmapItem,
  RoadmapItemInput,
  SiteSettings,
  SiteSettingsInput,
  UpdateInput,
  UpdatePost,
} from '../types/nexora';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function toTimestampMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) return val.getTime();
  return 0;
}

function normalizeHttpOrEmpty(raw: string | undefined, maxLen: number): string {
  const trimmed = (raw ?? '').trim().slice(0, maxLen);
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`.slice(0, maxLen);
}

async function hashSubscriberEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sub_${hex}`;
  }
  // Fallback deterministic hash (32-char hex)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sub_${part1}${part2}${part1}${part2}`;
}

// ============================================================================
// ACTIVITY LOGS & ANALYTICS HELPERS
// ============================================================================

export async function logAdminActivity(params: {
  actionType: string;
  targetCollection: string;
  targetId: string;
  summary: string;
  adminRole?: AdminRole | null;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const resolvedRole: AdminRole =
      params.adminRole ||
      (user.email?.toLowerCase() === 'khanabs1512@gmail.com'
        ? 'Super Admin'
        : 'Editor');
    await setDoc(doc(db, 'activityLogs', logId), {
      adminUid: user.uid,
      adminEmail: (user.email || 'admin@mawa').slice(0, 150),
      adminRole: resolvedRole,
      actionType: params.actionType.slice(0, 80),
      targetCollection: params.targetCollection.slice(0, 80),
      targetId: params.targetId.slice(0, 140),
      summary: params.summary.slice(0, 400),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit trail
  }
}

export async function trackAnalyticsEvent(params: {
  eventType: AnalyticsEventType;
  path: string;
  productId?: string;
  productSlug?: string;
  referrerSource?: string;
}): Promise<void> {
  try {
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'analyticsEvents', eventId), {
      eventType: params.eventType,
      path: (params.path || '/').slice(0, 200),
      productId: (params.productId || '').slice(0, 120),
      productSlug: (params.productSlug || '').slice(0, 120),
      referrerSource: (params.referrerSource || 'direct').slice(0, 160),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Telemetry failures must never disrupt UX
  }
}

// ============================================================================
// PUBLIC READS (Strictly scoped to match Firestore security rules)
// ============================================================================

export async function fetchPublicProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(
      collection(db, path),
      where('publicationStatus', 'in', [
        'Live',
        'Coming Soon',
        'Under Development',
      ]),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublicCategories(): Promise<Category[]> {
  const path = 'categories';
  try {
    const q = query(
      collection(db, path),
      where('publicationStatus', '==', 'Published'),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublicUpdates(): Promise<UpdatePost[]> {
  const path = 'updates';
  try {
    const q = query(
      collection(db, path),
      where('publicationStatus', '==', 'Published'),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<UpdatePost, 'id'>) }))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const path = 'siteSettings/global';
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'global'));
    if (!snap.exists()) return null;
    return snap.data() as SiteSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchPublicRoadmap(): Promise<RoadmapItem[]> {
  const path = 'roadmapItems';
  try {
    const q = query(collection(db, path), where('isPublic', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<RoadmapItem, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublicDownloads(): Promise<DownloadItem[]> {
  const path = 'downloadItems';
  try {
    const q = query(
      collection(db, path),
      where('publicationStatus', '==', 'Published'),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<DownloadItem, 'id'>) }))
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchApprovedReviewsByProduct(
  productSlug: string,
): Promise<ProductReview[]> {
  const path = 'productReviews';
  try {
    const q = query(
      collection(db, path),
      where('status', '==', 'Approved'),
      where('productSlug', '==', productSlug),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ProductReview, 'id'>) }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ============================================================================
// ADMIN READS
// ============================================================================

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllCategoriesAdmin(): Promise<Category[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllUpdatesAdmin(): Promise<UpdatePost[]> {
  const path = 'updates';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<UpdatePost, 'id'>) }))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchContactMessagesAdmin(): Promise<ContactMessage[]> {
  const path = 'contactMessages';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAdministrators(): Promise<Administrator[]> {
  const path = 'administrators';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Administrator, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function checkAdministratorDoc(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'administrators', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getAdministratorProfile(
  uid: string,
): Promise<{ isAdmin: boolean; role: AdminRole | null }> {
  try {
    const snap = await getDoc(doc(db, 'administrators', uid));
    if (!snap.exists()) {
      return { isAdmin: false, role: null };
    }
    const data = snap.data() as Partial<Administrator>;
    const role: AdminRole =
      data.role === 'Super Admin' ? 'Super Admin' : 'Editor';
    return { isAdmin: true, role };
  } catch {
    return { isAdmin: false, role: null };
  }
}

export async function fetchAllRoadmapAdmin(): Promise<RoadmapItem[]> {
  const path = 'roadmapItems';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<RoadmapItem, 'id'>) }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllReviewsAdmin(): Promise<ProductReview[]> {
  const path = 'productReviews';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ProductReview, 'id'>) }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllDownloadsAdmin(): Promise<DownloadItem[]> {
  const path = 'downloadItems';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<DownloadItem, 'id'>) }))
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchSubscribersAdmin(): Promise<NewsletterSubscriber[]> {
  const path = 'newsletterSubscribers';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NewsletterSubscriber, 'id'>),
      }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchActivityLogsAdmin(
  maxItems = 200,
): Promise<ActivityLog[]> {
  const path = 'activityLogs';
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ActivityLog, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAnalyticsEventsAdmin(
  maxItems = 500,
): Promise<AnalyticsEvent[]> {
  const path = 'analyticsEvents';
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AnalyticsEvent, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchBackupsAdmin(): Promise<BackupSnapshot[]> {
  const path = 'backups';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<BackupSnapshot, 'id'>) }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchRecycleBinAdmin(): Promise<RecycleBinItem[]> {
  const path = 'recycleBin';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<RecycleBinItem, 'id'>) }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const path = 'adminNotifications';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdminNotification, 'id'>),
      }))
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ============================================================================
// PRODUCT MUTATIONS
// ============================================================================

export async function saveProduct(
  id: string | null,
  input: ProductInput,
): Promise<string> {
  const safeSlug = slugify(input.slug || input.name) || `product-${Date.now()}`;
  const docId = id || safeSlug;
  const path = `products/${docId}`;
  const payload = {
    ...input,
    name: input.name.trim().slice(0, 120),
    slug: safeSlug.slice(0, 120),
    shortDescription: input.shortDescription.trim().slice(0, 280),
    fullDescription: input.fullDescription.slice(0, 15000),
    logoUrl: input.logoUrl.trim().slice(0, 2000),
    coverImageUrl: input.coverImageUrl.trim().slice(0, 2000),
    screenshotGallery: input.screenshotGallery.slice(0, 12),
    categoryId: input.categoryId.trim().slice(0, 120),
    categoryName: input.categoryName.trim().slice(0, 120),
    tags: input.tags.slice(0, 15),
    features: input.features.slice(0, 25),
    benefits: input.benefits.slice(0, 25),
    officialWebsiteUrl: normalizeHttpOrEmpty(input.officialWebsiteUrl, 1000),
    supportedPlatforms: input.supportedPlatforms.slice(0, 12),
    launchDate: input.launchDate.trim().slice(0, 40),
    displayOrder: Math.max(0, Math.floor(Number(input.displayOrder) || 0)),
    seoTitle: input.seoTitle.trim().slice(0, 140),
    seoDescription: input.seoDescription.trim().slice(0, 320),
    version: (input.version ?? '').trim().slice(0, 40),
    releaseDate: (input.releaseDate ?? '').trim().slice(0, 40),
    demoVideoUrl: normalizeHttpOrEmpty(input.demoVideoUrl, 1000),
    changelog: (input.changelog ?? '').slice(0, 8000),
    downloadUrl: normalizeHttpOrEmpty(input.downloadUrl, 1000),
    relatedProductIds: (input.relatedProductIds ?? []).slice(0, 6),
  };

  try {
    const slugQuery = query(
      collection(db, 'products'),
      where('slug', '==', payload.slug),
    );
    const slugMatches = await getDocs(slugQuery);
    const collision = slugMatches.docs.find((d) => d.id !== docId);
    if (collision) {
      throw new Error(
        `Another product already uses the slug "${payload.slug}". Please choose a unique slug.`,
      );
    }

    const ref = doc(db, 'products', docId);
    if (id) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'UPDATE_PRODUCT',
        targetCollection: 'products',
        targetId: docId,
        summary: `Updated product "${payload.name}" (${payload.publicationStatus})`,
      });
    } else {
      const existingDoc = await getDoc(ref);
      if (existingDoc.exists()) {
        throw new Error(
          `A product with slug "${docId}" already exists. Please choose a unique slug.`,
        );
      }
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'CREATE_PRODUCT',
        targetCollection: 'products',
        targetId: docId,
        summary: `Created product "${payload.name}" (${payload.publicationStatus})`,
      });
    }
    return docId;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('already uses the slug') ||
        error.message.includes('already exists'))
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      id ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function updateProductStatus(
  id: string,
  publicationStatus: PublicationStatus,
): Promise<void> {
  const path = `products/${id}`;
  try {
    await updateDoc(doc(db, 'products', id), {
      publicationStatus,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'STATUS_PRODUCT',
      targetCollection: 'products',
      targetId: id,
      summary: `Changed product "${id}" status to ${publicationStatus}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleProductFeatured(
  id: string,
  featured: boolean,
): Promise<void> {
  const path = `products/${id}`;
  try {
    await updateDoc(doc(db, 'products', id), {
      featured,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'FEATURE_PRODUCT',
      targetCollection: 'products',
      targetId: id,
      summary: `${featured ? 'Featured' : 'Unfeatured'} product "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
    void logAdminActivity({
      actionType: 'DELETE_PRODUCT',
      targetCollection: 'products',
      targetId: id,
      summary: `Permanently deleted product "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

export async function saveCategory(
  id: string | null,
  input: CategoryInput,
): Promise<string> {
  const safeSlug = slugify(input.slug || input.name) || `category-${Date.now()}`;
  const docId = id || safeSlug;
  const path = `categories/${docId}`;
  const payload = {
    ...input,
    name: input.name.trim().slice(0, 80),
    slug: safeSlug.slice(0, 80),
    icon: input.icon.trim().slice(0, 40) || 'Box',
    imageUrl: input.imageUrl.trim().slice(0, 2000),
    description: input.description.trim().slice(0, 400),
    displayOrder: Math.max(0, Math.floor(Number(input.displayOrder) || 0)),
  };

  try {
    const slugQuery = query(
      collection(db, 'categories'),
      where('slug', '==', payload.slug),
    );
    const slugMatches = await getDocs(slugQuery);
    const collision = slugMatches.docs.find((d) => d.id !== docId);
    if (collision) {
      throw new Error(
        `Another category already uses the slug "${payload.slug}". Please choose a unique slug.`,
      );
    }

    const ref = doc(db, 'categories', docId);
    if (id) {
      const prevSnap = await getDoc(ref);
      const prevName = prevSnap.exists()
        ? (prevSnap.data() as { name?: string }).name
        : undefined;
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      if (prevName && prevName !== payload.name) {
        const linkedProducts = await getDocs(
          query(collection(db, 'products'), where('categoryId', '==', id)),
        );
        if (!linkedProducts.empty) {
          const batch = writeBatch(db);
          linkedProducts.docs.forEach((prodDoc) => {
            batch.update(prodDoc.ref, {
              categoryName: payload.name,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }
      void logAdminActivity({
        actionType: 'UPDATE_CATEGORY',
        targetCollection: 'categories',
        targetId: docId,
        summary: `Updated category "${payload.name}"`,
      });
    } else {
      const existingDoc = await getDoc(ref);
      if (existingDoc.exists()) {
        throw new Error(
          `A category with slug "${docId}" already exists. Please choose a unique slug.`,
        );
      }
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'CREATE_CATEGORY',
        targetCollection: 'categories',
        targetId: docId,
        summary: `Created category "${payload.name}"`,
      });
    }
    return docId;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('already uses the slug') ||
        error.message.includes('already exists'))
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      id ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
    void logAdminActivity({
      actionType: 'DELETE_CATEGORY',
      targetCollection: 'categories',
      targetId: id,
      summary: `Permanently deleted category "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// UPDATES / ANNOUNCEMENTS MUTATIONS
// ============================================================================

export async function saveUpdatePost(
  id: string | null,
  input: UpdateInput,
): Promise<string> {
  const safeSlug = slugify(input.slug || input.title) || `update-${Date.now()}`;
  const docId = id || safeSlug;
  const path = `updates/${docId}`;
  const payload = {
    ...input,
    title: input.title.trim().slice(0, 160),
    slug: safeSlug.slice(0, 160),
    summary: input.summary.trim().slice(0, 400),
    content: input.content.slice(0, 15000),
    relatedProductSlug: input.relatedProductSlug.trim().slice(0, 120),
    coverImageUrl: input.coverImageUrl.trim().slice(0, 2000),
    publishedAt: input.publishedAt.trim().slice(0, 40),
  };

  try {
    const slugQuery = query(
      collection(db, 'updates'),
      where('slug', '==', payload.slug),
    );
    const slugMatches = await getDocs(slugQuery);
    const collision = slugMatches.docs.find((d) => d.id !== docId);
    if (collision) {
      throw new Error(
        `Another update already uses the slug "${payload.slug}". Please choose a unique slug.`,
      );
    }

    const ref = doc(db, 'updates', docId);
    if (id) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'UPDATE_POST',
        targetCollection: 'updates',
        targetId: docId,
        summary: `Updated post "${payload.title}"`,
      });
    } else {
      const existingDoc = await getDoc(ref);
      if (existingDoc.exists()) {
        throw new Error(
          `An update with slug "${docId}" already exists. Please choose a unique slug.`,
        );
      }
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'CREATE_POST',
        targetCollection: 'updates',
        targetId: docId,
        summary: `Created post "${payload.title}"`,
      });
    }
    return docId;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('already uses the slug') ||
        error.message.includes('already exists'))
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      id ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function deleteUpdatePost(id: string): Promise<void> {
  const path = `updates/${id}`;
  try {
    await deleteDoc(doc(db, 'updates', id));
    void logAdminActivity({
      actionType: 'DELETE_POST',
      targetCollection: 'updates',
      targetId: id,
      summary: `Permanently deleted post "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// CONTACT MESSAGES
// ============================================================================

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<string> {
  const docId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `contactMessages/${docId}`;
  try {
    await setDoc(doc(db, 'contactMessages', docId), {
      name: input.name.trim().slice(0, 100),
      email: input.email.trim().slice(0, 150),
      subject: input.subject.trim().slice(0, 160),
      message: input.message.trim().slice(0, 4000),
      status: 'New',
      honeypot: input.honeypot,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactStatus,
): Promise<void> {
  const path = `contactMessages/${id}`;
  try {
    await updateDoc(doc(db, 'contactMessages', id), {
      status,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'TRIAGE_MESSAGE',
      targetCollection: 'contactMessages',
      targetId: id,
      summary: `Marked contact message "${id}" as ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessage(id: string): Promise<void> {
  const path = `contactMessages/${id}`;
  try {
    await deleteDoc(doc(db, 'contactMessages', id));
    void logAdminActivity({
      actionType: 'DELETE_MESSAGE',
      targetCollection: 'contactMessages',
      targetId: id,
      summary: `Deleted contact message "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// ROADMAP, REVIEWS, DOWNLOADS, NEWSLETTER
// ============================================================================

export async function saveRoadmapItem(
  id: string | null,
  input: RoadmapItemInput,
): Promise<string> {
  const safeBase = slugify(input.title) || 'roadmap';
  const docId = id || `${safeBase.slice(0, 60)}-${Date.now().toString(36)}`;
  const path = `roadmapItems/${docId}`;
  const payload = {
    title: input.title.trim().slice(0, 160),
    description: input.description.trim().slice(0, 2000),
    status: input.status,
    category: input.category.trim().slice(0, 80),
    productSlug: slugify(input.productSlug || '').slice(0, 120),
    targetQuarter: input.targetQuarter.trim().slice(0, 40),
    displayOrder: Math.max(0, Math.floor(Number(input.displayOrder) || 0)),
    isPublic: Boolean(input.isPublic),
  };

  try {
    const ref = doc(db, 'roadmapItems', docId);
    if (id) {
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      void logAdminActivity({
        actionType: 'UPDATE_ROADMAP',
        targetCollection: 'roadmapItems',
        targetId: docId,
        summary: `Updated roadmap item "${payload.title}" (${payload.status})`,
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'CREATE_ROADMAP',
        targetCollection: 'roadmapItems',
        targetId: docId,
        summary: `Created roadmap item "${payload.title}"`,
      });
    }
    return docId;
  } catch (error) {
    handleFirestoreError(
      error,
      id ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  const path = `roadmapItems/${id}`;
  try {
    await deleteDoc(doc(db, 'roadmapItems', id));
    void logAdminActivity({
      actionType: 'DELETE_ROADMAP',
      targetCollection: 'roadmapItems',
      targetId: id,
      summary: `Deleted roadmap item "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function submitProductReview(
  input: ProductReviewInput,
): Promise<string> {
  const docId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `productReviews/${docId}`;
  try {
    await setDoc(doc(db, 'productReviews', docId), {
      productId: input.productId.trim().slice(0, 120),
      productSlug: slugify(input.productSlug).slice(0, 120),
      productName: input.productName.trim().slice(0, 120),
      authorName: input.authorName.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
      title: input.title.trim().slice(0, 140),
      comment: input.comment.trim().slice(0, 2000),
      suggestion: input.suggestion.trim().slice(0, 1000),
      status: 'Pending',
      honeypot: input.honeypot,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function moderateProductReview(
  id: string,
  status: ReviewStatus,
): Promise<void> {
  const path = `productReviews/${id}`;
  try {
    await updateDoc(doc(db, 'productReviews', id), {
      status,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'MODERATE_REVIEW',
      targetCollection: 'productReviews',
      targetId: id,
      summary: `Set product review "${id}" status to ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductReview(id: string): Promise<void> {
  const path = `productReviews/${id}`;
  try {
    await deleteDoc(doc(db, 'productReviews', id));
    void logAdminActivity({
      actionType: 'DELETE_REVIEW',
      targetCollection: 'productReviews',
      targetId: id,
      summary: `Deleted product review "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDownloadItem(
  id: string | null,
  input: DownloadItemInput,
): Promise<string> {
  const safeBase = slugify(input.title) || 'download';
  const docId = id || `${safeBase.slice(0, 60)}-${Date.now().toString(36)}`;
  const path = `downloadItems/${docId}`;
  const cleanUrl = normalizeHttpOrEmpty(input.downloadUrl, 1000);
  if (!cleanUrl) {
    throw new Error('A valid https:// download URL is required.');
  }
  const payload = {
    title: input.title.trim().slice(0, 140),
    productId: input.productId.trim().slice(0, 120),
    productSlug: slugify(input.productSlug || '').slice(0, 120),
    category: input.category,
    version: input.version.trim().slice(0, 40) || '1.0.0',
    fileSize: input.fileSize.trim().slice(0, 40),
    releaseDate: input.releaseDate.trim().slice(0, 40),
    downloadUrl: cleanUrl,
    checksumSha256: input.checksumSha256.trim().slice(0, 128),
    releaseNotes: input.releaseNotes.trim().slice(0, 2000),
    publicationStatus: input.publicationStatus,
  };

  try {
    const ref = doc(db, 'downloadItems', docId);
    if (id) {
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      void logAdminActivity({
        actionType: 'UPDATE_DOWNLOAD',
        targetCollection: 'downloadItems',
        targetId: docId,
        summary: `Updated download "${payload.title}" (${payload.version})`,
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      void logAdminActivity({
        actionType: 'CREATE_DOWNLOAD',
        targetCollection: 'downloadItems',
        targetId: docId,
        summary: `Created download "${payload.title}" (${payload.version})`,
      });
    }
    return docId;
  } catch (error) {
    handleFirestoreError(
      error,
      id ? OperationType.UPDATE : OperationType.CREATE,
      path,
    );
  }
}

export async function deleteDownloadItem(id: string): Promise<void> {
  const path = `downloadItems/${id}`;
  try {
    await deleteDoc(doc(db, 'downloadItems', id));
    void logAdminActivity({
      actionType: 'DELETE_DOWNLOAD',
      targetCollection: 'downloadItems',
      targetId: id,
      summary: `Deleted download "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function subscribeNewsletter(params: {
  email: string;
  consent: boolean;
  source?: string;
  honeypot?: string;
}): Promise<{ id: string; updatedExisting: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase().slice(0, 150);
  const subId = await hashSubscriberEmail(cleanEmail);
  const path = `newsletterSubscribers/${subId}`;
  const ref = doc(db, 'newsletterSubscribers', subId);
  const cleanSource = (params.source || 'footer').trim().slice(0, 80);

  try {
    await setDoc(ref, {
      email: cleanEmail,
      status: 'Subscribed',
      consent: Boolean(params.consent),
      source: cleanSource,
      honeypot: params.honeypot ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: subId, updatedExisting: false };
  } catch {
    // Existing subscriber re-subscribe / confirmation update without public get() read
    try {
      await updateDoc(ref, {
        status: 'Subscribed',
        consent: Boolean(params.consent),
        source: cleanSource,
        updatedAt: serverTimestamp(),
      });
      return { id: subId, updatedExisting: true };
    } catch (updateErr) {
      handleFirestoreError(updateErr, OperationType.CREATE, path);
    }
  }
}

export async function unsubscribeNewsletter(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase().slice(0, 150);
  const subId = await hashSubscriberEmail(cleanEmail);
  const path = `newsletterSubscribers/${subId}`;
  try {
    await updateDoc(doc(db, 'newsletterSubscribers', subId), {
      status: 'Unsubscribed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSubscriberStatusAdmin(
  id: string,
  status: NewsletterStatus,
): Promise<void> {
  const path = `newsletterSubscribers/${id}`;
  try {
    await updateDoc(doc(db, 'newsletterSubscribers', id), {
      status,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'UPDATE_SUBSCRIBER',
      targetCollection: 'newsletterSubscribers',
      targetId: id,
      summary: `Set newsletter subscriber "${id}" status to ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubscriberAdmin(id: string): Promise<void> {
  const path = `newsletterSubscribers/${id}`;
  try {
    await deleteDoc(doc(db, 'newsletterSubscribers', id));
    void logAdminActivity({
      actionType: 'DELETE_SUBSCRIBER',
      targetCollection: 'newsletterSubscribers',
      targetId: id,
      summary: `Deleted newsletter subscriber "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// SITE SETTINGS & ADMINISTRATORS
// ============================================================================

export async function saveSiteSettings(
  input: SiteSettingsInput,
): Promise<void> {
  const path = 'siteSettings/global';
  try {
    await setDoc(doc(db, 'siteSettings', 'global'), {
      ...input,
      brandName: input.brandName.trim().slice(0, 60) || 'MAWA',
      tagline: input.tagline.trim().slice(0, 200),
      brandLogoUrl: input.brandLogoUrl.trim().slice(0, 2000),
      brandDescription: input.brandDescription.trim().slice(0, 1000),
      aboutMission: input.aboutMission.trim().slice(0, 2000),
      aboutVision: input.aboutVision.trim().slice(0, 2000),
      aboutStory: input.aboutStory.trim().slice(0, 8000),
      seoTitle: input.seoTitle.trim().slice(0, 120),
      seoDescription: input.seoDescription.trim().slice(0, 320),
      contactEmail: input.contactEmail.trim().slice(0, 150),
      contactLocation: input.contactLocation.trim().slice(0, 160),
      socialGithub: normalizeHttpOrEmpty(input.socialGithub, 500),
      socialX: normalizeHttpOrEmpty(input.socialX, 500),
      socialLinkedin: normalizeHttpOrEmpty(input.socialLinkedin, 500),
      socialYoutube: normalizeHttpOrEmpty(input.socialYoutube, 500),
      canonicalDomain: normalizeHttpOrEmpty(input.canonicalDomain, 250),
      ogImageUrl: (input.ogImageUrl ?? '/mawa-og.png').trim().slice(0, 2000),
      gaMeasurementId: (input.gaMeasurementId ?? '').trim().slice(0, 40),
      aiAssistantEnabled: input.aiAssistantEnabled !== false,
      newsletterEnabled: input.newsletterEnabled !== false,
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'UPDATE_SETTINGS',
      targetCollection: 'siteSettings',
      targetId: 'global',
      summary: 'Updated global MAWA settings & branding',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addAdministrator(
  uid: string,
  email: string,
  displayName: string,
  role: AdminRole,
): Promise<void> {
  const cleanUid = uid.trim();
  const path = `administrators/${cleanUid}`;
  try {
    await setDoc(doc(db, 'administrators', cleanUid), {
      email: email.trim().toLowerCase(),
      displayName: displayName.trim().slice(0, 100),
      role,
      createdAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'ADD_ADMIN',
      targetCollection: 'administrators',
      targetId: cleanUid,
      summary: `Granted ${role} role to ${email.trim().toLowerCase()}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAdministratorRole(
  uid: string,
  displayName: string,
  role: AdminRole,
): Promise<void> {
  const cleanUid = uid.trim();
  const path = `administrators/${cleanUid}`;
  try {
    await updateDoc(doc(db, 'administrators', cleanUid), {
      displayName: displayName.trim().slice(0, 100),
      role,
    });
    void logAdminActivity({
      actionType: 'UPDATE_ADMIN_ROLE',
      targetCollection: 'administrators',
      targetId: cleanUid,
      summary: `Updated admin "${displayName}" role to ${role}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeAdministrator(uid: string): Promise<void> {
  const path = `administrators/${uid}`;
  try {
    await deleteDoc(doc(db, 'administrators', uid));
    void logAdminActivity({
      actionType: 'REMOVE_ADMIN',
      targetCollection: 'administrators',
      targetId: uid,
      summary: `Removed administrator UID "${uid}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// RECYCLE BIN (SOFT DELETE, RESTORE, PERMANENT PURGE)
// ============================================================================

export async function moveEntityToRecycleBin(params: {
  entityType: RecycleEntityType;
  originalId: string;
  title: string;
  snapshot: Record<string, unknown>;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');
  const itemId = `bin_${params.entityType}_${params.originalId.slice(0, 50)}_${Date.now().toString(36)}`;
  const path = `recycleBin/${itemId}`;
  try {
    const cleanSnapshot = { ...params.snapshot };
    delete cleanSnapshot.createdAt;
    delete cleanSnapshot.updatedAt;
    await setDoc(doc(db, 'recycleBin', itemId), {
      entityType: params.entityType,
      originalId: params.originalId.slice(0, 160),
      title: params.title.slice(0, 160),
      snapshotJson: JSON.stringify(cleanSnapshot).slice(0, 100000),
      deletedByUid: user.uid,
      deletedByEmail: (user.email || 'admin@mawa').slice(0, 150),
      createdAt: serverTimestamp(),
    });

    if (params.entityType === 'product') {
      await updateDoc(doc(db, 'products', params.originalId), {
        publicationStatus: 'Archived',
        updatedAt: serverTimestamp(),
      });
    } else if (params.entityType === 'category') {
      await updateDoc(doc(db, 'categories', params.originalId), {
        publicationStatus: 'Hidden',
        updatedAt: serverTimestamp(),
      });
    } else if (params.entityType === 'update') {
      await updateDoc(doc(db, 'updates', params.originalId), {
        publicationStatus: 'Draft',
        updatedAt: serverTimestamp(),
      });
    }

    void logAdminActivity({
      actionType: 'ARCHIVE_TO_RECYCLE_BIN',
      targetCollection: 'recycleBin',
      targetId: itemId,
      summary: `Moved ${params.entityType} "${params.title}" to Recycle Bin`,
    });
    return itemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function restoreFromRecycleBin(item: RecycleBinItem): Promise<void> {
  const snapshot = JSON.parse(item.snapshotJson) as Record<string, unknown>;
  try {
    if (item.entityType === 'product') {
      const ref = doc(db, 'products', item.originalId);
      const snap = await getDoc(ref);
      const restoredStatus =
        typeof snapshot.publicationStatus === 'string' &&
        snapshot.publicationStatus !== 'Archived'
          ? snapshot.publicationStatus
          : 'Draft';
      if (snap.exists()) {
        await updateDoc(ref, {
          ...snapshot,
          publicationStatus: restoredStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...snapshot,
          publicationStatus: restoredStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else if (item.entityType === 'category') {
      const ref = doc(db, 'categories', item.originalId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          ...snapshot,
          publicationStatus: 'Published',
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...snapshot,
          publicationStatus: 'Published',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else if (item.entityType === 'update') {
      const ref = doc(db, 'updates', item.originalId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          ...snapshot,
          publicationStatus: 'Published',
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...snapshot,
          publicationStatus: 'Published',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    void logAdminActivity({
      actionType: 'RESTORE_FROM_RECYCLE_BIN',
      targetCollection: 'recycleBin',
      targetId: item.id,
      summary: `Restored ${item.entityType} "${item.title}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `recycleBin/${item.id}`);
  }
}

export async function purgeRecycleBinItem(
  item: RecycleBinItem,
  alsoDeleteOriginal = false,
): Promise<void> {
  const path = `recycleBin/${item.id}`;
  try {
    if (alsoDeleteOriginal) {
      if (item.entityType === 'product') {
        await deleteDoc(doc(db, 'products', item.originalId));
      } else if (item.entityType === 'category') {
        await deleteDoc(doc(db, 'categories', item.originalId));
      } else if (item.entityType === 'update') {
        await deleteDoc(doc(db, 'updates', item.originalId));
      }
    }
    await deleteDoc(doc(db, 'recycleBin', item.id));
    void logAdminActivity({
      actionType: 'PURGE_RECYCLE_BIN',
      targetCollection: 'recycleBin',
      targetId: item.id,
      summary: `Permanently purged ${item.entityType} "${item.title}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// BACKUP & NON-DESTRUCTIVE RESTORE (SUPER ADMIN ONLY)
// ============================================================================

export async function buildLiveBackupPayload(): Promise<BackupPayload> {
  const [settingsSnap, cats, prods, upds, road, dl] = await Promise.all([
    fetchSiteSettings(),
    fetchAllCategoriesAdmin(),
    fetchAllProductsAdmin(),
    fetchAllUpdatesAdmin(),
    fetchAllRoadmapAdmin(),
    fetchAllDownloadsAdmin(),
  ]);

  const stripMeta = <T extends { createdAt?: unknown; updatedAt?: unknown }>(
    item: T,
  ) => {
    const copy = { ...item };
    delete copy.createdAt;
    delete copy.updatedAt;
    return copy;
  };

  let cleanSettings: SiteSettingsInput | null = null;
  if (settingsSnap) {
    const { updatedAt: _u, ...rest } = settingsSnap;
    cleanSettings = rest;
  }

  return {
    schemaVersion: 'mawa-backup-v2',
    exportedAt: new Date().toISOString(),
    siteSettings: cleanSettings,
    categories: cats.map(stripMeta),
    products: prods.map(stripMeta),
    updates: upds.map(stripMeta),
    roadmapItems: road.map(stripMeta),
    downloadItems: dl.map(stripMeta),
  };
}

export async function createCatalogBackup(label: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Super Admin authentication required.');
  const payload = await buildLiveBackupPayload();
  const payloadJson = JSON.stringify(payload);
  if (payloadJson.length > 740000) {
    throw new Error(
      'Catalog snapshot exceeds single-document storage size. Use JSON export instead.',
    );
  }
  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const summary = `${payload.products.length} products, ${payload.categories.length} categories, ${payload.updates.length} updates, ${payload.roadmapItems.length} roadmap items, ${payload.downloadItems.length} downloads`;
  try {
    await setDoc(doc(db, 'backups', backupId), {
      label: label.trim().slice(0, 140) || `Snapshot ${new Date().toISOString()}`,
      createdByUid: user.uid,
      createdByEmail: (user.email || 'admin@mawa').slice(0, 150),
      summary: summary.slice(0, 300),
      payloadJson,
      status: 'Ready',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    void logAdminActivity({
      actionType: 'CREATE_BACKUP',
      targetCollection: 'backups',
      targetId: backupId,
      summary: `Created backup snapshot "${label}" (${summary})`,
    });
    return backupId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `backups/${backupId}`);
  }
}

export async function restoreCatalogBackup(
  payload: BackupPayload,
  backupDocId?: string,
  overwriteExisting = false,
): Promise<{ restoredCount: number; skippedCount: number }> {
  let restoredCount = 0;
  let skippedCount = 0;

  try {
    if (payload.siteSettings && overwriteExisting) {
      await saveSiteSettings(payload.siteSettings);
      restoredCount += 1;
    }

    const restoreCollection = async (
      colName: string,
      items: Array<{ id: string } & Record<string, unknown>>,
    ) => {
      for (const item of items) {
        const { id, ...rest } = item;
        if (!id) continue;
        const ref = doc(db, colName, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          if (!overwriteExisting) {
            skippedCount += 1;
            continue;
          }
          await updateDoc(ref, {
            ...rest,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            ...rest,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        restoredCount += 1;
      }
    };

    await restoreCollection(
      'categories',
      payload.categories as Array<{ id: string } & Record<string, unknown>>,
    );
    await restoreCollection(
      'products',
      payload.products as Array<{ id: string } & Record<string, unknown>>,
    );
    await restoreCollection(
      'updates',
      payload.updates as Array<{ id: string } & Record<string, unknown>>,
    );
    await restoreCollection(
      'roadmapItems',
      (payload.roadmapItems || []) as Array<{ id: string } & Record<string, unknown>>,
    );
    await restoreCollection(
      'downloadItems',
      (payload.downloadItems || []) as Array<{ id: string } & Record<string, unknown>>,
    );

    if (backupDocId) {
      await updateDoc(doc(db, 'backups', backupDocId), {
        status: 'Restored',
        updatedAt: serverTimestamp(),
      });
    }

    void logAdminActivity({
      actionType: 'RESTORE_BACKUP',
      targetCollection: 'backups',
      targetId: backupDocId || 'json-upload',
      summary: `Restored ${restoredCount} records (${skippedCount} existing skipped)`,
    });

    return { restoredCount, skippedCount };
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `backups/${backupDocId || 'restore'}`,
    );
  }
}

export async function deleteBackup(id: string): Promise<void> {
  const path = `backups/${id}`;
  try {
    await deleteDoc(doc(db, 'backups', id));
    void logAdminActivity({
      actionType: 'DELETE_BACKUP',
      targetCollection: 'backups',
      targetId: id,
      summary: `Deleted backup snapshot "${id}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================

export async function createAdminNotification(params: {
  type: NotificationType;
  title: string;
  message: string;
  linkPath: string;
}): Promise<string> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `adminNotifications/${notifId}`;
  try {
    await setDoc(doc(db, 'adminNotifications', notifId), {
      type: params.type,
      title: params.title.trim().slice(0, 140),
      message: params.message.trim().slice(0, 500),
      linkPath: params.linkPath.trim().slice(0, 160),
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return notifId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(
  id: string,
  isRead: boolean,
): Promise<void> {
  const path = `adminNotifications/${id}`;
  try {
    await updateDoc(doc(db, 'adminNotifications', id), {
      isRead,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const path = `adminNotifications/${id}`;
  try {
    await deleteDoc(doc(db, 'adminNotifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// INITIAL DATABASE BOOTSTRAP (Admin-only, idempotent)
// ============================================================================

export async function initializeCatalogDefaults(): Promise<{
  seededCategories: number;
  seededProducts: number;
  seededUpdates: number;
  seededSettings: boolean;
}> {
  const [catSnap, prodSnap, updSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, 'categories')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'updates')),
    getDoc(doc(db, 'siteSettings', 'global')),
  ]);

  const batch = writeBatch(db);
  let seededCategories = 0;
  let seededProducts = 0;
  let seededUpdates = 0;
  let seededSettings = false;

  if (catSnap.empty) {
    for (const cat of DEFAULT_CATEGORIES) {
      const { id, ...rest } = cat;
      batch.set(doc(db, 'categories', id), {
        ...rest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      seededCategories += 1;
    }
  }

  if (prodSnap.empty) {
    for (const prod of PLANNED_DRAFT_PRODUCTS) {
      const { id, ...rest } = prod;
      batch.set(doc(db, 'products', id), {
        ...rest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      seededProducts += 1;
    }
  }

  if (updSnap.empty) {
    for (const upd of DEFAULT_UPDATES) {
      const { id, ...rest } = upd;
      batch.set(doc(db, 'updates', id), {
        ...rest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      seededUpdates += 1;
    }
  }

  if (!settingsSnap.exists()) {
    batch.set(doc(db, 'siteSettings', 'global'), {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: serverTimestamp(),
    });
    seededSettings = true;
  }

  if (
    seededCategories > 0 ||
    seededProducts > 0 ||
    seededUpdates > 0 ||
    seededSettings
  ) {
    try {
      await batch.commit();
      void logAdminActivity({
        actionType: 'BOOTSTRAP_CATALOG',
        targetCollection: 'siteSettings',
        targetId: 'global',
        summary: `Initialized catalog defaults (${seededCategories} categories, ${seededProducts} products, ${seededUpdates} updates)`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-init');
    }
  }

  return {
    seededCategories,
    seededProducts,
    seededUpdates,
    seededSettings,
  };
}
