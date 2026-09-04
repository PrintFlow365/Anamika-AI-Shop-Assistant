import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="w-16 h-16 rounded-full bg-ink-100 grid place-items-center mb-4 text-ink-400">{icon}</div>}
      <p className="font-semibold text-ink-700 mb-1">{title}</p>
      {message && <p className="text-sm text-ink-400 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
