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

// Public Pages (lazy-loaded)
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
const RoadmapPage = lazy(() =>
  import('./pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage })),
);
const DownloadsPage = lazy(() =>
  import('./pages/DownloadsPage').then((m) => ({ default: m.DownloadsPage })),
);
const ChangelogPage = lazy(() =>
  import('./pages/ChangelogPage').then((m) => ({ default: m.ChangelogPage })),
);
const FaqPage = lazy(() =>
  import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })),
);
const DevelopersPage = lazy(() =>
  import('./pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage })),
);
const PartnershipsPage = lazy(() =>
  import('./pages/PartnershipsPage').then((m) => ({
    default: m.PartnershipsPage,
  })),
);
const BusinessInquiriesPage = lazy(() =>
  import('./pages/BusinessInquiriesPage').then((m) => ({
    default: m.BusinessInquiriesPage,
  })),
);
const UnsubscribePage = lazy(() =>
  import('./pages/UnsubscribePage').then((m) => ({
    default: m.UnsubscribePage,
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

// Admin Pages (lazy-loaded)
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
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const AdminNotificationsPage = lazy(() =>
  import('./pages/admin/AdminNotificationsPage').then((m) => ({
    default: m.AdminNotificationsPage,
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
const AdminRoadmapPage = lazy(() =>
  import('./pages/admin/AdminRoadmapPage').then((m) => ({
    default: m.AdminRoadmapPage,
  })),
);
const AdminDownloadsPage = lazy(() =>
  import('./pages/admin/AdminDownloadsPage').then((m) => ({
    default: m.AdminDownloadsPage,
  })),
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage').then((m) => ({
    default: m.AdminReviewsPage,
  })),
);
const AdminMessagesPage = lazy(() =>
  import('./pages/admin/AdminMessagesPage').then((m) => ({
    default: m.AdminMessagesPage,
  })),
);
const AdminNewsletterPage = lazy(() =>
  import('./pages/admin/AdminNewsletterPage').then((m) => ({
    default: m.AdminNewsletterPage,
  })),
);
const AdminSeoPage = lazy(() =>
  import('./pages/admin/AdminSeoPage').then((m) => ({
    default: m.AdminSeoPage,
  })),
);
const AdminLogsPage = lazy(() =>
  import('./pages/admin/AdminLogsPage').then((m) => ({
    default: m.AdminLogsPage,
  })),
);
const AdminRecycleBinPage = lazy(() =>
  import('./pages/admin/AdminRecycleBinPage').then((m) => ({
    default: m.AdminRecycleBinPage,
  })),
);
const AdminBackupsPage = lazy(() =>
  import('./pages/admin/AdminBackupsPage').then((m) => ({
    default: m.AdminBackupsPage,
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
                    path="/roadmap"
                    element={
                      <PublicLayout>
                        <RoadmapPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/downloads"
                    element={
                      <PublicLayout>
                        <DownloadsPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/changelog"
                    element={
                      <PublicLayout>
                        <ChangelogPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <PublicLayout>
                        <FaqPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/developers"
                    element={
                      <PublicLayout>
                        <DevelopersPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/partnerships"
                    element={
                      <PublicLayout>
                        <PartnershipsPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/business"
                    element={
                      <PublicLayout>
                        <BusinessInquiriesPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/unsubscribe"
                    element={
                      <PublicLayout>
                        <UnsubscribePage />
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
                  <Route
                    path="/admin"
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
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
                    path="/admin/analytics"
                    element={
                      <AdminGuard>
                        <AdminAnalyticsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <AdminGuard>
                        <AdminNotificationsPage />
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
                    path="/admin/roadmap"
                    element={
                      <AdminGuard>
                        <AdminRoadmapPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/downloads"
                    element={
                      <AdminGuard>
                        <AdminDownloadsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/reviews"
                    element={
                      <AdminGuard>
                        <AdminReviewsPage />
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
                    path="/admin/newsletter"
                    element={
                      <AdminGuard>
                        <AdminNewsletterPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/seo"
                    element={
                      <AdminGuard>
                        <AdminSeoPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/logs"
                    element={
                      <AdminGuard>
                        <AdminLogsPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/recycle-bin"
                    element={
                      <AdminGuard>
                        <AdminRecycleBinPage />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/backups"
                    element={
                      <AdminGuard requireSuperAdmin>
                        <AdminBackupsPage />
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
