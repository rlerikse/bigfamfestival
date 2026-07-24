import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GenreSelect } from '@/components/artists/GenreSelect';
import { validateImageFile, uploadArtistImage } from '@/lib/storage';
import type { Artist } from '@/types';

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface QuickCreateArtistModalProps {
  initialName: string;
  onCreate: (data: { name: string; slug: string; genres: string[]; bio: string; imageUrl: string }) => Promise<Artist>;
  onCreated: (artist: Artist) => void;
  onCancel: () => void;
}

/**
 * Inline "create a complete artist" modal, launched from ArtistSelect when
 * the typed name has no match. Unlike quick-add stubs, ALL fields here are
 * required — this creates a real, complete Artist record (bio + photo persist
 * on the Artist itself, not just on the event).
 */
export function QuickCreateArtistModal({ initialName, onCreate, onCreated, onCancel }: QuickCreateArtistModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!name.trim()) errors.push('Name is required');
    if (!bio.trim()) errors.push('Bio is required');
    if (genres.length === 0) errors.push('At least one genre is required');
    if (!imageFile) errors.push('Photo is required');
    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const slug = nameToSlug(name);
      const imageUrl = await uploadArtistImage(imageFile as File, slug);
      const artist = await onCreate({
        name: name.trim(),
        slug,
        genres,
        bio: bio.trim(),
        imageUrl,
      });
      onCreated(artist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4 my-auto">
        <h2 className="text-lg font-semibold">Create Artist "{initialName}"</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Creates a complete artist record. All fields are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Photo <span className="text-destructive">*</span>
            </label>
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
              <div className="relative w-full aspect-square max-w-[180px] mx-auto rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Artist preview" className="w-full h-full object-cover" />
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
                className="w-full max-w-[180px] mx-auto aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload Photo</span>
              </div>
            )}
            {imageError && <p className="text-sm text-destructive mt-1">{imageError}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Name <span className="text-destructive">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Artist name" required />
          </div>

          {/* Genres */}
          <GenreSelect value={genres} onChange={setGenres} />

          {/* Bio */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Bio <span className="text-destructive">*</span>
            </label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Artist bio..." rows={4} required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Artist'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
