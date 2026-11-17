import { Link } from 'react-router-dom';
import { ArrowRight, Blocks, Code2, Cpu, ShieldCheck } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';

const ARCHITECTURE_PILLARS = [
  {
    title: 'Modular Web & App Surfaces',
    detail:
      'Every MAWA product operates independently on a focused domain while sharing unified accessibility, typography, and dark/light theme standards.',
    icon: Blocks,
  },
  {
    title: 'Zero-Trust Data Isolation',
    detail:
      'Strict Firestore and Storage security rules separate public catalogs from private inquiries, review queues, and role-gated administration.',
    icon: ShieldCheck,
  },
  {
    title: 'Applied Intelligence Architecture',
    detail:
      'AI capabilities are routed through server-verified API endpoints with strict input schemas and graceful static-host fallbacks.',
    icon: Cpu,
  },
  {
    title: 'Clean Distribution Standards',
    detail:
      'Downloadable software packages require HTTPS hosting, explicit versioning, and optional SHA-256 checksums for integrity verification.',
    icon: Code2,
  },
];

export function DevelopersPage() {
  return (
    <>
      <SeoHead
        title="Developers & Ecosystem Architecture — MAWA"
        description="Explore MAWA technical standards, modular software architecture, security model, and ecosystem integration inquiries."
        canonicalPath="/developers"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Engineering &amp; Standards
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            MAWA Developers &amp; Ecosystem
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            How MAWA engineers, secures, and distributes independent digital
            products across web, desktop, and mobile environments.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARCHITECTURE_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080F22] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Interested in technical collaboration or integrations?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Reach out through our business inquiry desk to discuss API
                access requests, tooling collaborations, or custom engineering.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/business"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Business &amp; API Inquiries
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/roadmap"
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                View Roadmap
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
