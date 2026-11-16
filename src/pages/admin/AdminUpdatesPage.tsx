import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, Upload, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useSiteData } from '../../context/SiteDataContext';
import {
  deleteUpdatePost,
  fetchAllUpdatesAdmin,
  saveUpdatePost,
  slugify,
} from '../../services/firestoreService';
import { uploadMediaFile } from '../../services/storageService';
import { isSafeAssetUrl } from '../../utils/url';
import type {
  UpdateInput,
  UpdatePost,
  UpdateStatus,
  UpdateType,
} from '../../types/nexora';

const EMPTY_UPDATE: UpdateInput = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  type: 'Announcement',
  relatedProductSlug: '',
  coverImageUrl: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  publicationStatus: 'Draft',
};

export function AdminUpdatesPage() {
  const { showToast } = useToast();
  const { refreshPublicData } = useSiteData();

  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateInput>(EMPTY_UPDATE);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UpdatePost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllUpdatesAdmin();
      setUpdates(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load updates.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  useEffect(() => {
    if (!editorOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setEditorOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editorOpen, saving]);

  const openCreate = () => {
    setEditingId(null);
    setSlugLocked(false);
    setForm({
      ...EMPTY_UPDATE,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    setEditorOpen(true);
  };

  const openEdit = (post: UpdatePost) => {
    setEditingId(post.id);
    setSlugLocked(true);
    setForm({
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      content: post.content,
      type: post.type,
      relatedProductSlug: post.relatedProductSlug,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt,
      publicationStatus: post.publicationStatus,
    });
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 2 || form.summary.trim().length < 2) {
      showToast('Title and summary are required.', 'error');
      return;
    }
    if (form.coverImageUrl.trim() && !isSafeAssetUrl(form.coverImageUrl)) {
      showToast('Cover image URL must be a valid https://, http://, or local asset path.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveUpdatePost(editingId, form);
      showToast(
        editingId ? 'Update saved.' : 'Announcement created.',
        'success',
      );
      setEditorOpen(false);
      await Promise.all([loadUpdates(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save update.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post: UpdatePost) => {
    const nextStatus: UpdateStatus =
      post.publicationStatus === 'Published' ? 'Draft' : 'Published';
    try {
      await saveUpdatePost(post.id, {
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        type: post.type,
        relatedProductSlug: post.relatedProductSlug,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt,
        publicationStatus: nextStatus,
      });
      showToast(`Update set to ${nextStatus}.`, 'success');
      await Promise.all([loadUpdates(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Status toggle failed.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUpdatePost(deleteTarget.id);
      showToast('Update deleted.', 'success');
      setDeleteTarget(null);
      await Promise.all([loadUpdates(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadCover = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, 'updates');
      setForm((prev) => ({ ...prev, coverImageUrl: url }));
      showToast('Cover image uploaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Upload failed.',
        'error',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Updates & Announcements"
      breadcrumb="NEXORA Admin / What's New"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New Update
        </button>
      }
    >
      <SeoHead
        title="Manage Updates — NEXORA Admin"
        description="Manage NEXORA announcements and launch posts."
        noIndex
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {loading ? (
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={5} className="py-4 px-4">
                    <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : updates.length > 0 ? (
              updates.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {post.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {post.summary}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {post.type}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                    {post.publishedAt}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(post)}
                      className={`text-xs font-semibold hover:underline ${
                        post.publicationStatus === 'Published'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {post.publicationStatus}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(post)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 px-4 text-center text-sm text-slate-500"
                >
                  No updates created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Update' : 'Create Update / Announcement'}
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
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                        slug: slugLocked ? prev.slug : slugify(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setForm((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Summary *
                </label>
                <input
                  type="text"
                  required
                  maxLength={400}
                  value={form.summary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Article Content
                </label>
                <textarea
                  rows={5}
                  maxLength={15000}
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as UpdateType,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Platform Update">Platform Update</option>
                    <option value="Roadmap">Roadmap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publishedAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={form.publicationStatus}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publicationStatus: e.target.value as UpdateStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Related Product Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={form.relatedProductSlug}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        relatedProductSlug: e.target.value,
                      }))
                    }
                    placeholder="e.g., nexora-prompt-studio"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cover Image URL or Upload
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.coverImageUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          coverImageUrl: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) void handleUploadCover(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
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
                  {saving ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Announcement"
        description={`Permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete Update"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
