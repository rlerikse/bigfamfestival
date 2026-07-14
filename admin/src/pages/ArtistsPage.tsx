import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { EditModal } from '@/components/shared/EditModal';
import { ConfirmDeleteModal } from '@/components/artists/ConfirmDeleteModal';
import { ArtistForm } from '@/components/artists/ArtistForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Artist } from '@/types';
import { useApiQuery, useCreateArtist, useUpdateArtist, useDeleteMutation } from '@/hooks/useApi';
import { ArtistImageCell } from '@/components/artists/ArtistImageCell';
import { SoundCloudIcon, SpotifyIcon, FacebookIcon, InstagramIcon } from '@/components/artists/SocialIcons';

export function ArtistsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const { data: rawData, isLoading } = useApiQuery<Artist[]>(
    ['artists'],
    '/artists',
  );

  // Client-side search filter
  const allArtists = Array.isArray(rawData) ? rawData : [];
  const filtered = useMemo(() => {
    if (!search) return allArtists;
    const q = search.toLowerCase();
    return allArtists.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.slug ?? '').toLowerCase().includes(q) ||
      (a.genres ?? []).some((g) => g.toLowerCase().includes(q))
    );
  }, [allArtists, search]);

  // Simple client-side pagination
  const pageSize = 20;
  const paginatedArtists = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const createMutation = useCreateArtist();
  const updateMutation = useUpdateArtist();
  const deleteMutation = useDeleteMutation(['artists'], '/artists');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);

  const openCreate = () => {
    setEditingArtist(null);
    setModalOpen(true);
  };

  const openEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingArtist(null);
  };

  const handleSubmit = async (formData: { name: string; slug: string; genres: string[]; bio: string; imageUrl: string; userId: string | null; soundcloudUrl: string; spotifyUrl: string; facebookUrl: string; instagramUrl: string }) => {
    // Strip null/undefined/empty-string values before sending to API (class-validator rejects null on @IsString, empty on @IsUrl)
    const cleanData = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v != null && v !== '')
    ) as Record<string, unknown>;
    // Keep empty genres array (valid)
    if (formData.genres !== undefined) cleanData.genres = formData.genres;

    if (editingArtist) {
      await updateMutation.mutateAsync({
        slug: editingArtist.slug ?? editingArtist.id,
        data: cleanData,
      });
    } else {
      await createMutation.mutateAsync(cleanData as { name: string; slug: string; bio?: string; genres?: string[]; imageUrl?: string });
    }
    closeModal();
  };

  const columns: ColumnDef<Artist, unknown>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'genres',
      header: 'Genres',
      cell: ({ row }) => {
        const genres = row.original.genres;
        if (!genres || genres.length === 0) return '—';
        return (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
            ))}
            {genres.length > 3 && (
              <span className="text-xs text-muted-foreground">+{genres.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'bio',
      header: 'Bio',
      cell: ({ row }) => {
        const bio = row.original.bio;
        return bio ? <span className="truncate max-w-xs block">{bio}</span> : '—';
      },
    },
    {
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: ({ row }) => <ArtistImageCell imageUrl={row.original.imageUrl} />,
    },
    {
      id: 'socials',
      header: 'Socials',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {a.soundcloudUrl ? (
              <a href={a.soundcloudUrl} target="_blank" rel="noopener noreferrer" title="SoundCloud">
                <SoundCloudIcon className="h-4 w-4" />
              </a>
            ) : (
              <SoundCloudIcon className="h-4 w-4 opacity-20 grayscale" />
            )}
            {a.spotifyUrl ? (
              <a href={a.spotifyUrl} target="_blank" rel="noopener noreferrer" title="Spotify">
                <SpotifyIcon className="h-4 w-4" />
              </a>
            ) : (
              <SpotifyIcon className="h-4 w-4 opacity-20 grayscale" />
            )}
            {a.facebookUrl ? (
              <a href={a.facebookUrl} target="_blank" rel="noopener noreferrer" title="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </a>
            ) : (
              <FacebookIcon className="h-4 w-4 opacity-20 grayscale" />
            )}
            {a.instagramUrl ? (
              <a href={a.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </a>
            ) : (
              <InstagramIcon className="h-4 w-4 opacity-20 grayscale" />
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => openEdit(row.original)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded transition-colors text-muted-foreground hover:bg-red-100 hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artists</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Artist
        </Button>
      </div>

      <Input
        placeholder="Search artists..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-xs"
      />

      <DataTable
        data={paginatedArtists}
        columns={columns}
        total={filtered.length}
        page={page}
        onPageChange={setPage}
        loading={isLoading}
      />

      {/* Create / Edit Modal */}
      <EditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingArtist ? `Edit: ${editingArtist.name}` : 'Add Artist'}
      >
        <ArtistForm
          key={editingArtist?.id ?? 'new'}
          artist={editingArtist ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </EditModal>
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const slug = deleteTarget.slug ?? deleteTarget.id;
            deleteMutation.mutate(slug, { onSettled: () => setDeleteTarget(null) });
          }
        }}
        artistName={deleteTarget?.name ?? ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
