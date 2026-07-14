import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApi';
import type { Artist } from '@/types';

interface ArtistSelectProps {
  value: string[]; // array of slugs
  onChange: (slugs: string[]) => void;
}

/**
 * Multi-select artist search — type to filter, click or Enter to add.
 * Shows chips for selected artists. Searches by name against loaded artists list.
 */
export function ArtistSelect({ value, onChange }: ArtistSelectProps) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all artists
  const { data: artistsData } = useApiQuery<Artist[]>(['artists-all'], '/artists');
  const allArtists = Array.isArray(artistsData) ? artistsData : [];

  // Filter artists based on input (search by name), exclude already-selected
  const filtered = input.length >= 1
    ? allArtists.filter((a) => {
        const slug = a.slug ?? a.id;
        if (value.includes(slug)) return false;
        return a.name.toLowerCase().includes(input.toLowerCase());
      }).slice(0, 8)
    : [];

  // Get display name for a slug
  const getArtistName = (slug: string) => {
    const artist = allArtists.find((a) => (a.slug ?? a.id) === slug);
    return artist?.name ?? slug;
  };

  const addArtist = useCallback((artist: Artist) => {
    const slug = artist.slug ?? artist.id;
    if (!value.includes(slug)) {
      onChange([...value, slug]);
    }
    setInput('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [value, onChange]);

  const removeArtist = (slug: string) => {
    onChange(value.filter((s) => s !== slug));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        addArtist(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      // Remove last artist on backspace with empty input
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium block mb-1.5">Artists</label>

      {/* Chips + input row */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[40px] px-2 py-1.5 rounded-md border border-input bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((slug) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
          >
            {getArtistName(slug)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeArtist(slug); }}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => { if (input.length >= 1) setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? 'Search artists...' : ''}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        Search by artist name to add
      </p>

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.map((artist, i) => (
            <button
              key={artist.slug ?? artist.id}
              type="button"
              onClick={() => addArtist(artist)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                i === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`}
            >
              <span className="font-medium">{artist.name}</span>
              <span className="text-xs text-muted-foreground">{artist.slug ?? artist.id}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && input.length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground text-center">
          No artists found
        </div>
      )}
    </div>
  );
}
