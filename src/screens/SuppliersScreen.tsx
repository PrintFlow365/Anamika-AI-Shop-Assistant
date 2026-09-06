import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { TransactionRow } from '@/components/TransactionRow';
import { formatTaka, toBnDigits } from '@/lib/format';
import { Building2, Plus, Phone, ChevronRight, Truck, Banknote, Package } from 'lucide-react';
import type { Supplier } from '@/types';

export function SuppliersScreen() {
  const { suppliers, transactions, addSupplier } = useAppStore((s) => ({
    suppliers: s.suppliers,
    transactions: s.transactions,
    addSupplier: s.addSupplier,
  }));

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<Supplier | null>(null);

  const sorted = [...suppliers].sort((a, b) => b.payable - a.payable);
  const totalPayable = suppliers.reduce((sum, s) => sum + s.payable, 0);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addSupplier({ shopId: 'shop-1', name: name.trim(), phone: phone.trim() || undefined });
    setName('');
    setPhone('');
    setAddOpen(false);
  };

  const selectedTx = selected
    ? transactions.filter((t) => t.supplierId === selected.id)
    : [];

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">সাপ্লায়ার</h1>
          <p className="text-sm text-ink-400 mt-0.5">মোট পাওনা: {formatTaka(totalPayable)}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-10 h-10 rounded-full bg-primary-700 grid place-items-center btn-press shadow-float"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<Building2 className="w-7 h-7" />} title="কোনো সাপ্লায়ার নেই" message="নতুন সাপ্লায়ার যোগ করতে উপরের + বোতামে চাপুন" />
      ) : (
        <div className="px-5 mt-3 space-y-2">
          {sorted.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="card w-full p-4 flex items-center gap-3 btn-press hover:shadow-soft text-left"
            >
              <div className="w-10 h-10 rounded-full bg-warning-100 grid place-items-center shrink-0">
                <Building2 className="w-5 h-5 text-warning-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900 text-sm truncate">{s.name}</p>
                {s.phone && <p className="text-xs text-ink-400 truncate">{s.phone}</p>}
              </div>
              <div className="text-right shrink-0">
                {s.payable > 0 ? (
                  <p className="font-bold text-danger-600 bangla-num text-sm">{formatTaka(s.payable)}</p>
                ) : (
                  <p className="text-xs text-success-600 font-medium">পরিষ্কার</p>
                )}
                <p className="text-xs text-ink-400">মোট ক্রয় {formatTaka(s.totalPurchases)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="নতুন সাপ্লায়ার">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">নাম</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="সাপ্লায়ারের নাম"
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ফোন (ঐচ্ছিক)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="০১৮xxxxxxxx"
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

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <Package className="w-5 h-5 text-warning-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">মোট ক্রয়</p>
                <p className="font-bold text-ink-800 bangla-num text-sm">{formatTaka(selected.totalPurchases)}</p>
              </div>
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <Banknote className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">মোট পরিশোধ</p>
                <p className="font-bold text-ink-800 bangla-num text-sm">{formatTaka(selected.totalPaid)}</p>
              </div>
              <div className="bg-ink-50 rounded-xl p-3 text-center">
                <Truck className="w-5 h-5 text-danger-600 mx-auto mb-1" />
                <p className="text-xs text-ink-400">বর্তমান পাওনা</p>
                <p className="font-bold text-danger-600 bangla-num text-sm">{formatTaka(selected.payable)}</p>
              </div>
            </div>

            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-primary-600 font-medium">
                <Phone className="w-4 h-4" /> {selected.phone}
              </a>
            )}

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
