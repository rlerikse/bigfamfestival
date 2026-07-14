import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  artistName: string;
  isDeleting?: boolean;
}

/**
 * Two-step delete confirmation modal:
 * Step 1: "Are you sure you want to delete {name}?"
 * Step 2: Warning about permanent deletion + live app impact
 */
export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, artistName, isDeleting }: ConfirmDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Delete Artist</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{artistName}</span>?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={() => setStep(2)}
              >
                Yes, Delete
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">
                ⚠️ This action is permanent and cannot be undone.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>The artist document will be permanently deleted from Firestore</li>
                <li>Any events referencing this artist will have a broken reference</li>
                <li>This could actively affect live app performance for users</li>
                <li>The artist's uploaded image will remain in Storage but become orphaned</li>
              </ul>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
