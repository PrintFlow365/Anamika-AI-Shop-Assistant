import { Menu } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, onMenu, right }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
        {onMenu && (
          <button onClick={onMenu} className="p-2 -ml-2 rounded-full hover:bg-ink-100 btn-press">
            <Menu className="w-5 h-5 text-ink-600" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-ink-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-400 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
