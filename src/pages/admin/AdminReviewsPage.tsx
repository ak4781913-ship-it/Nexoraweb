import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import {
  deleteProductReview,
  fetchAllReviewsAdmin,
  moderateProductReview,
  toTimestampMs,
} from '../../services/firestoreService';
import type { ProductReview, ReviewStatus } from '../../types/nexora';

const STATUS_FILTERS: Array<'All' | ReviewStatus> = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
];

export function AdminReviewsPage() {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | ReviewStatus>(
    'Pending',
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllReviewsAdmin();
      setReviews(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load reviews.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleModerate = async (
    rev: ProductReview,
    nextStatus: ReviewStatus,
  ) => {
    try {
      await moderateProductReview(rev.id, nextStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, status: nextStatus } : r)),
      );
      showToast(`Review marked as ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Moderation failed.',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductReview(deleteTarget.id);
      showToast('Review deleted.', 'success');
      setDeleteTarget(null);
      await loadReviews();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = reviews.filter((r) =>
    statusFilter === 'All' ? true : r.status === statusFilter,
  );

  return (
    <AdminLayout
      title="Reviews & Feedback"
      breadcrumb="MAWA Admin / Moderation Queue"
    >
      <SeoHead
        title="Review Moderation — MAWA Admin"
        description="Moderate visitor product reviews and improvement suggestions."
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

        <div className="space-y-4">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((rev) => {
              const ms = toTimestampMs(rev.createdAt);
              return (
                <div
                  key={rev.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Link
                          to={`/products/${rev.productSlug}`}
                          target="_blank"
                          className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                        >
                          {rev.productName}
                        </Link>
                        <span>&middot;</span>
                        <span>By {rev.authorName}</span>
                        <span>&middot;</span>
                        <span className="font-mono tabular-nums">
                          {ms ? new Date(ms).toLocaleDateString() : 'Recent'}
                        </span>
                        <span>&middot;</span>
                        <span
                          className={`font-semibold ${
                            rev.status === 'Approved'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : rev.status === 'Rejected'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className="h-3.5 w-3.5"
                              fill={n <= rev.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {rev.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rev.status !== 'Approved' && (
                        <button
                          type="button"
                          onClick={() => void handleModerate(rev, 'Approved')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {rev.status !== 'Rejected' && (
                        <button
                          type="button"
                          onClick={() => void handleModerate(rev, 'Rejected')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rev)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600"
                          title="Delete Review (Super Admin)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                  {rev.suggestion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Improvement Suggestion:</strong> {rev.suggestion}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No reviews in the {statusFilter.toLowerCase()} queue.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product Review"
        description={`Permanently delete review "${deleteTarget?.title}" by ${deleteTarget?.authorName}?`}
        confirmLabel="Delete Review"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
