import { useCallback, useEffect, useState } from 'react';
import { Lock, Plus, Trash2, Upload } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import {
  addAdministrator,
  fetchAdministrators,
  removeAdministrator,
  saveSiteSettings,
  updateAdministratorRole,
} from '../../services/firestoreService';
import { uploadMediaFile } from '../../services/storageService';
import { isSafeAssetUrl, isValidExternalUrl } from '../../utils/url';
import type {
  Administrator,
  AdminRole,
  SiteSettingsInput,
  ThemePreference,
} from '../../types/nexora';

const UID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminSettingsPage() {
  const { isSuperAdmin } = useAuth();
  const { settings, refreshPublicData } = useSiteData();
  const { showToast } = useToast();

  const [form, setForm] = useState<SiteSettingsInput>({
    brandName: settings.brandName,
    tagline: settings.tagline,
    brandLogoUrl: settings.brandLogoUrl,
    brandDescription: settings.brandDescription,
    aboutMission: settings.aboutMission,
    aboutVision: settings.aboutVision,
    aboutStory: settings.aboutStory,
    defaultTheme: settings.defaultTheme,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    contactEmail: settings.contactEmail,
    contactLocation: settings.contactLocation,
    socialGithub: settings.socialGithub,
    socialX: settings.socialX,
    socialLinkedin: settings.socialLinkedin,
    socialYoutube: settings.socialYoutube,
    canonicalDomain: settings.canonicalDomain || '',
    ogImageUrl: settings.ogImageUrl || '/mawa-og.png',
    gaMeasurementId: settings.gaMeasurementId || '',
    aiAssistantEnabled: settings.aiAssistantEnabled !== false,
    newsletterEnabled: settings.newsletterEnabled !== false,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);

  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('Editor');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removeAdminTarget, setRemoveAdminTarget] =
    useState<Administrator | null>(null);

  useEffect(() => {
    setForm({
      brandName: settings.brandName,
      tagline: settings.tagline,
      brandLogoUrl: settings.brandLogoUrl,
      brandDescription: settings.brandDescription,
      aboutMission: settings.aboutMission,
      aboutVision: settings.aboutVision,
      aboutStory: settings.aboutStory,
      defaultTheme: settings.defaultTheme,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      contactEmail: settings.contactEmail,
      contactLocation: settings.contactLocation,
      socialGithub: settings.socialGithub,
      socialX: settings.socialX,
      socialLinkedin: settings.socialLinkedin,
      socialYoutube: settings.socialYoutube,
      canonicalDomain: settings.canonicalDomain || '',
      ogImageUrl: settings.ogImageUrl || '/mawa-og.png',
      gaMeasurementId: settings.gaMeasurementId || '',
      aiAssistantEnabled: settings.aiAssistantEnabled !== false,
      newsletterEnabled: settings.newsletterEnabled !== false,
    });
  }, [settings]);

  const loadAdmins = useCallback(async () => {
    try {
      const list = await fetchAdministrators();
      setAdmins(list);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Failed to load administrators roster.',
        'error',
      );
    }
  }, [showToast]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Only Super Admins can modify global site settings.', 'error');
      return;
    }
    if (form.brandLogoUrl.trim() && !isSafeAssetUrl(form.brandLogoUrl)) {
      showToast(
        'Brand logo URL must be a valid https://, http://, or local asset path.',
        'error',
      );
      return;
    }
    if (
      (form.ogImageUrl || '').trim() &&
      !isSafeAssetUrl(form.ogImageUrl || '')
    ) {
      showToast(
        'OpenGraph image URL must be a valid https://, http://, or local asset path.',
        'error',
      );
      return;
    }
    if (
      (form.canonicalDomain || '').trim() &&
      !isValidExternalUrl(form.canonicalDomain || '')
    ) {
      showToast('Canonical domain URL must start with https:// or http://', 'error');
      return;
    }
    const socialChecks = [
      { label: 'GitHub URL', value: form.socialGithub },
      { label: 'LinkedIn URL', value: form.socialLinkedin },
      { label: 'X URL', value: form.socialX },
      { label: 'YouTube URL', value: form.socialYoutube },
    ];
    for (const s of socialChecks) {
      if (s.value.trim() && !isValidExternalUrl(s.value)) {
        showToast(`${s.label} must start with https:// or http://`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await saveSiteSettings(form);
      await refreshPublicData();
      showToast('Site settings & about content saved.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save settings.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const url = await uploadMediaFile(file, 'brand');
      setForm((prev) => ({ ...prev, brandLogoUrl: url }));
      showToast('Brand logo uploaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Logo upload failed.',
        'error',
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOgUpload = async (file: File) => {
    setUploadingOg(true);
    try {
      const url = await uploadMediaFile(file, 'brand');
      setForm((prev) => ({ ...prev, ogImageUrl: url }));
      showToast('OpenGraph social image uploaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'OG image upload failed.',
        'error',
      );
    } finally {
      setUploadingOg(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Only Super Admins can add administrators.', 'error');
      return;
    }
    const cleanUid = newAdminUid.trim();
    const cleanEmail = newAdminEmail.trim();
    const cleanName = newAdminName.trim();
    if (!UID_REGEX.test(cleanUid)) {
      showToast(
        'Firebase Auth UID must be 1–128 alphanumeric, hyphen, or underscore characters.',
        'error',
      );
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      showToast('Please enter a valid administrator email address.', 'error');
      return;
    }
    if (!cleanName) {
      showToast('Administrator display name is required.', 'error');
      return;
    }
    setAddingAdmin(true);
    try {
      await addAdministrator(
        newAdminUid,
        newAdminEmail,
        newAdminName,
        newAdminRole,
      );
      showToast('Administrator added.', 'success');
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      await loadAdmins();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not add administrator.',
        'error',
      );
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRoleChange = async (adm: Administrator, nextRole: AdminRole) => {
    if (!isSuperAdmin) return;
    try {
      await updateAdministratorRole(adm.id, adm.displayName, nextRole);
      showToast(`Updated ${adm.displayName} role to ${nextRole}.`, 'success');
      await loadAdmins();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not update role.',
        'error',
      );
    }
  };

  const confirmRemoveAdmin = async () => {
    if (!removeAdminTarget) return;
    try {
      await removeAdministrator(removeAdminTarget.id);
      showToast('Administrator removed.', 'success');
      setRemoveAdminTarget(null);
      await loadAdmins();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not remove administrator.',
        'error',
      );
    }
  };

  return (
    <AdminLayout
      title="Settings & Content"
      breadcrumb="MAWA Admin / Global Configuration"
    >
      <SeoHead
        title="Settings — MAWA Admin"
        description="Configure MAWA brand identity, about copy, SEO metadata, and administrators."
        noIndex
      />

      <div className="space-y-10 max-w-4xl">
        {!isSuperAdmin && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-center gap-3 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Signed in with the <strong>Editor</strong> role. Global brand
              settings and administrator management are read-only and require{' '}
              <strong>Super Admin</strong> permissions to save.
            </span>
          </div>
        )}

        <form
          onSubmit={handleSaveSettings}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-6"
        >
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Brand Identity &amp; Theme
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Brand Name
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={form.brandName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, brandName: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Default Theme
              </label>
              <select
                disabled={!isSuperAdmin}
                value={form.defaultTheme}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    defaultTheme: e.target.value as ThemePreference,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              >
                <option value="dark">Dark (Midnight Navy)</option>
                <option value="light">Light (Clean White)</option>
                <option value="system">System Preference</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Main Tagline
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.tagline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagline: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Brand Logo URL or Upload (leave empty to use geometric MAWA mark)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.brandLogoUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, brandLogoUrl: e.target.value }))
                }
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
              {isSuperAdmin && (
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingLogo ? '...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Brand Description
            </label>
            <textarea
              rows={2}
              disabled={!isSuperAdmin}
              value={form.brandDescription}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  brandDescription: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
            />
          </div>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 pt-2">
            About Page Content
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Mission Statement
              </label>
              <textarea
                rows={3}
                disabled={!isSuperAdmin}
                value={form.aboutMission}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, aboutMission: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Vision Statement
              </label>
              <textarea
                rows={3}
                disabled={!isSuperAdmin}
                value={form.aboutVision}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, aboutVision: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              MAWA Brand Story
            </label>
            <textarea
              rows={4}
              disabled={!isSuperAdmin}
              value={form.aboutStory}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, aboutStory: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
            />
          </div>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 pt-2">
            Website SEO, Domain, Analytics &amp; Modules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Global SEO Title
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.seoTitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, seoTitle: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Public Contact Email
              </label>
              <input
                type="email"
                disabled={!isSuperAdmin}
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Global SEO Description
            </label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.seoDescription}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, seoDescription: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Canonical Production Domain URL (optional)
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                placeholder="https://yourdomain.com"
                value={form.canonicalDomain || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    canonicalDomain: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                GA4 Measurement ID (optional, loaded with consent)
              </label>
              <input
                type="text"
                maxLength={40}
                disabled={!isSuperAdmin}
                placeholder="G-XXXXXXXXXX"
                value={form.gaMeasurementId || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    gaMeasurementId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Default OpenGraph Social Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.ogImageUrl || ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ogImageUrl: e.target.value }))
                }
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
              {isSuperAdmin && (
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingOg ? '...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void handleOgUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={form.aiAssistantEnabled !== false}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    aiAssistantEnabled: e.target.checked,
                  }))
                }
                className="rounded border-slate-300"
              />
              Enable Public MAWA AI Assistant Drawer
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={form.newsletterEnabled !== false}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    newsletterEnabled: e.target.checked,
                  }))
                }
                className="rounded border-slate-300"
              />
              Enable Public Newsletter Subscription Forms
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Location / Operations Label
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.contactLocation}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contactLocation: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.socialGithub}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, socialGithub: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.socialLinkedin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    socialLinkedin: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                X (Twitter) URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.socialX}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, socialX: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.socialYoutube}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    socialYoutube: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] disabled:opacity-60"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>

        {/* Administrator Roster */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Authorized Administrators
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Only authorized UIDs listed here (plus the primary owner email)
              can sign in to the Admin Console.
            </p>
          </div>

          {isSuperAdmin ? (
            <form
              onSubmit={handleAddAdmin}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold mb-1">
                  Firebase Auth UID
                </label>
                <input
                  type="text"
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="uid..."
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@mawa..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Role</label>
                <select
                  aria-label="Administrator role"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                >
                  <option value="Editor">Editor</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Signed in with Editor role. Only Super Admins can add, modify, or
              remove administrators.
            </p>
          )}

          {admins.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {adm.displayName} ({adm.role})
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {adm.email} &middot; {adm.id}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        aria-label={`Role for ${adm.email}`}
                        value={adm.role}
                        onChange={(e) =>
                          void handleRoleChange(adm, e.target.value as AdminRole)
                        }
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                      >
                        <option value="Editor">Editor</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setRemoveAdminTarget(adm)}
                        className="p-1.5 text-slate-400 hover:text-red-500 shrink-0"
                        title="Remove administrator"
                        aria-label={`Remove ${adm.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removeAdminTarget)}
        title="Remove Administrator"
        description={`Revoke administrative access for ${removeAdminTarget?.email}?`}
        confirmLabel="Revoke Access"
        onCancel={() => setRemoveAdminTarget(null)}
        onConfirm={() => void confirmRemoveAdmin()}
      />
    </AdminLayout>
  );
}
