import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, User } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApi';
import type { User as UserType } from '@/types';

interface UserSearchProps {
  value: string | null; // userId
  displayValue?: string; // name or email to show when linked
  onChange: (userId: string | null, userName: string | null) => void;
}

interface UsersResponse {
  users: UserType[];
  total: number;
}

/**
 * Debounced user search input — searches by name or email.
 * Shows dropdown results, lets admin select a user to link.
 */
export function UserSearch({ value, displayValue, onChange }: UserSearchProps) {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Query users
  const { data } = useApiQuery<UsersResponse>(
    ['admin-users-search', debouncedInput],
    `/admin/users?search=${encodeURIComponent(debouncedInput)}&limit=8`,
    { enabled: debouncedInput.length >= 2 }
  );

  const results = data?.users ?? [];

  const selectUser = useCallback((user: UserType) => {
    onChange(user.id, user.name || user.email);
    setInput('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  const clearSelection = () => {
    onChange(null, null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        selectUser(results[highlightedIndex]);
      }
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
      <label className="text-sm font-medium block mb-1.5">Linked User</label>

      {value ? (
        /* Show linked user chip */
        <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{displayValue || value}</span>
          <button
            type="button"
            onClick={clearSelection}
            className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => { if (input.length >= 2) setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Search users by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Link a user account to let them manage this artist profile
      </p>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && !value && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
          {results.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                i === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`}
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name || 'Unnamed'}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                {user.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && debouncedInput.length >= 2 && results.length === 0 && !value && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md px-3 py-3 text-sm text-muted-foreground text-center">
          No users found
        </div>
      )}
    </div>
  );
}
