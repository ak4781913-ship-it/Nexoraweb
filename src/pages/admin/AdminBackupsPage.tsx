import { useCallback, useEffect, useState } from 'react';
import {
  DatabaseBackup,
  Download,
  History,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useSiteData } from '../../context/SiteDataContext';
import {
  buildLiveBackupPayload,
  createCatalogBackup,
  deleteBackup,
  fetchBackupsAdmin,
  restoreCatalogBackup,
  toTimestampMs,
} from '../../services/firestoreService';
import type { BackupPayload, BackupSnapshot } from '../../types/nexora';

export function AdminBackupsPage() {
  const { showToast } = useToast();
  const { refreshPublicData } = useSiteData();

  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [restoreSource, setRestoreSource] = useState<{
    title: string;
    payload: BackupPayload;
    backupDocId?: string;
  } | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BackupSnapshot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBackupsAdmin();
      setBackups(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load backups.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const payload = await buildLiveBackupPayload();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mawa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Full catalog backup JSON downloaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to export backup JSON.',
        'error',
      );
    } finally {
      setExporting(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const snapshotLabel =
        label.trim() || `Manual Snapshot ${new Date().toLocaleDateString()}`;
      await createCatalogBackup(snapshotLabel);
      setLabel('');
      showToast('Snapshot saved in Firestore backups.', 'success');
      await loadBackups();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to create snapshot.',
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupPayload;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.products) ||
        !Array.isArray(parsed.categories)
      ) {
        throw new Error('Invalid MAWA backup JSON structure.');
      }
      setConfirmText('');
      setOverwriteExisting(false);
      setRestoreSource({
        title: file.name,
        payload: parsed,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not parse backup file.',
        'error',
      );
    }
  };

  const openSnapshotRestore = (snap: BackupSnapshot) => {
    try {
      const parsed = JSON.parse(snap.payloadJson) as BackupPayload;
      setConfirmText('');
      setOverwriteExisting(false);
      setRestoreSource({
        title: snap.label,
        payload: parsed,
        backupDocId: snap.id,
      });
    } catch {
      showToast('Snapshot JSON payload could not be parsed.', 'error');
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreSource || confirmText.trim() !== 'RESTORE') return;
    setRestoring(true);
    try {
      const result = await restoreCatalogBackup(
        restoreSource.payload,
        restoreSource.backupDocId,
        overwriteExisting,
      );
      await refreshPublicData();
      showToast(
        `Restore complete: ${result.restoredCount} restored, ${result.skippedCount} existing skipped.`,
        'success',
      );
      setRestoreSource(null);
      await loadBackups();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Backup restore failed.',
        'error',
      );
    } finally {
      setRestoring(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBackup(deleteTarget.id);
      showToast('Backup snapshot deleted.', 'success');
      setDeleteTarget(null);
      await loadBackups();
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
      title="Backups & Restore"
      breadcrumb="MAWA Super Admin / Snapshot Recovery"
      actions={
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap">
            <Upload className="h-3.5 w-3.5" />
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleJsonUpload(e)}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportJson()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      }
    >
      <SeoHead
        title="Backups & Restore — MAWA Admin"
        description="Super Admin catalog snapshot creation, JSON export, and non-destructive restore."
        noIndex
      />

      <div className="space-y-8">
        <form
          onSubmit={handleCreateSnapshot}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <DatabaseBackup className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Create Firestore Catalog Snapshot
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Captures global settings, categories, products, updates, roadmap
            items, and downloads into the Super-Admin-only{' '}
            <span className="font-mono">backups</span> collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              maxLength={140}
              placeholder="e.g. Pre-release snapshot Q1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
            >
              {creating ? 'Creating Snapshot...' : 'Save Snapshot'}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Stored Snapshots ({backups.length})
            </h2>
          </div>

          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Snapshot Label</th>
                <th className="py-3 px-4">Contents Summary</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                [0, 1].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-4 px-4">
                      <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : backups.length > 0 ? (
                backups.map((snap) => {
                  const ms = toTimestampMs(snap.createdAt);
                  return (
                    <tr
                      key={snap.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {snap.label}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {ms ? new Date(ms).toLocaleString() : 'Just now'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {snap.summary}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {snap.createdByEmail}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-600 dark:text-cyan-400">
                        {snap.status}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openSnapshotRestore(snap)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(snap)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                            title="Delete snapshot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                    No snapshots saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicit RESTORE Confirmation Modal */}
      {restoreSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Restore Catalog Backup
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Source: <strong>{restoreSource.title}</strong> ·{' '}
              {restoreSource.payload.products.length} products,{' '}
              {restoreSource.payload.categories.length} categories,{' '}
              {restoreSource.payload.updates?.length ?? 0} updates,{' '}
              {restoreSource.payload.roadmapItems?.length ?? 0} roadmap items,{' '}
              {restoreSource.payload.downloadItems?.length ?? 0} downloads.
            </p>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                <strong>Overwrite existing records & global settings.</strong>{' '}
                Leave unchecked (recommended) to perform a non-destructive
                restore of missing records only.
              </span>
            </label>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Type <span className="font-mono">RESTORE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setRestoreSource(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoring || confirmText.trim() !== 'RESTORE'}
                onClick={() => void handleExecuteRestore()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {restoring ? 'Restoring...' : 'Execute Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Snapshot"
        description={`Delete stored backup snapshot "${deleteTarget?.label}"?`}
        confirmLabel="Delete Snapshot"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
