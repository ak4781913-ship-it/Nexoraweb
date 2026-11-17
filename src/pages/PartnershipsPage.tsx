import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Cpu, Globe2, Handshake } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';

const TRACKS = [
  {
    title: 'Technology & Product Integration',
    description:
      'Co-develop utility integrations, AI workflows, and browser-native extensions connected to the MAWA ecosystem.',
    icon: Cpu,
  },
  {
    title: 'Education & Learning Alliances',
    description:
      'Partner with MAWA Language Academy and educational portals to publish structured curricula and study tools.',
    icon: BookOpen,
  },
  {
    title: 'Media & Distribution Partners',
    description:
      'Collaborate on verified software listings, syndication, and launch spotlights for independent digital tools.',
    icon: Globe2,
  },
  {
    title: 'Strategic Advisory & Sponsorships',
    description:
      'Work directly with the MAWA studio on long-horizon product initiatives and bespoke digital solutions.',
    icon: Handshake,
  },
];

export function PartnershipsPage() {
  return (
    <>
      <SeoHead
        title="Partnerships — MAWA"
        description="Explore strategic technology, education, distribution, and product partnerships with MAWA."
        canonicalPath="/partnerships"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Collaborate with MAWA
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Partnerships &amp; Strategic Alliances
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            We partner with educators, software builders, and forward-thinking
            organizations who share our focus on practical, reliable digital
            experiences.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              return (
                <article
                  key={track.title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {track.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {track.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-[#0E1938] p-8 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-2xl font-bold">
                Ready to propose a partnership?
              </h2>
              <p className="text-sm text-slate-300">
                Submit your organization details and collaboration scope through
                our dedicated Business Inquiries portal.
              </p>
            </div>
            <Link
              to="/business"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              Submit Proposal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
