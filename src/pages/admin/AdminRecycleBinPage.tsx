import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { useSiteData } from '../../context/SiteDataContext';
import {
  fetchRecycleBinAdmin,
  purgeRecycleBinItem,
  restoreFromRecycleBin,
  toTimestampMs,
} from '../../services/firestoreService';
import type { RecycleBinItem } from '../../types/nexora';

export function AdminRecycleBinPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { refreshPublicData } = useSiteData();

  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<{
    item: RecycleBinItem;
    alsoDeleteOriginal: boolean;
  } | null>(null);
  const [purging, setPurging] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchRecycleBinAdmin();
      setItems(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load recycle bin.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleRestore = async (item: RecycleBinItem) => {
    setRestoringId(item.id);
    try {
      await restoreFromRecycleBin(item);
      if (isSuperAdmin) {
        await purgeRecycleBinItem(item, false);
      }
      await refreshPublicData();
      showToast(`Restored "${item.title}" from archive.`, 'success');
      await loadItems();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Restore failed.',
        'error',
      );
    } finally {
      setRestoringId(null);
    }
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;
    setPurging(true);
    try {
      await purgeRecycleBinItem(
        purgeTarget.item,
        purgeTarget.alsoDeleteOriginal,
      );
      await refreshPublicData();
      showToast(
        purgeTarget.alsoDeleteOriginal
          ? 'Record and archive entry permanently deleted.'
          : 'Recycle bin entry cleared.',
        'success',
      );
      setPurgeTarget(null);
      await loadItems();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Purge failed.',
        'error',
      );
    } finally {
      setPurging(false);
    }
  };

  return (
    <AdminLayout
      title="Recycle Bin"
      breadcrumb="MAWA Admin / Soft-Archived Records"
    >
      <SeoHead
        title="Recycle Bin — MAWA Admin"
        description="Restore soft-archived records or permanently purge items."
        noIndex
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-4 text-xs text-slate-600 dark:text-slate-300">
          Archived items are hidden from public pages while retaining a full
          recovery snapshot. Both Editors and Super Admins can restore records;
          permanent deletion from the database is restricted to{' '}
          <strong className="text-slate-900 dark:text-white">
            Super Admin
          </strong>
          .
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Archived By</th>
                <th className="py-3 px-4">Archived At</th>
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
              ) : items.length > 0 ? (
                items.map((item) => {
                  const ms = toTimestampMs(item.createdAt);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          ID: {item.originalId}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-blue-600 dark:text-cyan-400">
                        {item.entityType}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {item.deletedByEmail}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {ms ? new Date(ms).toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={restoringId === item.id}
                            onClick={() => void handleRestore(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800/70 text-blue-700 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-60"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {restoringId === item.id ? 'Restoring...' : 'Restore'}
                          </button>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setPurgeTarget({
                                  item,
                                  alsoDeleteOriginal: true,
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Purge Forever
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Recycle bin is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(purgeTarget)}
        title="Permanently Purge Record"
        description={`This permanently deletes "${purgeTarget?.item.title}" from both Firestore and the Recycle Bin. This cannot be undone.`}
        confirmLabel="Purge Forever"
        loading={purging}
        onCancel={() => setPurgeTarget(null)}
        onConfirm={() => void confirmPurge()}
      />
    </AdminLayout>
  );
}
