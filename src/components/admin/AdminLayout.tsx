import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  DatabaseBackup,
  Download,
  ExternalLink,
  FolderTree,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Moon,
  Newspaper,
  Package,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import { useTheme } from '../../context/ThemeContext';
import { NexoraLogo } from '../common/NexoraLogo';

interface NavSection {
  heading: string;
  items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    superAdminOnly?: boolean;
  }>;
}

const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    heading: 'Catalog & Media',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/updates', label: 'Updates', icon: Megaphone },
      { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
      { to: '/admin/roadmap', label: 'Roadmap', icon: Map },
      { to: '/admin/downloads', label: 'Downloads', icon: Download },
    ],
  },
  {
    heading: 'Community & Inbox',
    items: [
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
      { to: '/admin/messages', label: 'Messages', icon: Mail },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Newspaper },
    ],
  },
  {
    heading: 'System & SEO',
    items: [
      { to: '/admin/seo', label: 'SEO & Sitemap', icon: Globe },
      { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
      { to: '/admin/recycle-bin', label: 'Recycle Bin', icon: Trash2 },
      {
        to: '/admin/backups',
        label: 'Backups',
        icon: DatabaseBackup,
        superAdminOnly: true,
      },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminLayout({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, adminRole, isSuperAdmin, logout } = useAuth();
  const { settings } = useSiteData();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <NexoraLogo
            logoUrl={settings.brandLogoUrl}
            brandName={settings.brandName || 'MAWA'}
            size="sm"
          />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {ADMIN_NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.superAdminOnly || isSuperAdmin,
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.heading} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {section.heading}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
        <div className="text-xs space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {user?.displayName || 'Administrator'}
            </p>
            <span
              className={`text-[11px] font-medium shrink-0 ${
                isSuperAdmin
                  ? 'text-blue-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {adminRole || 'Editor'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 truncate">
            {user?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080F22]">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-[#080F22] border-r border-slate-200 dark:border-slate-800 z-10">
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080F22]/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              {breadcrumb && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {breadcrumb}
                </p>
              )}
              <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Public Site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
