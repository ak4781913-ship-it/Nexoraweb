import { useCallback, useEffect, useState } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import {
  deleteContactMessage,
  fetchContactMessagesAdmin,
  updateContactMessageStatus,
} from '../../services/firestoreService';
import type { ContactMessage, ContactStatus } from '../../types/nexora';

const STATUS_FILTERS: Array<'All' | ContactStatus> = [
  'All',
  'New',
  'Read',
  'Replied',
  'Archived',
];

export function AdminMessagesPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | ContactStatus>('All');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchContactMessagesAdmin();
      setMessages(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load messages.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleSelectMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === 'New') {
      try {
        await updateContactMessageStatus(msg.id, 'Read');
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'Read' } : m)),
        );
        setSelected({ ...msg, status: 'Read' });
      } catch {
        // non-blocking
      }
    }
  };

  const handleStatusChange = async (msg: ContactMessage, next: ContactStatus) => {
    try {
      await updateContactMessageStatus(msg.id, next);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: next } : m)),
      );
      if (selected?.id === msg.id) {
        setSelected({ ...msg, status: next });
      }
      showToast(`Message marked as ${next}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update status.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContactMessage(deleteTarget.id);
      showToast('Message deleted.', 'success');
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      await loadMessages();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = messages.filter((m) =>
    statusFilter === 'All' ? true : m.status === statusFilter,
  );

  return (
    <AdminLayout
      title="Contact Messages"
      breadcrumb="MAWA Admin / Private Inbox"
    >
      <SeoHead
        title="Contact Messages — MAWA Admin"
        description="Review private visitor contact submissions."
        noIndex
      />

      <div className="space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Message List */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => void handleSelectMessage(msg)}
                  className={`w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    selected?.id === msg.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {msg.name}
                    </span>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        msg.status === 'New'
                          ? 'text-blue-600 dark:text-cyan-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {msg.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {msg.email}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No messages in this view.
              </div>
            )}
          </div>

          {/* Detail Pane */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6">
            {selected ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      {selected.subject}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      From <strong>{selected.name}</strong> ({selected.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Message status"
                      value={selected.status}
                      onChange={(e) =>
                        void handleStatusChange(
                          selected,
                          e.target.value as ContactStatus,
                        )
                      }
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                    >
                      <option value="New">New</option>
                      <option value="Read">Read</option>
                      <option value="Replied">Replied</option>
                      <option value="Archived">Archived</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selected)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600"
                      title="Delete Message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selected.message}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                    onClick={() => void handleStatusChange(selected, 'Replied')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Reply via Email
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                Select a contact inquiry on the left to inspect its contents.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Contact Message"
        description={`Delete inquiry "${deleteTarget?.subject}" from ${deleteTarget?.name}?`}
        confirmLabel="Delete Message"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
