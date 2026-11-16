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
  brandName: 'MAWA',
  tagline: 'A Legacy of Innovation.',
  brandLogoUrl: '',
  brandDescription:
    'MAWA is a premium digital products and technology innovation platform building independent software applications, intelligent tools, websites, and online ecosystems.',
  aboutMission:
    'To design, engineer, and manage dependable digital products that solve everyday problems clearly and deliver modern software crafted to endure.',
  aboutVision:
    'A cohesive family of specialized software platforms, intelligent tools, websites, and applications united by clarity, engineering excellence, and A Legacy of Innovation.',
  aboutStory:
    'MAWA was built around a straightforward conviction: software should respect people’s time and earn lasting trust. Rather than bundling bloated features into monolithic apps, MAWA develops, manages, and publishes multiple independent digital products—from everyday utilities and AI studios to specialized learning platforms—each carrying the same standard of clarity, reliability, and craft.',
  defaultTheme: 'dark',
  seoTitle: 'MAWA — A Legacy of Innovation. | Digital Products & Technology Platform',
  seoDescription:
    'Explore digital products, software platforms, AI solutions, and web applications built by MAWA. A Legacy of Innovation.',
  contactEmail: 'contact@mawa.platform',
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
      'Specialized community platforms, culinary archives, and independent MAWA initiatives.',
    displayOrder: 8,
    publicationStatus: 'Published',
  },
];

// Planned products initialized strictly in Draft status until verified & published by an Admin.
export const PLANNED_DRAFT_PRODUCTS: Array<{ id: string } & ProductInput> = [
  {
    id: 'nexora-free-tools-hub',
    name: 'MAWA Free Tools Hub',
    slug: 'mawa-free-tools-hub',
    shortDescription:
      'A unified collection of fast, accessible browser utilities for everyday digital tasks.',
    fullDescription:
      'MAWA Free Tools Hub is designed to bring together practical formatting, conversion, text, and productivity utilities under a single distraction-free interface. Product profile details and external release URL are pending final verification before publication.',
    logoUrl: '',
    coverImageUrl: GENERATED_ASSETS.ecosystemHub,
    screenshotGallery: [],
    categoryId: 'free-tools-utilities',
    categoryName: 'Free Tools & Utilities',
    tags: ['Utilities', 'Web Tools', 'Productivity'],
    features: [
      'Instant browser-based execution with zero installation',
      'Clean, distraction-free interface across desktop and mobile',
      'Consistent MAWA design language and keyboard navigation',
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
    seoTitle: 'MAWA Free Tools Hub — Online Utilities Platform',
    seoDescription:
      'Planned MAWA digital utilities hub providing accessible browser tools.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-beauty-tips',
    name: 'MAWA Beauty Tips',
    slug: 'mawa-beauty-tips',
    shortDescription:
      'Practical skincare, grooming, and everyday beauty guidance organized for clarity.',
    fullDescription:
      'MAWA Beauty Tips is planned as a clean, well-structured digital publication and routine companion focused on accessible personal care guidance. Content verification and official URL configuration are managed in the Admin Dashboard prior to release.',
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
    seoTitle: 'MAWA Beauty Tips — Skincare & Lifestyle Guide',
    seoDescription:
      'Planned MAWA lifestyle platform dedicated to practical beauty and skincare guidance.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-prompt-studio',
    name: 'MAWA Prompt Studio',
    slug: 'mawa-prompt-studio',
    shortDescription:
      'A structured workspace for crafting, organizing, and refining AI prompts.',
    fullDescription:
      'MAWA Prompt Studio is envisioned as a dedicated environment for creators, developers, and researchers to structure reusable prompt templates and workflows. Publication awaits verified product configuration and release URL.',
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
    seoTitle: 'MAWA Prompt Studio — Structured AI Prompt Workspace',
    seoDescription:
      'Planned MAWA AI Tool for crafting and managing structured prompts.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-language-academy',
    name: 'MAWA Language Academy',
    slug: 'mawa-language-academy',
    shortDescription:
      'Interactive language learning modules focused on practical daily communication.',
    fullDescription:
      'MAWA Language Academy is planned as an online learning application built around concise lessons, vocabulary reinforcement, and real-world phrasing. Complete product details and release link will be published once verified.',
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
    seoTitle: 'MAWA Language Academy — Online Language Learning',
    seoDescription:
      'Planned MAWA education platform for practical language learning.',
    publicationStatus: 'Draft',
  },
  {
    id: 'nexora-homemade',
    name: 'MAWA Homemade',
    slug: 'mawa-homemade',
    shortDescription:
      'A clean digital archive for authentic homemade recipes, crafts, and kitchen guides.',
    fullDescription:
      'MAWA Homemade is planned as an independent digital platform celebrating approachable homemade recipes and step-by-step domestic craft guides. Ready for final editorial completion by the MAWA administration team.',
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
    seoTitle: 'MAWA Homemade — Recipes & Craft Guides',
    seoDescription:
      'Planned MAWA digital platform for homemade recipes and step-by-step guides.',
    publicationStatus: 'Draft',
  },
];

export const DEFAULT_UPDATES: Array<{ id: string } & UpdateInput> = [
  {
    id: 'introducing-nexora-platform',
    title: 'Introducing the Official MAWA Digital Products Platform',
    slug: 'introducing-mawa-platform',
    summary:
      'MAWA launches its central directory and brand home connecting independent web applications, AI tools, and online platforms.',
    content:
      'Welcome to the official MAWA platform. Designed as the central hub for every product built under the MAWA identity, this portal brings together our product directory, category architecture, release updates, and direct contact channels.\n\nEach MAWA product operates with its own focused purpose and independent domain while sharing a unified commitment to clarity, reliability, and accessible design.',
    type: 'Announcement',
    relatedProductSlug: '',
    coverImageUrl: GENERATED_ASSETS.heroArchitecture,
    publishedAt: '2026-11-15',
    publicationStatus: 'Published',
  },
  {
    id: 'nexora-product-roadmap-overview',
    title: 'MAWA Product Ecosystem Roadmap & Upcoming Releases',
    slug: 'mawa-product-roadmap-overview',
    summary:
      'An overview of the foundational MAWA product initiatives currently in preparation across utilities, AI tools, education, and lifestyle.',
    content:
      'Our engineering and product teams are actively preparing the initial wave of MAWA platforms—including MAWA Free Tools Hub, MAWA Prompt Studio, MAWA Language Academy, MAWA Beauty Tips, and MAWA Homemade.\n\nEach product will transition from internal preparation to public release on this platform as soon as its core experience, documentation, and official website are verified.',
    type: 'Roadmap',
    relatedProductSlug: '',
    coverImageUrl: GENERATED_ASSETS.ecosystemAi,
    publishedAt: '2026-11-15',
    publicationStatus: 'Published',
  },
];
