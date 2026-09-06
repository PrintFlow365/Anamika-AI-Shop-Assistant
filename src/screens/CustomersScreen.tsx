import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { TransactionRow } from '@/components/TransactionRow';
import { formatTaka, toBnDigits, formatBnDate } from '@/lib/format';
import { Users, Plus, Phone, ChevronRight, User, TrendingUp, HandCoins } from 'lucide-react';
import type { Customer } from '@/types';

export function CustomersScreen() {
  const { customers, transactions, addCustomer } = useAppStore((s) => ({
    customers: s.customers,
    transactions: s.transactions,
    addCustomer: s.addCustomer,
  }));

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const sorted = [...customers].sort((a, b) => b.due - a.due);
  const totalDue = customers.reduce((sum, c) => sum + c.due, 0);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addCustomer({ shopId: 'shop-1', name: name.trim(), phone: phone.trim() || undefined });
    setName('');
    setPhone('');
    setAddOpen(false);
  };

  const selectedTx = selected
    ? transactions.filter((t) => t.customerId === selected.id)
    : [];

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">কাস্টমার</h1>
          <p className="text-sm text-ink-400 mt-0.5">মোট বাকি: {formatTaka(totalDue)}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-10 h-10 rounded-full bg-primary-700 grid place-items-center btn-press shadow-float"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="কোনো কাস্টমার নেই" message="নতুন কাস্টমার যোগ করতে উপরের + বোতামে চাপুন" />
      ) : (
        <div className="px-5 mt-3 space-y-2">
          {sorted.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="card w-full p-4 flex items-center gap-3 btn-press hover:shadow-soft text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 grid place-items-center shrink-0">
                <User className="w-5 h-5 text-primary-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900 text-sm truncate">{c.name}</p>
                {c.phone && <p className="text-xs text-ink-400 truncate">{c.phone}</p>}
              </div>
              <div className="text-right shrink-0">
                {c.due > 0 ? (
                  <p className="font-bold text-warning-600 bangla-num text-sm">{formatTaka(c.due)}</p>
                ) : (
                  <p className="text-xs text-success-600 font-medium">পরিষ্কার</p>
                )}
                <p className="text-xs text-ink-400">মোট বিক্রি {formatTaka(c.totalSales)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Add customer sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="নতুন কাস্টমার">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">নাম</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="কাস্টমারের নাম"
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ফোন (ঐচ্ছিক)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="০১৭xxxxxxxx"
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
          >
            যোগ করুন
          </button>
        </div>
      </Sheet>

      {/* Customer detail sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <TrendingUp className="w-5 h-5 text-success-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">মোট বিক্রি</p>
                <p className="font-bold text-ink-800 bangla-num text-sm">{formatTaka(selected.totalSales)}</p>
              </div>
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <HandCoins className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">মোট পরিশোধ</p>
                <p className="font-bold text-ink-800 bangla-num text-sm">{formatTaka(selected.totalPaid)}</p>
              </div>
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <Users className="w-5 h-5 text-warning-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">বর্তমান বাকি</p>
                <p className="font-bold text-warning-600 bangla-num text-sm">{formatTaka(selected.due)}</p>
              </div>
            </div>

            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-primary-600 font-medium">
                <Phone className="w-4 h-4" /> {selected.phone}
              </a>
            )}

            {/* History */}
            <div>
              <p className="text-xs font-semibold text-ink-500 mb-2">লেনদেন ইতিহাস ({toBnDigits(selectedTx.length)})</p>
              {selectedTx.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-4">এখনো কোনো লেনদেন নেই</p>
              ) : (
                <div className="card overflow-hidden">
                  {selectedTx.slice(0, 20).map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
