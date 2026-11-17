import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Mail,
  MessageSquareQuote,
  Plus,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminNotification,
  deleteNotification,
  fetchAdminNotifications,
  fetchAllReviewsAdmin,
  fetchContactMessagesAdmin,
  markNotificationRead,
  toTimestampMs,
} from '../../services/firestoreService';
import type {
  AdminNotification,
  ContactMessage,
  NotificationType,
  ProductReview,
} from '../../types/nexora';

export function AdminNotificationsPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [newMessages, setNewMessages] = useState<ContactMessage[]>([]);
  const [pendingReviews, setPendingReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminNotification | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [type, setType] = useState<NotificationType>('system');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [linkPath, setLinkPath] = useState('/admin/dashboard');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [notifs, msgs, revs] = await Promise.all([
        fetchAdminNotifications(),
        fetchContactMessagesAdmin(),
        fetchAllReviewsAdmin(),
      ]);
      setNotifications(notifs);
      setNewMessages(msgs.filter((m) => m.status === 'New'));
      setPendingReviews(revs.filter((r) => r.status === 'Pending'));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load notifications.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleToggleRead = async (item: AdminNotification) => {
    try {
      await markNotificationRead(item.id, !item.isRead);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: !n.isRead } : n)),
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not update status.',
        'error',
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      showToast('Notification title must be at least 2 characters.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminNotification({
        type,
        title,
        message,
        linkPath,
      });
      setTitle('');
      setMessage('');
      setComposeOpen(false);
      showToast('System notification created.', 'success');
      await loadAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to create notification.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteTarget.id);
      showToast('Notification deleted.', 'success');
      setDeleteTarget(null);
      await loadAll();
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
      title="Notifications & Triage"
      breadcrumb="MAWA Admin / Attention Queue"
      actions={
        <button
          type="button"
          onClick={() => setComposeOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New Internal Note
        </button>
      }
    >
      <SeoHead
        title="Notifications — MAWA Admin"
        description="Review unread contact messages, pending product reviews, and admin notices."
        noIndex
      />

      <div className="space-y-8">
        {/* Live Attention Queues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/messages"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/60 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unread Contact Inquiries
                </p>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {loading ? '—' : newMessages.length}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
              Open Inbox →
            </span>
          </Link>

          <Link
            to="/admin/reviews"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-5 hover:border-blue-500/60 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pending Product Reviews
                </p>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {loading ? '—' : pendingReviews.length}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
              Moderate Queue →
            </span>
          </Link>
        </div>

        {composeOpen && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Add Team Notification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                >
                  <option value="system">system</option>
                  <option value="security">security</option>
                  <option value="contact">contact</option>
                  <option value="review">review</option>
                  <option value="newsletter">newsletter</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  Message
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Action Route
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={linkPath}
                  onChange={(e) => setLinkPath(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {submitting ? 'Saving...' : 'Post Notice'}
              </button>
            </div>
          </form>
        )}

        {/* Stored Admin Notifications */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Admin Notices ({notifications.length})
            </h2>
          </div>

          {loading ? (
            <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No internal notifications posted yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {notifications.map((item) => {
                const ms = toTimestampMs(item.createdAt);
                return (
                  <div
                    key={item.id}
                    className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.isRead ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.type}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                      </div>
                      {item.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {item.message}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-slate-400">
                        {ms ? new Date(ms).toLocaleString() : 'Just now'}
                        {item.linkPath ? ` · ${item.linkPath}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.linkPath && (
                        <Link
                          to={item.linkPath}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleToggleRead(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {item.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                          title="Delete notice (Super Admin)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Notification"
        description={`Delete notification "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
