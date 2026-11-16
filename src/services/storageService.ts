import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

export type MediaFolder = 'products' | 'categories' | 'updates' | 'brand';

export interface MediaAssetItem {
  name: string;
  fullPath: string;
  folder: MediaFolder;
  url: string;
}

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadMediaFile(
  file: File,
  folder: MediaFolder,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      'Unsupported file type. Please upload PNG, JPG, or WebP images.',
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error('Image must be non-empty and under the 5 MB upload limit.');
  }

  const sanitizedName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .slice(0, 80);
  const path = `nexora-media/${folder}/${Date.now()}-${sanitizedName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          onProgress(pct);
        }
      },
      (err) => {
        reject(
          new Error(
            err.message ||
              'Storage upload failed. Ensure Firebase Storage is enabled and storage.rules are deployed.',
          ),
        );
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

export async function listMediaAssets(
  folder?: MediaFolder,
): Promise<MediaAssetItem[]> {
  const folders: MediaFolder[] = folder
    ? [folder]
    : ['products', 'categories', 'updates', 'brand'];

  const results: MediaAssetItem[] = [];
  for (const f of folders) {
    try {
      const folderRef = ref(storage, `nexora-media/${f}`);
      const list = await listAll(folderRef);
      const urls = await Promise.all(
        list.items.map(async (item) => ({
          name: item.name,
          fullPath: item.fullPath,
          folder: f,
          url: await getDownloadURL(item),
        })),
      );
      results.push(...urls);
    } catch {
      // Folder may not exist yet or storage bucket may not be initialized
    }
  }
  return results;
}

export async function deleteMediaAsset(fullPath: string): Promise<void> {
  if (!fullPath.startsWith('nexora-media/')) {
    throw new Error('Invalid media asset path.');
  }
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}
