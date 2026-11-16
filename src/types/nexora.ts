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
