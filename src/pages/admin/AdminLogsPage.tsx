import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import {
  fetchActivityLogsAdmin,
  toTimestampMs,
} from '../../services/firestoreService';
import type { ActivityLog } from '../../types/nexora';

export function AdminLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('All');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchActivityLogsAdmin(200);
      setLogs(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load activity logs.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const collections = useMemo(() => {
    const set = new Set(logs.map((l) => l.targetCollection).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((entry) => {
      if (
        collectionFilter !== 'All' &&
        entry.targetCollection !== collectionFilter
      ) {
        return false;
      }
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        return (
          entry.summary.toLowerCase().includes(q) ||
          entry.actionType.toLowerCase().includes(q) ||
          entry.adminEmail.toLowerCase().includes(q) ||
          entry.targetId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, collectionFilter, searchText]);

  return (
    <AdminLayout
      title="Activity & Audit Logs"
      breadcrumb="MAWA Admin / Immutable Audit Trail"
      actions={
        <button
          type="button"
          onClick={() => void loadLogs()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326] hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <SeoHead
        title="Activity Logs — MAWA Admin"
        description="Append-only administrative audit logs."
        noIndex
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Collection:
            </label>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1326]"
            >
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search summary, admin, action..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {loading ? (
                [0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-4 px-4">
                      <div className="h-5 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((entry) => {
                  const ms = toTimestampMs(entry.createdAt);
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ms ? new Date(ms).toLocaleString() : 'Pending'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-cyan-400 whitespace-nowrap">
                        {entry.actionType}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {entry.targetCollection}
                        {entry.targetId ? `/${entry.targetId}` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-md">
                        {entry.summary}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {entry.adminEmail} ({entry.adminRole})
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No activity logs match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
