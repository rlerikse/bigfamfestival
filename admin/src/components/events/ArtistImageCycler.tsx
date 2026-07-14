import { useState, useEffect } from 'react';
import { useStorageUrl } from '@/hooks/useStorageUrl';

interface ArtistImageCyclerProps {
  imageUrls: (string | undefined | null)[];
  className?: string;
}

/**
 * Cycles through multiple artist images on a 3-second interval.
 * Shows a dot indicator when there are multiple images.
 */
export function ArtistImageCycler({ imageUrls, className = '' }: ArtistImageCyclerProps) {
  const validUrls = imageUrls.filter((u): u is string => !!u);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (validUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % validUrls.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [validUrls.length]);

  // Reset index if it goes out of bounds
  useEffect(() => {
    if (currentIndex >= validUrls.length) setCurrentIndex(0);
  }, [validUrls.length, currentIndex]);

  const currentUrl = validUrls[currentIndex] ?? null;

  if (!currentUrl) return null;

  return (
    <div className={`relative ${className}`}>
      <ResolvedImage url={currentUrl} />
      {validUrls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {validUrls.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-white w-2.5' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Resolves a gs:// or https:// URL and renders the image */
function ResolvedImage({ url }: { url: string }) {
  const resolved = useStorageUrl(url);

  if (!resolved) {
    return (
      <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
    );
  }

  return (
    <img
      src={resolved}
      alt="Artist"
      className="w-full h-full object-cover rounded-lg transition-opacity duration-500"
    />
  );
}
