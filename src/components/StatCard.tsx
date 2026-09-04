import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  onClick?: () => void;
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-800', iconBg: 'bg-primary-100 text-primary-700' },
  success: { bg: 'bg-success-50', text: 'text-success-700', iconBg: 'bg-success-100 text-success-700' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', iconBg: 'bg-warning-100 text-warning-600' },
  danger: { bg: 'bg-danger-50', text: 'text-danger-600', iconBg: 'bg-danger-100 text-danger-600' },
  neutral: { bg: 'bg-ink-50', text: 'text-ink-700', iconBg: 'bg-ink-100 text-ink-600' },
};

export function StatCard({ label, value, sublabel, icon, tone = 'neutral', onClick }: StatCardProps) {
  const t = toneStyles[tone];
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`card p-4 text-left ${onClick ? 'btn-press hover:shadow-soft' : ''} ${t.bg}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500 mb-1 truncate">{label}</p>
          <p className={`text-xl font-bold ${t.text} bangla-num`}>{value}</p>
          {sublabel && <p className="text-xs text-ink-400 mt-0.5 truncate">{sublabel}</p>}
        </div>
        {icon && <div className={`shrink-0 w-9 h-9 rounded-full grid place-items-center ${t.iconBg}`}>{icon}</div>}
      </div>
    </Comp>
  );
}
