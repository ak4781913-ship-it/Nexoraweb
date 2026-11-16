import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';

export function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="Page Not Found (404) — MAWA"
        description="The requested page or product could not be found on the MAWA platform."
        noIndex
      />
      <section className="py-24 sm:py-32">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <p className="font-mono text-sm font-semibold text-blue-600 dark:text-cyan-400 tabular-nums">
            404
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            The product, category, or page you requested does not exist or is
            not publicly available.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              to="/products"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
