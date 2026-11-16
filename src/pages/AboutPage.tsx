import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';
import { GENERATED_ASSETS } from '../data/defaults';

export function AboutPage() {
  const { settings } = useSiteData();

  return (
    <>
      <SeoHead
        title={`About ${settings.brandName || 'NEXORA'} — Vision & Principles`}
        description={
          settings.brandDescription ||
          'Learn about NEXORA, an independent digital products and technology innovation brand.'
        }
        canonicalPath="/about"
        ogImage={GENERATED_ASSETS.aboutStudio}
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            {settings.tagline}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            Building Focused Digital Products with Long-Term Craft.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {settings.brandDescription}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="aspect-video rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-[#0B1326]">
            <SafeImage
              src={GENERATED_ASSETS.aboutStudio}
              alt="NEXORA engineering studio"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-7 space-y-3">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Our Mission
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {settings.aboutMission}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-7 space-y-3">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Our Vision
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {settings.aboutVision}
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              The NEXORA Approach
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line max-w-3xl">
              {settings.aboutStory}
            </p>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Explore NEXORA Products
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              Contact the Team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
