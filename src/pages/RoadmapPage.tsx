import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Compass, Sparkles, Wrench } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { DEFAULT_ROADMAP_ITEMS } from '../data/defaults';
import { fetchPublicRoadmap } from '../services/firestoreService';
import type { RoadmapItem, RoadmapStatus } from '../types/nexora';

const STATUS_TABS: Array<'All' | RoadmapStatus> = [
  'All',
  'In Progress',
  'Planned',
  'Under Consideration',
  'Completed',
];

function getStatusMeta(status: RoadmapStatus) {
  switch (status) {
    case 'Completed':
      return {
        Icon: CheckCircle2,
        cls: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30',
      };
    case 'In Progress':
      return {
        Icon: Wrench,
        cls: 'text-blue-700 dark:text-cyan-400 border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30',
      };
    case 'Planned':
      return {
        Icon: Compass,
        cls: 'text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900/60 bg-violet-50/70 dark:bg-violet-950/30',
      };
    default:
      return {
        Icon: Clock,
        cls: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30',
      };
  }
}

export function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | RoadmapStatus>('All');

  useEffect(() => {
    let cancelled = false;
    fetchPublicRoadmap()
      .then((list) => {
        if (!cancelled) {
          setItems(list.length > 0 ? list : DEFAULT_ROADMAP_ITEMS);
        }
      })
      .catch(() => {
        if (!cancelled) setItems(DEFAULT_ROADMAP_ITEMS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      statusFilter === 'All'
        ? items
        : items.filter((i) => i.status === statusFilter),
    [items, statusFilter],
  );

  return (
    <>
      <SeoHead
        title="Public Roadmap — MAWA"
        description="Track what MAWA is planning, actively building, and shipping next across our digital product ecosystem."
        canonicalPath="/roadmap"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Ecosystem Trajectory
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            MAWA Public Product Roadmap
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Follow active engineering milestones, planned product launches, and
            research initiatives across the MAWA ecosystem.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800"
              role="group"
              aria-label="Filter roadmap by status"
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Suggest a Feature or Product
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1326] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((item) => {
                const meta = getStatusMeta(item.status);
                const Icon = meta.Icon;
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${meta.cls}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.status}
                        </span>
                        {item.targetQuarter && (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {item.targetQuarter}
                          </span>
                        )}
                      </div>

                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.category || 'MAWA Ecosystem'}</span>
                      {item.productSlug && (
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Product
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No roadmap milestones match the selected status filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
