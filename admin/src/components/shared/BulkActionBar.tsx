import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-primary text-primary-foreground px-4 py-3 flex items-center gap-4 rounded-t-lg shadow-lg z-10">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex items-center gap-2">
        {children}
      </div>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onClear} className="text-primary-foreground hover:text-primary-foreground/80">
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
