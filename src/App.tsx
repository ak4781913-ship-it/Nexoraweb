import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AdminGuard } from './components/admin/AdminGuard';
import { ToastProvider } from './components/common/ToastProvider';
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthProvider } from './context/AuthContext';
import { SiteDataProvider } from './context/SiteDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { HomePage } from './pages/HomePage';

const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const CategoryDetailPage = lazy(() =>
  import('./pages/CategoryDetailPage').then((m) => ({
    default: m.CategoryDetailPage,
  })),
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
);
const UpdatesPage = lazy(() =>
  import('./pages/UpdatesPage').then((m) => ({ default: m.UpdatesPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  })),
);
const AdminMediaPage = lazy(() =>
  import('./pages/admin/AdminMediaPage').then((m) => ({
    default: m.AdminMediaPage,
  })),
);
const AdminUpdatesPage = lazy(() =>
  import('./pages/admin/AdminUpdatesPage').then((m) => ({
    default: m.AdminUpdatesPage,
  })),
);
const AdminMessagesPage = lazy(() =>
  import('./pages/admin/AdminMessagesPage').then((m) => ({
    default: m.AdminMessagesPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  })),
);

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white dark:bg-[#060B19]">
      <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SiteDataProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/"
                    element={
                      <PublicLayout>
                        <HomePage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <PublicLayout>
                        <ProductsPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/products/:slug"
                    element={
                      <PublicLayout>
                        <ProductDetailPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <PublicLayout>
                        <CategoriesPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/categories/:slug"
                    element={
                      <PublicLayout>
                        <CategoryDetailPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <PublicLayout>
                        <AboutPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/updates"
                    element={
                      <PublicLayout>
                        <UpdatesPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <PublicLayout>
                        <ContactPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/privacy"
                    element={
                      <PublicLayout>
                        <PrivacyPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <PublicLayout>
                        <TermsPage />
                      </PublicLayout>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminGuard>
                        <AdminDashboardPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/products"
                    element={
                      <AdminGuard>
                        <AdminProductsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminGuard>
                        <AdminCategoriesPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/media"
                    element={
                      <AdminGuard>
                        <AdminMediaPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/updates"
                    element={
                      <AdminGuard>
                        <AdminUpdatesPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/messages"
                    element={
                      <AdminGuard>
                        <AdminMessagesPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <AdminGuard>
                        <AdminSettingsPage />
                      </AdminGuard>
                    }
                  />

                  {/* 404 Catch-All */}
                  <Route
                    path="*"
                    element={
                      <PublicLayout>
                        <NotFoundPage />
                      </PublicLayout>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SiteDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
