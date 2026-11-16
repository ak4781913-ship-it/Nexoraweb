import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { SafeImage } from '../components/common/SafeImage';
import { SeoHead } from '../components/common/SeoHead';
import { useSiteData } from '../context/SiteDataContext';

export function CategoriesPage() {
  const { categories, products } = useSiteData();

  return (
    <>
      <SeoHead
        title="Product Categories — MAWA"
        description="Browse MAWA digital product categories spanning AI & Innovation, Free Tools, Education, Productivity, Web Apps, and Mobile Apps."
        canonicalPath="/categories"
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
            Taxonomy
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Product Categories
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Every MAWA platform is organized into a clear domain so you can
            discover tools tailored to your needs.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id || p.categoryId === cat.slug,
            ).length;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1326] overflow-hidden hover:border-blue-500/50 transition-colors flex flex-col"
              >
                {cat.imageUrl && (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-[#0F1830] overflow-hidden">
                    <SafeImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CategoryIcon name={cat.icon} className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">
                      {count} {count === 1 ? 'published product' : 'published products'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
