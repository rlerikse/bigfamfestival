import { useState, useRef, useCallback } from 'react';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateImageFile, uploadEventImage } from '@/lib/storage';
import { ArtistImageCycler } from '@/components/events/ArtistImageCycler';
import { ArtistSelect } from '@/components/events/ArtistSelect';
import { useApiQuery } from '@/hooks/useApi';
import { STAGES } from '@/lib/constants';
import type { Event, Artist } from '@/types';

interface EventFormProps {
  event?: Event;
  onSubmit: (data: {
    name: string;
    artists: string[];
    stage: string;
    date: string;
    startTime: string;
    endTime: string;
    imageUrl: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const isEdit = !!event;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(event?.name ?? '');
  const [artistSlugs, setArtistSlugs] = useState<string[]>(event?.artists ?? []);
  const [stage, setStage] = useState(event?.stage ?? '');
  const [date, setDate] = useState(event?.date ?? '');
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [endTime, setEndTime] = useState(event?.endTime ?? '');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.imageUrl ?? null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageManuallySet, setImageManuallySet] = useState(!!event?.imageUrl);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch artists list to show image preview
  const { data: artistsData } = useApiQuery<Artist[]>(['artists-all'], '/artists');
  const artistsList = Array.isArray(artistsData) ? artistsData : [];

  // Get image URLs for selected artists (preview only — used when no manual image)
  const artistImageUrls = artistSlugs
    .map((slug) => artistsList.find((a) => (a.slug ?? a.id) === slug)?.imageUrl)
    .filter((u): u is string => !!u);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    setImageFile(file);
    setImageRemoved(false);
    setImageManuallySet(true);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    setImageManuallySet(true);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!name.trim()) errors.push('Name is required');
    if (!stage) errors.push('Stage is required');
    if (!date) errors.push('Date is required');
    if (!startTime) errors.push('Start time is required');
    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = imageRemoved ? '' : (event?.imageUrl ?? '');

      if (imageFile) {
        const eventId = event?.id ?? crypto.randomUUID();
        imageUrl = await uploadEventImage(imageFile, eventId);
      }

      await onSubmit({
        name: name.trim(),
        artists: artistSlugs,
        stage,
        date,
        startTime,
        endTime,
        imageUrl,
      });
    } catch (err) {
      if (err instanceof Error) {
        // Try to extract validation messages from API response
        const match = err.message.match(/\{.*\}/);
        if (match) {
          try {
            const body = JSON.parse(match[0]);
            const msgs = Array.isArray(body.message) ? body.message : [body.message];
            setError(msgs.join('. ') + '.');
            return;
          } catch { /* fall through */ }
        }
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image — shows artist photos by default, allows manual override */}
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
          <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="Event preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              className="absolute top-2 left-2 p-1.5 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Change image"
            >
              <Pencil className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/60 hover:bg-red-500/80 transition-colors"
              onClick={handleRemoveImage}
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : !imageManuallySet && artistImageUrls.length > 0 ? (
          <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden border border-border">
            <ArtistImageCycler imageUrls={artistImageUrls} className="w-full h-full" />
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
              From artist{artistImageUrls.length > 1 ? 's' : ''} — click to override
            </div>
            <button
              type="button"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Upload custom image"
            >
              <Upload className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="w-full max-w-[200px] mx-auto aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Optional — upload custom image</span>
          </div>
        )}

        {imageError && <p className="text-sm text-destructive mt-1">{imageError}</p>}
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium block mb-1.5">
          Name <span className="text-destructive">*</span>
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" required />
      </div>

      {/* Artists */}
      <ArtistSelect value={artistSlugs} onChange={setArtistSlugs} />

      {/* Stage */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a stage</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {/* Start / End Time — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Start</label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">End</label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
