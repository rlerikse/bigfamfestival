import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApi';

interface GenreTag {
  id: string;
  tag: string;
}

interface GenreSelectProps {
  value: string[];
  onChange: (genres: string[]) => void;
}

/**
 * SoundCloud-style genre search + select.
 * Searches existing genres from the master list.
 * If no match found, pressing Enter adds a new genre (properly capitalized).
 */
export function GenreSelect({ value, onChange }: GenreSelectProps) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch master genre list
  const { data: genreList } = useApiQuery<GenreTag[]>(
    ['genres'],
    '/events/genres'
  );

  // Filter genres by search input (exclude already selected)
  const filtered = (genreList ?? [])
    .filter((g) => {
      const tag = g.tag.toLowerCase();
      const search = input.toLowerCase().trim();
      return search && tag.includes(search) && !value.includes(g.tag);
    })
    .slice(0, 8);

  // Check if exact match exists in master list (case-insensitive)
  const exactMatch = (genreList ?? []).find(
    (g) => g.tag.toLowerCase() === input.toLowerCase().trim()
  );

  // Whether to show "Add new" option
  const showAddNew = input.trim().length > 0 && !exactMatch && !value.some(
    (v) => v.toLowerCase() === input.toLowerCase().trim()
  );

  // Capitalize properly: "deep house" → "Deep House"
  function capitalizeGenre(raw: string): string {
    // If it exists in the master list, use the canonical capitalization
    const existing = (genreList ?? []).find(
      (g) => g.tag.toLowerCase() === raw.toLowerCase().trim()
    );
    if (existing) return existing.tag;

    // Otherwise title-case, preserving special patterns
    return raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const addGenre = useCallback((tag: string) => {
    const capitalized = capitalizeGenre(tag);
    if (!value.includes(capitalized)) {
      onChange([...value, capitalized]);
    }
    setInput('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [value, onChange, genreList]);

  const removeGenre = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = filtered.length + (showAddNew ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, totalOptions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        addGenre(filtered[highlightedIndex].tag);
      } else if (highlightedIndex === filtered.length && showAddNew) {
        addGenre(input);
      } else if (input.trim()) {
        // Enter with no selection — add if valid
        if (exactMatch) {
          addGenre(exactMatch.tag);
        } else if (showAddNew) {
          addGenre(input);
        }
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // Remove last tag on backspace in empty input
      removeGenre(value[value.length - 1]);
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
      <label className="text-sm font-medium block mb-1.5">Genres</label>

      {/* Tag chips + input */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-md border border-input bg-background cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeGenre(tag); }}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => { if (input.trim()) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Search genres...' : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        Search existing genres or type a new one and press Enter
      </p>

      {/* Dropdown */}
      {showDropdown && (filtered.length > 0 || showAddNew) && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => addGenre(g.tag)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                i === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`}
            >
              {g.tag}
            </button>
          ))}
          {showAddNew && (
            <button
              type="button"
              onClick={() => addGenre(input)}
              className={`w-full text-left px-3 py-2 text-sm border-t border-border transition-colors flex items-center gap-2 ${
                highlightedIndex === filtered.length ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`}
            >
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-600 text-white text-xs font-bold">+</span>
              <span className="font-medium">{capitalizeGenre(input)}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
