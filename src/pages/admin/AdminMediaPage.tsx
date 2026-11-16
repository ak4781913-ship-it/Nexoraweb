import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Trash2, Upload } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SafeImage } from '../../components/common/SafeImage';
import { SeoHead } from '../../components/common/SeoHead';
import { useToast } from '../../components/common/ToastProvider';
import { GENERATED_ASSETS } from '../../data/defaults';
import {
  deleteMediaAsset,
  listMediaAssets,
  uploadMediaFile,
  type MediaAssetItem,
  type MediaFolder,
} from '../../services/storageService';

const FOLDERS: MediaFolder[] = ['products', 'categories', 'updates', 'brand'];

export function AdminMediaPage() {
  const { showToast } = useToast();

  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<MediaFolder>('products');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMediaAssets();
      setAssets(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadPct(0);
    try {
      await uploadMediaFile(file, selectedFolder, setUploadPct);
      showToast('Asset uploaded to Firebase Storage.', 'success');
      await loadAssets();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Upload failed.',
        'error',
      );
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      showToast('Asset URL copied to clipboard.', 'success');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      showToast('Could not copy URL.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMediaAsset(deleteTarget.fullPath);
      showToast('Asset deleted from Storage.', 'success');
      setDeleteTarget(null);
      await loadAssets();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete asset.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const builtInVisuals = [
    { name: 'Hero Architecture Visual', url: GENERATED_ASSETS.heroArchitecture },
    { name: 'MAWA Studio Environment', url: GENERATED_ASSETS.aboutStudio },
    { name: 'AI Systems Isometric', url: GENERATED_ASSETS.ecosystemAi },
    { name: 'Digital Hub Composition', url: GENERATED_ASSETS.ecosystemHub },
  ];

  return (
    <AdminLayout
      title="Media Library"
      breadcrumb="MAWA Admin / Firebase Storage"
    >
      <SeoHead
        title="Media Library — MAWA Admin"
        description="Upload and manage product images and brand assets."
        noIndex
      />

      <div className="space-y-8">
        {/* Upload Box */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Upload Media Asset
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports PNG, JPG, or WebP up to 5 MB stored in Firebase Storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Target folder"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value as MediaFolder)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19]"
            >
              {FOLDERS.map((f) => (
                <option key={f} value={f}>
                  Folder: {f}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors whitespace-nowrap">
              <Upload className="h-4 w-4" />
              {uploading ? `Uploading ${uploadPct}%` : 'Upload Image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleUpload(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Uploaded Firebase Storage Assets */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Uploaded Storage Assets ({assets.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : assets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {assets.map((item) => (
                <div
                  key={item.fullPath}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900">
                    <SafeImage
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {item.folder}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => void copyUrl(item.url)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedUrl === item.url ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy URL
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No uploaded files in Firebase Storage yet. Upload an image above
              or use the built-in MAWA brand visuals below.
            </div>
          )}
        </div>

        {/* Built-in Brand Visuals */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Built-In Brand Visuals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {builtInVisuals.map((v) => (
              <div
                key={v.url}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1326] overflow-hidden"
              >
                <div className="aspect-[16/10] bg-slate-900">
                  <SafeImage
                    src={v.url}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {v.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyUrl(v.url)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Media Asset"
        description={`Permanently delete "${deleteTarget?.name}" from Firebase Storage? Any product referencing this URL will fall back to its default visual.`}
        confirmLabel="Delete File"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
