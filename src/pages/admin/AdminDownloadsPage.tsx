import { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import {
  deleteDownloadItem,
  fetchAllDownloadsAdmin,
  fetchAllProductsAdmin,
  saveDownloadItem,
  slugify,
} from '../../services/firestoreService';
import type {
  DownloadCategory,
  DownloadItem,
  DownloadItemInput,
  Product,
} from '../../types/nexora';

const CATEGORY_OPTIONS: DownloadCategory[] = [
  'Windows Application',
  'Android APK',
  'Web Application',
  'Document & Resource',
];

const EMPTY_DOWNLOAD: DownloadItemInput = {
  title: '',
  productId: '',
  productSlug: '',
  category: 'Windows Application',
  version: '1.0.0',
  fileSize: '',
  releaseDate: new Date().toISOString().slice(0, 10),
  downloadUrl: '',
  checksumSha256: '',
  releaseNotes: '',
  publicationStatus: 'Draft',
};

export function AdminDownloadsPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [items, setItems] = useState<DownloadItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DownloadItemInput>(EMPTY_DOWNLOAD);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DownloadItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dlList, prodList] = await Promise.all([
        fetchAllDownloadsAdmin(),
        fetchAllProductsAdmin(),
      ]);
      setItems(dlList);
      setProducts(prodList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load downloads.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_DOWNLOAD,
      releaseDate: new Date().toISOString().slice(0, 10),
    });
    setEditorOpen(true);
  };

  const openEdit = (item: DownloadItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      productId: item.productId,
      productSlug: item.productSlug,
      category: item.category,
      version: item.version,
      fileSize: item.fileSize,
      releaseDate: item.releaseDate,
      downloadUrl: item.downloadUrl,
      checksumSha256: item.checksumSha256,
      releaseNotes: item.releaseNotes,
      publicationStatus: item.publicationStatus,
    });
    setEditorOpen(true);
  };

  const handleProductSelect = (productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      productSlug: selected ? selected.slug : '',
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      showToast('Download title must be at least 2 characters.', 'error');
      return;
    }
    const cleanUrl = form.downloadUrl.trim();
    if (!cleanUrl || !/^https?:\/\/.{4,}/i.test(cleanUrl)) {
      showToast('Please provide a valid https:// download URL.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveDownloadItem(editingId, {
        ...form,
        productSlug: slugify(form.productSlug || ''),
        downloadUrl: cleanUrl,
      });
      showToast(
        editingId ? 'Download item updated.' : 'Download item created.',
        'success',
      );
      setEditorOpen(false);
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save download item.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDownloadItem(deleteTarget.id);
      showToast('Download item deleted.', 'success');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Download Center"
      breadcrumb="MAWA Admin / Releases & Packages"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Release
        </button>
      }
    >
      <SeoHead
        title="Manage Downloads — MAWA Admin"
        description="Manage downloadable releases, installers, and documents."
        noIndex
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Release</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Version & Size</th>
                <th className="py-3 px-4">Release Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-4">
                      <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <Download className="h-4 w-4 text-blue-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                            {item.productSlug
                              ? `/products/${item.productSlug}`
                              : 'Standalone release'}
                            {item.checksumSha256 ? ' · SHA-256 verified' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      v{item.version}
                      {item.fileSize ? ` · ${item.fileSize}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {item.releaseDate || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          item.publicationStatus === 'Published'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.publicationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600"
                          title="Open download URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600"
                          title="Edit release"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600"
                            title="Delete release (Super Admin)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No downloads listed yet. Click “Add Release” to publish your
                    first verified package or resource link.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Download Release' : 'Add Download Release'}
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Release Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    placeholder="MAWA Studio Desktop Installer"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value as DownloadCategory,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Version *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="1.0.0"
                    value={form.version}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, version: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="42.5 MB"
                    value={form.fileSize}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fileSize: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        releaseDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Download URL (https://) *
                </label>
                <input
                  type="url"
                  required
                  maxLength={1000}
                  placeholder="https://releases.example.com/mawa-setup.exe"
                  value={form.downloadUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, downloadUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Linked Product (optional)
                  </label>
                  <select
                    value={form.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    <option value="">Standalone / Ecosystem Resource</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.publicationStatus})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Publication Status
                  </label>
                  <select
                    value={form.publicationStatus}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publicationStatus: e.target.value as 'Published' | 'Draft',
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    <option value="Draft">Draft (Admin only)</option>
                    <option value="Published">Published (Public Download Center)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  SHA-256 Checksum (optional)
                </label>
                <input
                  type="text"
                  maxLength={128}
                  placeholder="e3b0c44298fc1c149afbf4c8996fb924..."
                  value={form.checksumSha256}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      checksumSha256: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Release Notes
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.releaseNotes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      releaseNotes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Download Release"
        description={`Delete download release "${deleteTarget?.title}"?`}
        confirmLabel="Delete Release"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
