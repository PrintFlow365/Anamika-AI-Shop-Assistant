import type { TransactionType } from '@/types';
import { TRANSACTION_TYPE_META } from '@/types';
import {
  ShoppingBag, Truck, HandCoins, Banknote, Receipt, Wallet,
  Handshake, RotateCcw, Package, AlertTriangle, Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  truck: Truck,
  'hand-coins': HandCoins,
  banknote: Banknote,
  receipt: Receipt,
  wallet: Wallet,
  handshake: Handshake,
  'rotate-ccw': RotateCcw,
  package: Package,
  'alert-triangle': AlertTriangle,
  bell: Bell,
};

interface TypeIconProps {
  type: TransactionType;
  size?: number;
  className?: string;
}

export function TypeIcon({ type, size = 18, className = '' }: TypeIconProps) {
  const meta = TRANSACTION_TYPE_META[type];
  const Icon = iconMap[meta.icon] ?? Package;
  const toneClasses: Record<string, string> = {
    success: 'bg-success-100 text-success-700',
    danger: 'bg-danger-100 text-danger-600',
    warning: 'bg-warning-100 text-warning-600',
    neutral: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className={`shrink-0 w-9 h-9 rounded-full grid place-items-center ${toneClasses[meta.tone]} ${className}`}>
      <Icon size={size} />
    </div>
  );
}
