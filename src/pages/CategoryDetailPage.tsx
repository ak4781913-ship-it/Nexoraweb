import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { SeoHead } from '../components/common/SeoHead';
import { ProductCard } from '../components/products/ProductCard';
import { useSiteData } from '../context/SiteDataContext';
import { NotFoundPage } from './NotFoundPage';

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, products, loading } = useSiteData();

  const category = categories.find((c) => c.slug === slug || c.id === slug);

  if (loading && !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!category) {
    return <NotFoundPage />;
  }

  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id || p.categoryId === category.slug,
  );

  return (
    <>
      <SeoHead
        title={`${category.name} — MAWA Categories`}
        description={
          category.description ||
          `Explore ${category.name} digital products and platforms by MAWA.`
        }
        canonicalPath={`/categories/${category.slug}`}
      />

      <section className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080F22] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Categories
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CategoryIcon name={category.icon} className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {category.name}
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1326] p-10 text-center max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                No Published Products in {category.name} Yet
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Products in this category are currently being prepared for
                public release. Check back soon or explore our full directory.
              </p>
              <div className="mt-6">
                <Link
                  to="/products"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
