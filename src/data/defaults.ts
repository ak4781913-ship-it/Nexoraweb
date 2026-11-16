import type {
  CategoryInput,
  ProductInput,
  SiteSettingsInput,
  UpdateInput,
} from '../types/nexora';

export const GENERATED_ASSETS = {
  heroArchitecture:
    '/src/assets/images/hero_nexora_architecture_1794813180323.jpg',
  aboutStudio: '/src/assets/images/about_nexora_studio_1794813181634.jpg',
  ecosystemAi: '/src/assets/images/ecosystem_ai_systems_1794813181103.jpg',
  ecosystemHub: '/src/assets/images/ecosystem_digital_hub_1794813181234.jpg',
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsInput = {
  brandName: 'NEXORA',
  tagline: 'One Vision. Multiple Innovations. Infinite Possibilities.',
  brandLogoUrl: '',
  brandDescription:
    'NEXORA is an independent digital products and technology innovation brand building practical software applications, intelligent tools, and accessible online platforms.',
  aboutMission:
    'To design and engineer focused, dependable digital products that solve everyday problems clearly and make modern software accessible to everyone.',
  aboutVision:
    'A cohesive family of specialized web platforms, intelligent tools, and digital applications unified by thoughtful engineering and enduring design.',
  aboutStory:
    'NEXORA was founded around a straightforward conviction: software should respect people’s time. Rather than bundling bloated features into monolithic apps, NEXORA builds independent, purpose-built products—from everyday utilities and creative studios to specialized learning platforms—each carrying the same standard of clarity, reliability, and craft.',
  defaultTheme: 'dark',
  seoTitle: 'NEXORA — Digital Products & Technology Innovation',
  seoDescription:
    'Explore innovative digital products, intelligent tools, and online platforms built by NEXORA. One Vision. Multiple Innovations. Infinite Possibilities.',
  contactEmail: 'contact@nexora.platform',
  contactLocation: 'Global Digital Studio',
  socialGithub: '',
  socialX: '',
  socialLinkedin: '',
  socialYoutube: '',
};

export const DEFAULT_CATEGORIES: Array<{ id: string } & CategoryInput> = [
  {
    id: 'ai-innovation',
    name: 'AI & Innovation',
    slug: 'ai-innovation',
    icon: 'Cpu',
    imageUrl: GENERATED_ASSETS.ecosystemAi,
    description:
      'Intelligent workflows, prompt engineering studios, and applied machine intelligence tools.',
    displayOrder: 1,
    publicationStatus: 'Published',
  },
  {
    id: 'free-tools-utilities',
    name: 'Free Tools & Utilities',
    slug: 'free-tools-utilities',
    icon: 'Wrench',
    imageUrl: GENERATED_ASSETS.ecosystemHub,
    description:
      'Fast, browser-native utilities designed to simplify everyday technical and creative tasks.',
    displayOrder: 2,
    publicationStatus: 'Published',
  },
  {
    id: 'beauty-lifestyle',
    name: 'Beauty & Lifestyle',
    slug: 'beauty-lifestyle',
    icon: 'Sparkles',
    imageUrl: '',
    description:
      'Thoughtfully curated guides, care routines, and lifestyle digital companions.',
    displayOrder: 3,
    publicationStatus: 'Published',
  },
  {
    id: 'education-learning',
    name: 'Education & Learning',
    slug: 'education-learning',
    icon: 'GraduationCap',
    imageUrl: '',
    description:
      'Structured interactive learning environments, language academies, and study platforms.',
    displayOrder: 4,
    publicationStatus: 'Published',
  },
  {
    id: 'productivity-management',
    name: 'Productivity & Management',
    slug: 'productivity-management',
    icon: 'Layers',
    imageUrl: '',
    description:
      'Focused organization, planning, and operational clarity for individuals and small teams.',
    displayOrder: 5,
    publicationStatus: 'Published',
  },
  {
    id: 'web-applications',
    name: 'Web Applications',
    slug: 'web-applications',
    icon: 'Globe',
    imageUrl: '',
    description:
      'Responsive, zero-install browser applications engineered for speed and clarity.',
    displayOrder: 6,
    publicationStatus: 'Published',
  },
  {
    id: 'mobile-applications',
    name: 'Mobile Applications',
    slug: 'mobile-applications',
    icon: 'Smartphone',
    imageUrl: '',
    description:
      'Dedicated mobile experiences built for on-the-go usability across iOS and Android.',
    displayOrder: 7,
    publicationStatus: 'Published',
  },
  {
    id: 'other-digital-products',
    name: 'Other Digital Products',
    slug: 'other-digital-products',
    icon: 'Box',
    imageUrl: '',
    description:
      'Specialized community platforms, culinary archives, and independent NEXORA initiatives.',
    displayOrder: 8,
    publicationStatus: 'Published',
  },
];

// Planned products initialized strictly in Draft status until verified & published by an Admin.
export const PLANNED_DRAFT_PRODUCTS: Array<{ id: string } & ProductInput> = [
  {
    id: 'nexora-free-tools-hub',
    name: 'NEXORA Free Tools Hub',
    slug: 'nexora-free-tools-hub',
    shortDescription:
      'A unified collection of fast, accessible browser utilities for everyday digital tasks.',
    fullDescription:
      'NEXORA Free Tools Hub is designed to bring together practical formatting, conversion, text, and productivity utilities under a single distraction-free interface. Product profile details and external release URL are pending final verification before publication.',
    logoUrl: '',
    coverImageUrl: GENERATED_ASSETS.ecosystemHub,
    screenshotGallery: [],
    categoryId: 'free-tools-utilities',
    categoryName: 'Free Tools & Utilities',
    tags: ['Utilities', 'Web Tools', 'Productivity'],
    features: [
      'Instant browser-based execution with zero installation',
      'Clean, distraction-free interface across desktop and mobile',
      'Consistent NEXORA design language and keyboard navigation',
    ],
    benefits: [
      'Saves time on everyday file, text, and formatting workflows',
      'Accessible anywhere with a modern web browser',
    ],
    officialWebsiteUrl: '',
    productType: 'Digital Platform',
    pricingType: 'Free',
    supportedPlatforms: ['Web', 'Mobile Web'],
    launchDate: '',
    featured: false,
    displayOrder: 1,
    seoTitle: 'NEXORA Free Tools Hub — Online Utilities Platform',
    seoDescription:
      'Planned NEXORA digital utilities hub providing accessible browser tools.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-beauty-tips',
    name: 'NEXORA Beauty Tips',
    slug: 'nexora-beauty-tips',
    shortDescription:
      'Practical skincare, grooming, and everyday beauty guidance organized for clarity.',
    fullDescription:
      'NEXORA Beauty Tips is planned as a clean, well-structured digital publication and routine companion focused on accessible personal care guidance. Content verification and official URL configuration are managed in the Admin Dashboard prior to release.',
    logoUrl: '',
    coverImageUrl: '',
    screenshotGallery: [],
    categoryId: 'beauty-lifestyle',
    categoryName: 'Beauty & Lifestyle',
    tags: ['Skincare', 'Lifestyle', 'Guides'],
    features: [
      'Structured routine guides and ingredient reference notes',
      'Searchable topic index designed for mobile reading',
    ],
    benefits: [
      'Clear, uncluttered lifestyle guidance without intrusive clutter',
    ],
    officialWebsiteUrl: '',
    productType: 'Website',
    pricingType: 'Free',
    supportedPlatforms: ['Web'],
    launchDate: '',
    featured: false,
    displayOrder: 2,
    seoTitle: 'NEXORA Beauty Tips — Skincare & Lifestyle Guide',
    seoDescription:
      'Planned NEXORA lifestyle platform dedicated to practical beauty and skincare guidance.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-prompt-studio',
    name: 'NEXORA Prompt Studio',
    slug: 'nexora-prompt-studio',
    shortDescription:
      'A structured workspace for crafting, organizing, and refining AI prompts.',
    fullDescription:
      'NEXORA Prompt Studio is envisioned as a dedicated environment for creators, developers, and researchers to structure reusable prompt templates and workflows. Publication awaits verified product configuration and release URL.',
    logoUrl: '',
    coverImageUrl: GENERATED_ASSETS.ecosystemAi,
    screenshotGallery: [],
    categoryId: 'ai-innovation',
    categoryName: 'AI & Innovation',
    tags: ['AI', 'Prompts', 'Workflow'],
    features: [
      'Modular prompt templates and parameter blocks',
      'Organized personal library with tag-based retrieval',
    ],
    benefits: [
      'Produces more consistent, repeatable outcomes from modern AI models',
    ],
    officialWebsiteUrl: '',
    productType: 'AI Tool',
    pricingType: 'Freemium',
    supportedPlatforms: ['Web', 'Desktop'],
    launchDate: '',
    featured: false,
    displayOrder: 3,
    seoTitle: 'NEXORA Prompt Studio — Structured AI Prompt Workspace',
    seoDescription:
      'Planned NEXORA AI Tool for crafting and managing structured prompts.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-language-academy',
    name: 'NEXORA Language Academy',
    slug: 'nexora-language-academy',
    shortDescription:
      'Interactive language learning modules focused on practical daily communication.',
    fullDescription:
      'NEXORA Language Academy is planned as an online learning application built around concise lessons, vocabulary reinforcement, and real-world phrasing. Complete product details and release link will be published once verified.',
    logoUrl: '',
    coverImageUrl: '',
    screenshotGallery: [],
    categoryId: 'education-learning',
    categoryName: 'Education & Learning',
    tags: ['Language', 'Learning', 'Education'],
    features: [
      'Bite-sized structured lessons with clear progression',
      'Practical conversational phrasing and review exercises',
    ],
    benefits: [
      'Supports steady daily language practice from any device',
    ],
    officialWebsiteUrl: '',
    productType: 'Web Application',
    pricingType: 'Freemium',
    supportedPlatforms: ['Web', 'Mobile Web'],
    launchDate: '',
    featured: false,
    displayOrder: 4,
    seoTitle: 'NEXORA Language Academy — Online Language Learning',
    seoDescription:
      'Planned NEXORA education platform for practical language learning.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-homemade',
    name: 'NEXORA Homemade',
    slug: 'nexora-homemade',
    shortDescription:
      'A clean digital archive for authentic homemade recipes, crafts, and kitchen guides.',
    fullDescription:
      'NEXORA Homemade is planned as an independent digital platform celebrating approachable homemade recipes and step-by-step domestic craft guides. Ready for final editorial completion by the NEXORA administration team.',
    logoUrl: '',
    coverImageUrl: '',
    screenshotGallery: [],
    categoryId: 'other-digital-products',
    categoryName: 'Other Digital Products',
    tags: ['Recipes', 'Homemade', 'Lifestyle'],
    features: [
      'Step-by-step preparation instructions with clear ingredient lists',
      'Clean print-friendly and mobile-friendly recipe layouts',
    ],
    benefits: [
      'Makes everyday homemade cooking straightforward and enjoyable',
    ],
    officialWebsiteUrl: '',
    productType: 'Website',
    pricingType: 'Free',
    supportedPlatforms: ['Web'],
    launchDate: '',
    featured: false,
    displayOrder: 5,
    seoTitle: 'NEXORA Homemade — Recipes & Craft Guides',
    seoDescription:
      'Planned NEXORA digital platform for homemade recipes and step-by-step guides.',
    publicationStatus: 'Draft',
  },
];

export const DEFAULT_UPDATES: Array<{ id: string } & UpdateInput> = [
  {
    id: 'introducing-nexora-platform',
    title: 'Introducing the Official NEXORA Digital Products Platform',
    slug: 'introducing-nexora-platform',
    summary:
      'NEXORA launches its central directory and brand home connecting independent web applications, AI tools, and online platforms.',
    content:
      'Welcome to the official NEXORA platform. Designed as the central hub for every product built under the NEXORA identity, this portal brings together our product directory, category architecture, release updates, and direct contact channels.\n\nEach NEXORA product operates with its own focused purpose and independent domain while sharing a unified commitment to clarity, reliability, and accessible design.',
    type: 'Announcement',
    relatedProductSlug: '',
    coverImageUrl: GENERATED_ASSETS.heroArchitecture,
    publishedAt: '2026-11-15',
    publicationStatus: 'Published',
  },
  {
    id: 'nexora-product-roadmap-overview',
    title: 'Product Ecosystem Roadmap & Upcoming Releases',
    slug: 'nexora-product-roadmap-overview',
    summary:
      'An overview of the foundational NEXORA product initiatives currently in preparation across utilities, AI tools, education, and lifestyle.',
    content:
      'Our engineering and product teams are actively preparing the initial wave of NEXORA platforms—including NEXORA Free Tools Hub, NEXORA Prompt Studio, NEXORA Language Academy, NEXORA Beauty Tips, and NEXORA Homemade.\n\nEach product will transition from internal preparation to public release on this platform as soon as its core experience, documentation, and official website are verified.',
    type: 'Roadmap',
    relatedProductSlug: '',
    coverImageUrl: GENERATED_ASSETS.ecosystemAi,
    publishedAt: '2026-11-15',
    publicationStatus: 'Published',
  },
];
