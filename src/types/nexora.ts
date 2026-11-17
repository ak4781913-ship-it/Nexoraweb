import { Timestamp } from 'firebase/firestore';

export type PublicationStatus =
  | 'Draft'
  | 'Coming Soon'
  | 'Live'
  | 'Under Development'
  | 'Archived';

export type ProductType =
  | 'Website'
  | 'Web Application'
  | 'Mobile Application'
  | 'AI Tool'
  | 'Online Service'
  | 'Digital Platform';

export type PricingType = 'Free' | 'Freemium' | 'Premium';

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl: string;
  coverImageUrl: string;
  screenshotGallery: string[];
  categoryId: string;
  categoryName: string;
  tags: string[];
  features: string[];
  benefits: string[];
  officialWebsiteUrl: string;
  productType: ProductType;
  pricingType: PricingType;
  supportedPlatforms: string[];
  launchDate: string;
  featured: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  publicationStatus: PublicationStatus;
  version?: string;
  releaseDate?: string;
  demoVideoUrl?: string;
  changelog?: string;
  downloadUrl?: string;
  relatedProductIds?: string[];
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export type CategoryStatus = 'Published' | 'Hidden';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl: string;
  description: string;
  displayOrder: number;
  publicationStatus: CategoryStatus;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateType =
  | 'Product Launch'
  | 'Platform Update'
  | 'Announcement'
  | 'Roadmap';

export type UpdateStatus = 'Published' | 'Draft';

export interface UpdatePost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: UpdateType;
  relatedProductSlug: string;
  coverImageUrl: string;
  publishedAt: string;
  publicationStatus: UpdateStatus;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type UpdateInput = Omit<UpdatePost, 'id' | 'createdAt' | 'updatedAt'>;

export type ContactStatus = 'New' | 'Read' | 'Replied' | 'Archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  honeypot: string;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string;
};

export type ThemePreference = 'light' | 'dark' | 'system';

export interface SiteSettings {
  brandName: string;
  tagline: string;
  brandLogoUrl: string;
  brandDescription: string;
  aboutMission: string;
  aboutVision: string;
  aboutStory: string;
  defaultTheme: ThemePreference;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  contactLocation: string;
  socialGithub: string;
  socialX: string;
  socialLinkedin: string;
  socialYoutube: string;
  canonicalDomain?: string;
  ogImageUrl?: string;
  gaMeasurementId?: string;
  aiAssistantEnabled?: boolean;
  newsletterEnabled?: boolean;
  updatedAt?: Timestamp | Date | null;
}

export type SiteSettingsInput = Omit<SiteSettings, 'updatedAt'>;

export type AdminRole = 'Super Admin' | 'Editor';

export interface Administrator {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  createdAt?: Timestamp | Date | null;
}

export type RoadmapStatus =
  | 'Planned'
  | 'Under Consideration'
  | 'In Progress'
  | 'Completed';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  category: string;
  productSlug: string;
  targetQuarter: string;
  displayOrder: number;
  isPublic: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type RoadmapItemInput = Omit<
  RoadmapItem,
  'id' | 'createdAt' | 'updatedAt'
>;

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ProductReview {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  suggestion: string;
  status: ReviewStatus;
  honeypot: string;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface ProductReviewInput {
  productId: string;
  productSlug: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  suggestion: string;
  honeypot: string;
}

export type DownloadCategory =
  | 'Windows Application'
  | 'Android APK'
  | 'Web Application'
  | 'Document & Resource';

export interface DownloadItem {
  id: string;
  title: string;
  productId: string;
  productSlug: string;
  category: DownloadCategory;
  version: string;
  fileSize: string;
  releaseDate: string;
  downloadUrl: string;
  checksumSha256: string;
  releaseNotes: string;
  publicationStatus: 'Published' | 'Draft';
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export type DownloadItemInput = Omit<
  DownloadItem,
  'id' | 'createdAt' | 'updatedAt'
>;

export type NewsletterStatus = 'Subscribed' | 'Unsubscribed';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  consent: boolean;
  source: string;
  honeypot: string;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface ActivityLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  adminRole: AdminRole;
  actionType: string;
  targetCollection: string;
  targetId: string;
  summary: string;
  createdAt?: Timestamp | Date | null;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'download_click'
  | 'ai_query';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  path: string;
  productId: string;
  productSlug: string;
  referrerSource: string;
  createdAt?: Timestamp | Date | null;
}

export interface BackupSnapshot {
  id: string;
  label: string;
  createdByUid: string;
  createdByEmail: string;
  summary: string;
  payloadJson: string;
  status: 'Ready' | 'Restored';
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface BackupPayload {
  schemaVersion: string;
  exportedAt: string;
  siteSettings: SiteSettingsInput | null;
  categories: Array<{ id: string } & CategoryInput>;
  products: Array<{ id: string } & ProductInput>;
  updates: Array<{ id: string } & UpdateInput>;
  roadmapItems: Array<{ id: string } & RoadmapItemInput>;
  downloadItems: Array<{ id: string } & DownloadItemInput>;
}

export type RecycleEntityType =
  | 'product'
  | 'category'
  | 'update'
  | 'mediaReference';

export interface RecycleBinItem {
  id: string;
  entityType: RecycleEntityType;
  originalId: string;
  title: string;
  snapshotJson: string;
  deletedByUid: string;
  deletedByEmail: string;
  createdAt?: Timestamp | Date | null;
}

export type NotificationType =
  | 'contact'
  | 'review'
  | 'newsletter'
  | 'security'
  | 'system';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkPath: string;
  isRead: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface FaqEntry {
  id: string;
  category: 'General' | 'Products' | 'Privacy & Security' | 'Developers & API';
  question: string;
  answer: string;
}
