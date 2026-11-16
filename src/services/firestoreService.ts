import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  Administrator,
  AdminRole,
  Category,
  CategoryInput,
  ContactMessage,
  ContactMessageInput,
  ContactStatus,
  Product,
  ProductInput,
  PublicationStatus,
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

function toTimestampMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) return val.getTime();
  return 0;
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
      .sort(
        (a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt),
      );
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
    officialWebsiteUrl: input.officialWebsiteUrl.trim().slice(0, 1000),
    supportedPlatforms: input.supportedPlatforms.slice(0, 12),
    launchDate: input.launchDate.trim().slice(0, 40),
    displayOrder: Math.max(0, Math.floor(Number(input.displayOrder) || 0)),
    seoTitle: input.seoTitle.trim().slice(0, 140),
    seoDescription: input.seoDescription.trim().slice(0, 320),
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
    }
    return docId;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('already uses the slug')
    ) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('already exists')) {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessage(id: string): Promise<void> {
  const path = `contactMessages/${id}`;
  try {
    await deleteDoc(doc(db, 'contactMessages', id));
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
      brandName: input.brandName.trim().slice(0, 60) || 'NEXORA',
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
      socialGithub: input.socialGithub.trim().slice(0, 500),
      socialX: input.socialX.trim().slice(0, 500),
      socialLinkedin: input.socialLinkedin.trim().slice(0, 500),
      socialYoutube: input.socialYoutube.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
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
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeAdministrator(uid: string): Promise<void> {
  const path = `administrators/${uid}`;
  try {
    await deleteDoc(doc(db, 'administrators', uid));
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
