import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Globe,
  Layers,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AiProductRecommender } from '../components/ai/AiProductRecommender';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { NewsletterSection } from '../components/common/NewsletterSection';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { GENERATED_ASSETS } from '../data/defaults';

const WHY_MAWA = [
  {
    num: '01',
    title: 'Practical Digital Solutions',
    description:
      'Every product begins with a concrete user workflow—eliminating unnecessary complexity so everyday tasks happen faster.',
  },
  {
    num: '02',
    title: 'User-Focused Experiences',
    description:
      'Clean typography, accessible contrast, and responsive layouts ensure dependable usability across phones, tablets, and desktops.',
  },
  {
    num: '03',
    title: 'Continuous Innovation',
    description:
      'Applied AI capabilities and modern web engineering are integrated thoughtfully where they deliver measurable utility.',
  },
  {
    num: '04',
    title: 'Accessible Online Products',
    description:
      'Zero-install web experiences and clear pricing structures make modern software straightforward to adopt.',
  },
  {
    num: '05',
    title: 'Independent Product Platforms',
    description:
      'Each product operates on its own dedicated platform and domain while maintaining unified MAWA engineering standards.',
  },
];

const ECOSYSTEM_TYPES = [
  {
    title: 'AI Tools',
    detail: 'Structured prompt studios and applied machine intelligence utilities.',
    icon: Cpu,
  },
  {
    title: 'Web Applications',
    detail: 'Interactive browser software engineered for speed and clarity.',
    icon: Globe,
  },
  {
    title: 'Digital Platforms',
    detail: 'Unified hubs uniting specialized utilities and curated resources.',
    icon: Layers,
  },
  {
    title: 'Mobile Applications',
    detail: 'Touch-first experiences built for reliable daily mobile usage.',
    icon: Smartphone,
  },
  {
    title: 'Online Services',
    detail: 'Cloud-backed tools designed for seamless cross-device access.',
    icon: ShieldCheck,
  },
  {
    title: 'Focused Websites',
    detail: 'Editorial guides, learning portals, and niche knowledge destinations.',
    icon: Sparkles,
  },
];

export function HomePage() {
  const { products, categories, updates, settings, loading } = useSiteData();
  const { isAdmin } = useAuth();

  const featuredProducts = products.filter((p) => p.featured);
  const showcaseProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 6)
      : products.slice(0, 6);

  const recentUpdates = updates.slice(0, 3);

  return (
    <>
      <SeoHead
        title={
          settings.seoTitle ||
          'MAWA — A Legacy of Innovation. | Digital Products & Technology Platform'
        }
        description={
          settings.seoDescription ||
          'Explore digital products, software platforms, AI solutions, and web applications built by MAWA.'
        }
        canonicalPath="/"
        ogImage={settings.ogImageUrl || '/mawa-og.png'}
      />

      {/* B. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-white dark:from-[#070D1F] dark:via-[#060B19] dark:to-[#060B19]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(ellipse_75%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)] dark:bg-[radial-gradient(ellipse_75%_50%_at_50%_-10%,rgba(59,130,246,0.22),transparent)]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6"
            >
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
                {settings.tagline}
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold tracking-tight leading-[1.08] text-slate-900 dark:text-white text-balance">
                Discover a World of Digital Possibilities.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Explore innovative digital products, intelligent tools, and
                online experiences created to make everyday tasks simpler and
                technology more accessible.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors whitespace-nowrap"
                >
                  Explore Our Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap"
                >
                  View Roadmap
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden shadow-2xl shadow-blue-950/15 dark:shadow-blue-950/40 aspect-video">
                <SafeImage
                  src={GENERATED_ASSETS.heroArchitecture}
                  alt="MAWA architectural digital systems visualization"
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-tr from-[#060B19]/40 via-transparent to-blue-600/10 pointer-events-none"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* C. Brand Introduction */}
      <section className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-[#0B1326] min-h-[16rem]">
              <SafeImage
                src={GENERATED_ASSETS.aboutStudio}
                alt="MAWA engineering and product design environment"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                About the Brand
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                An independent digital products and technology innovation studio.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {settings.brandDescription}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {settings.aboutMission}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-5">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Read the MAWA story
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/downloads"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Visit Download Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Featured Products */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-[#080F22] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
                Product Directory
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Featured Digital Products
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Purpose-built software applications, online utilities, and
                digital platforms across the MAWA ecosystem.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] animate-pulse"
                />
              ))}
            </div>
          ) : showcaseProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcaseProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-8 sm:p-10 text-center max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Upcoming MAWA Releases in Preparation
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Our initial wave of digital products is currently undergoing
                final verification in the MAWA Studio before public launch.
                Explore our product categories or follow the public roadmap for
                release updates.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/categories"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors"
                >
                  Browse Categories
                </Link>
                <Link
                  to="/roadmap"
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                >
                  View Roadmap
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/products"
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    Manage Products in Admin
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI Product Recommender */}
      <AiProductRecommender />

      {/* E. Explore Categories */}
      <section className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                Solution Domains
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Explore Categories
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Browse MAWA initiatives organized by domain and practical use
                case.
              </p>
            </div>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              All Categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((category) => {
              const count = products.filter(
                (p) =>
                  p.categoryId === category.id ||
                  p.categoryId === category.slug,
              ).length;
              return (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] p-6 hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CategoryIcon name={category.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">
                      {count} {count === 1 ? 'product' : 'products'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* F. Product Ecosystem */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-[#080F22] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-violet-600 dark:text-violet-400">
                Product Ecosystem
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                Multiple Formats, One Cohesive Standard.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                MAWA builds across six complementary software formats—ensuring
                every idea takes the form that serves its users best, from
                lightweight browser utilities to full web applications.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <SafeImage
                    src={GENERATED_ASSETS.ecosystemAi}
                    alt="Modular AI software architecture"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <SafeImage
                    src={GENERATED_ASSETS.ecosystemHub}
                    alt="Precision digital utilities hub"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ECOSYSTEM_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* G. Why MAWA? */}
      <section className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-2">
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Engineering Principles
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why MAWA?
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80 border-y border-slate-200 dark:border-slate-800/80">
            {WHY_MAWA.map((item) => (
              <div
                key={item.num}
                className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline"
              >
                <div className="md:col-span-5 flex items-baseline gap-4">
                  <span className="font-mono text-sm font-medium text-blue-600 dark:text-cyan-400 tabular-nums">
                    {item.num}.
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="md:col-span-7 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H. Latest Launches & Updates */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-[#080F22] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
                What&apos;s New
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Latest Launches &amp; Announcements
              </h2>
            </div>
            <div className="flex items-center gap-5">
              <Link
                to="/changelog"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap"
              >
                Changelog
              </Link>
              <Link
                to="/updates"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                All Updates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentUpdates.map((post) => (
              <article
                key={post.id}
                className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] overflow-hidden"
              >
                {post.coverImageUrl && (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-[#0F1830] overflow-hidden">
                    <SafeImage
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {post.type}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <time className="font-mono tabular-nums">
                      {post.publishedAt}
                    </time>
                  </div>
                  <h3 className="mt-2.5 text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                    {post.summary}
                  </p>
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      to={`/updates?post=${encodeURIComponent(post.slug)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read Announcement
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Dispatch */}
      <NewsletterSection source="home" />

      {/* I. Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-[#0B152E] to-[#111C3D] p-8 sm:p-12 lg:p-16 text-white">
            <div className="max-w-2xl space-y-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                {settings.tagline}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-balance">
                Explore the growing suite of MAWA digital products.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Discover independent tools, AI workflows, and web applications
                designed for clarity—or reach out directly with feedback and
                partnership inquiries.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
                >
                  Browse Product Directory
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg border border-slate-600 text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Contact MAWA
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
