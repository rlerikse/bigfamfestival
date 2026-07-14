import { useState, useEffect } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);
const urlCache = new Map<string, string>();
const failedCache = new Set<string>();

/**
 * Resolves a gs:// URL or path to a downloadable HTTPS URL via Firebase SDK.
 * Uses getDownloadURL which includes an access token that bypasses storage rules.
 * Caches results to avoid repeated lookups.
 */
export function useStorageUrl(gsUrl: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!gsUrl) return null;
    if (gsUrl.startsWith('https://')) return gsUrl;
    return urlCache.get(gsUrl) ?? null;
  });

  useEffect(() => {
    if (!gsUrl) { setUrl(null); return; }
    if (gsUrl.startsWith('https://')) { setUrl(gsUrl); return; }
    if (urlCache.has(gsUrl)) { setUrl(urlCache.get(gsUrl)!); return; }
    if (failedCache.has(gsUrl)) { setUrl(null); return; }

    let cancelled = false;

    // Extract path from gs:// URL
    const match = gsUrl.match(/^gs:\/\/[^/]+\/(.+)$/);
    if (!match) { setUrl(null); return; }

    const storagePath = match[1];
    const storageRef = ref(storage, storagePath);

    getDownloadURL(storageRef)
      .then((downloadUrl) => {
        if (!cancelled) {
          urlCache.set(gsUrl, downloadUrl);
          setUrl(downloadUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          failedCache.add(gsUrl);
          setUrl(null);
        }
      });

    return () => { cancelled = true; };
  }, [gsUrl]);

  return url;
}

/**
 * Batch-resolve multiple gs:// URLs. Returns a Map of original → download URL.
 */
export function useStorageUrls(gsUrls: (string | undefined | null)[]): Map<string, string> {
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const toResolve = gsUrls.filter(
      (u): u is string => !!u && u.startsWith('gs://') && !urlCache.has(u)
    );

    // Start with cached values
    const initial = new Map<string, string>();
    gsUrls.forEach((u) => {
      if (u && urlCache.has(u)) initial.set(u, urlCache.get(u)!);
      if (u && u.startsWith('https://')) initial.set(u, u);
    });
    setUrlMap(initial);

    if (toResolve.length === 0) return;

    Promise.all(
      toResolve.map(async (gsUrl) => {
        const match = gsUrl.match(/^gs:\/\/[^/]+\/(.+)$/);
        if (!match) return;
        try {
          const storageRef = ref(storage, match[1]);
          const downloadUrl = await getDownloadURL(storageRef);
          urlCache.set(gsUrl, downloadUrl);
        } catch { /* skip */ }
      })
    ).then(() => {
      if (!cancelled) {
        const result = new Map<string, string>();
        gsUrls.forEach((u) => {
          if (u && urlCache.has(u)) result.set(u, urlCache.get(u)!);
          if (u && u.startsWith('https://')) result.set(u, u);
        });
        setUrlMap(result);
      }
    });

    return () => { cancelled = true; };
  }, [JSON.stringify(gsUrls)]);

  return urlMap;
}
