import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-float max-h-[88vh] flex flex-col animate-slide-up">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ink-100">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-ink-100 btn-press">
              <X className="w-5 h-5 text-ink-500" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 no-scrollbar">{children}</div>
      </div>
    </div>
  );
}
