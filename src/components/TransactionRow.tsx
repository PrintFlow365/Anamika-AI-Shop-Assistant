import type { Transaction, Customer, Supplier } from '@/types';
import { TRANSACTION_TYPE_META } from '@/types';
import { TypeIcon } from './TypeIcon';
import { formatTaka, formatBnTime, relativeDay } from '@/lib/format';

interface TransactionRowProps {
  tx: Transaction;
  customer?: Customer;
  supplier?: Supplier;
}

export function TransactionRow({ tx, customer, supplier }: TransactionRowProps) {
  const meta = TRANSACTION_TYPE_META[tx.type];
  const partyName =
    customer?.name ?? supplier?.name ?? '';

  const cashEffect = cashFlowLabel(tx);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0">
      <TypeIcon type={tx.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-900 text-sm truncate">{meta.labelBn}</span>
          {partyName && <span className="text-ink-400 text-sm truncate">— {partyName}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-ink-400">{relativeDay(tx.datetime)} · {formatBnTime(tx.datetime)}</span>
          {tx.source === 'voice' && (
            <span className="text-[10px] font-medium bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">ভয়েস</span>
          )}
        </div>
        {tx.notes && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{tx.notes}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-ink-900 bangla-num text-sm">{formatTaka(tx.amount)}</p>
        {cashEffect && <p className="text-xs text-ink-400 mt-0.5">{cashEffect}</p>}
      </div>
    </div>
  );
}

function cashFlowLabel(tx: Transaction): string | null {
  switch (tx.type) {
    case 'SALE':
      if (tx.dueAmount && tx.dueAmount > 0) return `পেয়েছেন ${formatTaka(tx.paidAmount ?? 0)} · বাকি ${formatTaka(tx.dueAmount)}`;
      return `নগদ ${formatTaka(tx.paidAmount ?? tx.amount)}`;
    case 'PURCHASE':
      if (tx.dueAmount && tx.dueAmount > 0) return `দিয়েছেন ${formatTaka(tx.paidAmount ?? 0)} · বাকি ${formatTaka(tx.dueAmount)}`;
      return `নগদ ${formatTaka(tx.paidAmount ?? tx.amount)}`;
    case 'CUSTOMER_PAYMENT':
      return 'বকেয়া আদায়';
    case 'SUPPLIER_PAYMENT':
      return 'পাওনা পরিশোধ';
    case 'OWNER_WITHDRAWAL':
      return 'মালিক তুলেছেন';
    case 'LOAN_GIVEN':
      return 'ধার দিয়েছেন';
    case 'LOAN_REPAID':
      return 'ধার ফেরত';
    case 'DAMAGE_LOSS':
      return 'ক্ষতি';
    default:
      return null;
  }
}
