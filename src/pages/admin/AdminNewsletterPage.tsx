import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import {
  deleteSubscriberAdmin,
  fetchSubscribersAdmin,
  toTimestampMs,
  updateSubscriberStatusAdmin,
} from '../../services/firestoreService';
import type { NewsletterStatus, NewsletterSubscriber } from '../../types/nexora';

const STATUS_FILTERS: Array<'All' | NewsletterStatus> = [
  'All',
  'Subscribed',
  'Unsubscribed',
];

function csvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export function AdminNewsletterPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | NewsletterStatus>(
    'All',
  );
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscriber | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchSubscribersAdmin();
      setSubscribers(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load subscribers.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers]);

  const handleToggleStatus = async (sub: NewsletterSubscriber) => {
    const next: NewsletterStatus =
      sub.status === 'Subscribed' ? 'Unsubscribed' : 'Subscribed';
    try {
      await updateSubscriberStatusAdmin(sub.id, next);
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: next } : s)),
      );
      showToast(`Subscriber marked as ${next}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Status update failed.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubscriberAdmin(deleteTarget.id);
      showToast('Subscriber record deleted.', 'success');
      setDeleteTarget(null);
      await loadSubscribers();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        return (
          s.email.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subscribers, statusFilter, searchText]);

  const handleExportCsv = () => {
    const activeOnly = filtered.filter((s) => s.status === 'Subscribed');
    const rows = [
      ['Email', 'Status', 'Source', 'Consent', 'Subscribed At'].map(csvCell),
      ...activeOnly.map((s) =>
        [
          s.email,
          s.status,
          s.source,
          String(s.consent),
          toTimestampMs(s.createdAt)
            ? new Date(toTimestampMs(s.createdAt)).toISOString()
            : '',
        ].map(csvCell),
      ),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mawa-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${activeOnly.length} active subscribers.`, 'success');
  };

  return (
    <AdminLayout
      title="Newsletter Subscribers"
      breadcrumb="MAWA Admin / Audience & Consent"
      actions={
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          Export Active CSV
        </button>
      }
    >
      <SeoHead
        title="Newsletter — MAWA Admin"
        description="Manage MAWA newsletter subscribers and consent status."
        noIndex
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800 w-fit max-w-full">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search email or source..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Subscribed Date</th>
                <th className="py-3 px-4">Status</th>
                {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={isSuperAdmin ? 5 : 4} className="py-4 px-4">
                      <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((sub) => {
                  const ms = toTimestampMs(sub.createdAt);
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {sub.email}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {sub.source || 'website'}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                        {ms ? new Date(ms).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(sub)}
                          className={`text-xs font-semibold hover:underline ${
                            sub.status === 'Subscribed'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {sub.status}
                        </button>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(sub)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600"
                            title="Delete subscriber (Super Admin)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 5 : 4}
                    className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No newsletter subscribers recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Subscriber Record"
        description={`Permanently remove "${deleteTarget?.email}" from the newsletter list?`}
        confirmLabel="Delete Record"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
