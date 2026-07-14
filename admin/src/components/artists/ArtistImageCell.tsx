import { useStorageUrl } from '@/hooks/useStorageUrl';

export function ArtistImageCell({ imageUrl }: { imageUrl?: string | null }) {
  const url = useStorageUrl(imageUrl);
  if (!url) return <span className="text-muted-foreground">—</span>;
  return <img src={url} alt="" className="h-8 w-8 rounded-full object-cover" />;
}
