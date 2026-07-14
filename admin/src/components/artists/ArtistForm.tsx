import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GenreSelect } from '@/components/artists/GenreSelect';
import { UserSearch } from '@/components/artists/UserSearch';
import { SoundCloudIcon, SpotifyIcon, FacebookIcon, InstagramIcon } from '@/components/artists/SocialIcons';
import { validateImageFile, uploadArtistImage } from '@/lib/storage';
import { useStorageUrl } from '@/hooks/useStorageUrl';
import type { Artist } from '@/types';

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ArtistFormProps {
  artist?: Artist;
  onSubmit: (data: { name: string; slug: string; genres: string[]; bio: string; imageUrl: string; userId: string | null; soundcloudUrl: string; spotifyUrl: string; facebookUrl: string; instagramUrl: string }) => Promise<void>;
  onCancel: () => void;
}

export function ArtistForm({ artist, onSubmit, onCancel }: ArtistFormProps) {
  const isEdit = !!artist;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(artist?.name ?? '');
  const [slug, setSlug] = useState(artist?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [genres, setGenres] = useState<string[]>(artist?.genres ?? (artist?.genre ? [artist.genre] : []));
  const [bio, setBio] = useState(artist?.bio ?? '');
  const [userId, setUserId] = useState<string | null>(artist?.userId ?? null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(artist?.userDisplayName ?? null);
  const [soundcloudUrl, setSoundcloudUrl] = useState(artist?.soundcloudUrl ?? '');
  const [spotifyUrl, setSpotifyUrl] = useState(artist?.spotifyUrl ?? '');
  const [facebookUrl, setFacebookUrl] = useState(artist?.facebookUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(artist?.instagramUrl ?? '');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Resolve gs:// URL to a downloadable HTTPS URL with auth token
  const resolvedImageUrl = useStorageUrl(artist?.imageUrl);

  // Set preview when resolved URL comes back (and user hasn't changed it)
  useEffect(() => {
    if (resolvedImageUrl && !imageFile && !imageRemoved) {
      setImagePreview(resolvedImageUrl);
    }
  }, [resolvedImageUrl, imageFile, imageRemoved]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugTouched) {
      setSlug(nameToSlug(name));
    }
  }, [name, slugTouched]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    setImageFile(file);
    setImageRemoved(false);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = imageRemoved ? '' : (artist?.imageUrl ?? '');

      if (imageFile) {
        imageUrl = await uploadArtistImage(imageFile, slug);
      }

      await onSubmit({ name: name.trim(), slug: slug.trim(), genres, bio: bio.trim(), imageUrl, userId, soundcloudUrl: soundcloudUrl.trim(), spotifyUrl: spotifyUrl.trim(), facebookUrl: facebookUrl.trim(), instagramUrl: instagramUrl.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {imagePreview ? (
          <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-lg overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="Artist preview"
              className="w-full h-full object-cover"
            />
            {/* Edit overlay — top-left */}
            <button
              type="button"
              className="absolute top-2 left-2 p-1.5 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Change image"
            >
              <Pencil className="h-3.5 w-3.5 text-sage-300" />
            </button>
            {/* Remove overlay — top-right */}
            <button
              type="button"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/60 hover:bg-red-500/80 transition-colors"
              onClick={handleRemoveImage}
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="w-full max-w-[240px] mx-auto aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Upload Image</span>
            <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF — max 5MB</span>
          </div>
        )}

        {imageError && (
          <p className="text-sm text-destructive mt-1">{imageError}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium block mb-1.5">
          Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Artist name"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Slug</label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          }}
          placeholder="artist-slug"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used as artist identifier (e.g., artists/{'{'}slug{'}'})
        </p>
      </div>

      {/* Genres */}
      <GenreSelect value={genres} onChange={setGenres} />

      {/* Linked User */}
      <UserSearch
        value={userId}
        displayValue={userDisplayName}
        onChange={(id, name) => { setUserId(id); setUserDisplayName(name); }}
      />

      {/* Social Links */}
      <div>
        <label className="text-sm font-medium block mb-2">Social Links</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 flex justify-center" title="SoundCloud"><SoundCloudIcon /></span>
            <Input
              value={soundcloudUrl}
              onChange={(e) => setSoundcloudUrl(e.target.value)}
              placeholder="https://soundcloud.com/..."
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 flex justify-center" title="Spotify"><SpotifyIcon /></span>
            <Input
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 flex justify-center" title="Facebook"><FacebookIcon /></span>
            <Input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 flex justify-center" title="Instagram"><InstagramIcon /></span>
            <Input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Bio</label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Artist bio..."
          rows={4}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Artist'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
