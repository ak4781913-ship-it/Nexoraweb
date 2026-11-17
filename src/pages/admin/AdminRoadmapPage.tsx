import { useCallback, useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_ROADMAP_ITEMS } from '../../data/defaults';
import {
  deleteRoadmapItem,
  fetchAllRoadmapAdmin,
  saveRoadmapItem,
  slugify,
} from '../../services/firestoreService';
import type {
  RoadmapItem,
  RoadmapItemInput,
  RoadmapStatus,
} from '../../types/nexora';

const STATUS_OPTIONS: RoadmapStatus[] = [
  'Planned',
  'Under Consideration',
  'In Progress',
  'Completed',
];

const EMPTY_ROADMAP: RoadmapItemInput = {
  title: '',
  description: '',
  status: 'Planned',
  category: 'Platform',
  productSlug: '',
  targetQuarter: 'Q2 2026',
  displayOrder: 1,
  isPublic: true,
};

export function AdminRoadmapPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoadmapItemInput>(EMPTY_ROADMAP);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoadmapItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllRoadmapAdmin();
      setItems(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load roadmap items.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadRoadmap();
  }, [loadRoadmap]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_ROADMAP, displayOrder: items.length + 1 });
    setEditorOpen(true);
  };

  const openEdit = (item: RoadmapItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      status: item.status,
      category: item.category,
      productSlug: item.productSlug,
      targetQuarter: item.targetQuarter,
      displayOrder: item.displayOrder,
      isPublic: item.isPublic,
    });
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      showToast('Title must be at least 2 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveRoadmapItem(editingId, {
        ...form,
        productSlug: slugify(form.productSlug || ''),
      });
      showToast(
        editingId ? 'Roadmap item updated.' : 'Roadmap item created.',
        'success',
      );
      setEditorOpen(false);
      await loadRoadmap();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save roadmap item.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async (item: RoadmapItem) => {
    try {
      await saveRoadmapItem(item.id, {
        title: item.title,
        description: item.description,
        status: item.status,
        category: item.category,
        productSlug: item.productSlug,
        targetQuarter: item.targetQuarter,
        displayOrder: item.displayOrder,
        isPublic: !item.isPublic,
      });
      showToast(
        !item.isPublic ? 'Item visible on /roadmap.' : 'Item hidden from public.',
        'success',
      );
      await loadRoadmap();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update visibility.',
        'error',
      );
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      for (const sample of DEFAULT_ROADMAP_ITEMS) {
        const { id: _id, ...rest } = sample;
        await saveRoadmapItem(null, rest);
      }
      showToast('Starter roadmap items added.', 'success');
      await loadRoadmap();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not seed roadmap.',
        'error',
      );
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRoadmapItem(deleteTarget.id);
      showToast('Roadmap item deleted.', 'success');
      setDeleteTarget(null);
      await loadRoadmap();
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
      title="Product Roadmap"
      breadcrumb="MAWA Admin / Public Milestones"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      }
    >
      <SeoHead
        title="Manage Roadmap — MAWA Admin"
        description="Configure public MAWA product roadmap milestones."
        noIndex
      />

      <div className="space-y-6">
        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No roadmap items stored in Firestore yet. Add items manually or
              import starter milestones from defaults.
            </p>
            <button
              type="button"
              disabled={seeding}
              onClick={() => void handleSeedDefaults()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white whitespace-nowrap"
            >
              {seeding ? 'Importing...' : 'Import Starter Milestones'}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Quarter</th>
                <th className="py-3 px-4">Public</th>
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
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs">
                      {item.displayOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                        {item.category}
                        {item.productSlug ? ` · /products/${item.productSlug}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-blue-600 dark:text-cyan-400">
                      {item.status}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {item.targetQuarter || 'TBD'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => void handleTogglePublic(item)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
                      >
                        {item.isPublic ? (
                          <>
                            <Eye className="h-3.5 w-3.5 text-emerald-500" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600"
                          title="Edit Milestone"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600"
                            title="Delete Milestone (Super Admin)"
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
                    className="py-10 px-4 text-center text-sm text-slate-500"
                  >
                    No roadmap items created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                {editingId ? 'Edit Roadmap Milestone' : 'Add Roadmap Milestone'}
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
              <div>
                <label className="block text-xs font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as RoadmapStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Target Quarter
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="Q3 2026"
                    value={form.targetQuarter}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        targetQuarter: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Linked Product Slug (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="mawa-studio"
                    value={form.productSlug}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        productSlug: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Order
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
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 pt-5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isPublic: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300"
                    />
                    Public
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
                  {saving ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Roadmap Item"
        description={`Delete roadmap item "${deleteTarget?.title}"?`}
        confirmLabel="Delete Item"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
