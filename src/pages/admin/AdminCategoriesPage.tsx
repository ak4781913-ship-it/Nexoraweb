import { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  AVAILABLE_CATEGORY_ICONS,
  CategoryIcon,
} from '../../components/common/CategoryIcon';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import {
  deleteCategory,
  fetchAllCategoriesAdmin,
  moveEntityToRecycleBin,
  saveCategory,
  slugify,
} from '../../services/firestoreService';
import { uploadMediaFile } from '../../services/storageService';
import { isSafeAssetUrl } from '../../utils/url';
import type { Category, CategoryInput, CategoryStatus } from '../../types/nexora';

const EMPTY_CATEGORY: CategoryInput = {
  name: '',
  slug: '',
  icon: 'Box',
  imageUrl: '',
  description: '',
  displayOrder: 1,
  publicationStatus: 'Published',
};

export function AdminCategoriesPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { refreshPublicData } = useSiteData();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput>(EMPTY_CATEGORY);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllCategoriesAdmin();
      setCategories(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load categories.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

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
      ...EMPTY_CATEGORY,
      displayOrder: categories.length + 1,
    });
    setEditorOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setSlugLocked(true);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      imageUrl: cat.imageUrl,
      description: cat.description,
      displayOrder: cat.displayOrder,
      publicationStatus: cat.publicationStatus,
    });
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      showToast('Category name must be at least 2 characters.', 'error');
      return;
    }
    if (form.imageUrl.trim() && !isSafeAssetUrl(form.imageUrl)) {
      showToast('Category image URL must be a valid https://, http://, or local asset path.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveCategory(editingId, form);
      showToast(
        editingId ? `Updated "${form.name}".` : `Created "${form.name}".`,
        'success',
      );
      setEditorOpen(false);
      await Promise.all([loadCategories(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save category.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (cat: Category) => {
    const nextStatus: CategoryStatus =
      cat.publicationStatus === 'Published' ? 'Hidden' : 'Published';
    try {
      await saveCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        imageUrl: cat.imageUrl,
        description: cat.description,
        displayOrder: cat.displayOrder,
        publicationStatus: nextStatus,
      });
      showToast(`"${cat.name}" set to ${nextStatus}.`, 'success');
      await Promise.all([loadCategories(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Status update failed.',
        'error',
      );
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const neighbor = categories[targetIndex];
    try {
      await Promise.all([
        saveCategory(current.id, {
          name: current.name,
          slug: current.slug,
          icon: current.icon,
          imageUrl: current.imageUrl,
          description: current.description,
          displayOrder: neighbor.displayOrder,
          publicationStatus: current.publicationStatus,
        }),
        saveCategory(neighbor.id, {
          name: neighbor.name,
          slug: neighbor.slug,
          icon: neighbor.icon,
          imageUrl: neighbor.imageUrl,
          description: neighbor.description,
          displayOrder: current.displayOrder,
          publicationStatus: neighbor.publicationStatus,
        }),
      ]);
      await Promise.all([loadCategories(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Reorder failed.',
        'error',
      );
    }
  };

  const handleArchiveCategory = async (cat: Category) => {
    try {
      const { createdAt: _c, updatedAt: _u, ...snapshot } = cat;
      await moveEntityToRecycleBin({
        entityType: 'category',
        originalId: cat.id,
        title: cat.name,
        snapshot,
      });
      showToast(`"${cat.name}" hidden and archived to Recycle Bin.`, 'success');
      await Promise.all([loadCategories(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to archive category.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast(`Deleted "${deleteTarget.name}".`, 'success');
      setDeleteTarget(null);
      await Promise.all([loadCategories(), refreshPublicData()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, 'categories');
      setForm((prev) => ({ ...prev, imageUrl: url }));
      showToast('Category image uploaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Image upload failed.',
        'error',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Categories"
      breadcrumb="MAWA Admin / Category Taxonomy"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      }
    >
      <SeoHead
        title="Manage Categories — MAWA Admin"
        description="Manage MAWA product categories."
        noIndex
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
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
            ) : categories.length > 0 ? (
              categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    <div className="flex items-center gap-1">
                      <span className="w-6">{cat.displayOrder}</span>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => void handleReorder(idx, -1)}
                        aria-label="Move up"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1}
                        onClick={() => void handleReorder(idx, 1)}
                        aria-label="Move down"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <CategoryIcon name={cat.icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {cat.name}
                        </p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          /{cat.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {cat.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => void handleToggleVisibility(cat)}
                      className={`text-xs font-semibold hover:underline ${
                        cat.publicationStatus === 'Published'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cat.publicationStatus}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Category"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleArchiveCategory(cat)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Move to Recycle Bin"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Permanently Delete Category"
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
                  colSpan={5}
                  className="py-10 px-4 text-center text-sm text-slate-500"
                >
                  No categories found. Initialize catalog defaults from the
                  Dashboard or click Add Category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? `Edit Category: ${form.name}` : 'Add Category'}
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
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
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
                    maxLength={80}
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
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Icon
                  </label>
                  <select
                    value={form.icon}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        displayOrder: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
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
                        publicationStatus: e.target.value as CategoryStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    <option value="Published">Published</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Category Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="https://... or upload"
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
                        if (file) void handleImageUpload(file);
                      }}
                    />
                  </label>
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Existing products referencing this category should be reassigned first.`}
        confirmLabel="Delete Category"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
