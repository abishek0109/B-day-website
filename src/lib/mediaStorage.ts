// Persistent IndexedDB media storage for large video and photo files
// Allows storing files up to several gigabytes in the browser without hitting localStorage's 5MB quota limit.

const DB_NAME = 'bday_scrapbook_media_db';
const STORE_NAME = 'media_blobs';
const DB_VERSION = 1;

interface StoredMediaItem {
  id: string;
  blob: Blob;
  type: string;
  name: string;
  size: number;
  updatedAt: number;
}

// In-memory cache of resolved blob URLs so we don't recreate them repeatedly
const blobUrlCache = new Map<string, string>();

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Stores a file or blob in IndexedDB and returns an idb:// URI and an active blob URL.
 */
export async function storeLocalMedia(file: File | Blob, customId?: string): Promise<{ idbUri: string; blobUrl: string }> {
  const id = customId || `media_${Date.now()}_${crypto.randomUUID()}`;
  const idbUri = `idb://${id}`;

  try {
    const db = await openMediaDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item: StoredMediaItem = {
        id,
        blob: file,
        type: file.type || 'application/octet-stream',
        name: (file as File).name || 'uploaded_media',
        size: file.size,
        updatedAt: Date.now(),
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not persist to IndexedDB:', err);
  }

  const blobUrl = URL.createObjectURL(file);
  blobUrlCache.set(idbUri, blobUrl);
  blobUrlCache.set(id, blobUrl);
  return { idbUri, blobUrl };
}

/**
 * Resolves any media URL. If it's an idb:// URI, fetches the Blob from IndexedDB and returns a blob: URL.
 * If already a normal URL (http, https, data:, blob:), returns it immediately.
 */
export async function resolveMediaUrl(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('idb://')) return url;

  // Check in-memory cache first
  const cached = blobUrlCache.get(url);
  if (cached) return cached;

  const id = url.replace('idb://', '');
  try {
    const db = await openMediaDB();
    const blob = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as StoredMediaItem | undefined;
        resolve(result?.blob || null);
      };
      req.onerror = () => resolve(null);
    });

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, blobUrl);
      blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn('Error resolving IndexedDB media:', err);
  }

  return url;
}

/**
 * Hook or synchronous resolver: returns cached blob URL or original URL immediately.
 */
export function getSyncMediaUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('idb://')) {
    return blobUrlCache.get(url) || url;
  }
  return url;
}
