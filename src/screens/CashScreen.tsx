import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { StatCard } from '@/components/StatCard';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { computeExpectedCash, cashBalanceFromEntries } from '@/lib/accounting';
import { formatTaka, formatBnDate, formatBnTime, relativeDay, toBnDigits } from '@/lib/format';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { CashEntry } from '@/types';

export function CashScreen() {
  const { shop, transactions, cashEntries, dailyCloses, addCashEntry } = useAppStore((s) => ({
    shop: s.shop,
    transactions: s.transactions,
    cashEntries: s.cashEntries,
    dailyCloses: s.dailyCloses,
    addCashEntry: s.addCashEntry,
  }));

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'CASH_IN' | 'CASH_OUT' | 'ADJUSTMENT'>('ADJUSTMENT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  if (!shop) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const expectedCash = computeExpectedCash(shop.openingCash, transactions, today);
  const manualBalance = cashBalanceFromEntries(cashEntries);

  // Deficit = expected cash - what we actually should have based on manual entries
  const recentCloses = [...dailyCloses].slice(0, 5);
  const totalDeficit = recentCloses.reduce((sum, dc) => sum + (dc.difference < 0 ? dc.difference : 0), 0);

  const handleAdjust = async () => {
    if (!adjustAmount) return;
    await addCashEntry({
      shopId: shop.id,
      datetime: new Date().toISOString(),
      type: adjustType,
      amount: Number(adjustAmount),
      description: adjustDesc || (adjustType === 'CASH_IN' ? 'নগদ যোগ' : adjustType === 'CASH_OUT' ? 'নগদ বিয়োগ' : 'সমন্বয়'),
    });
    setAdjustOpen(false);
    setAdjustAmount('');
    setAdjustDesc('');
  };

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-ink-900">নগদ</h1>
        <p className="text-sm text-ink-400 mt-0.5">ক্যাশ ব্যালেন্স ও রিকনসাইল</p>
      </div>

      {/* Main balance */}
      <div className="px-5 mt-4">
        <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-2xl p-5 shadow-float">
          <p className="text-sm text-primary-100">বর্তমান ক্যাশ (হিসাব অনুযায়ী)</p>
          <p className="text-4xl font-bold text-white bangla-num mt-1">{formatTaka(expectedCash)}</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-primary-600">
            <div>
              <p className="text-xs text-primary-200">শুরুর ক্যাশ</p>
              <p className="text-sm font-semibold text-white bangla-num">{formatTaka(shop.openingCash)}</p>
            </div>
            <div>
              <p className="text-xs text-primary-200">ম্যানুয়াল এন্ট্রি</p>
              <p className="text-sm font-semibold text-white bangla-num">{formatTaka(manualBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="নগদ এসেছে" value={formatTaka(transactions.filter(t => t.datetime.slice(0,10) === today).reduce((s,t) => s + (t.paidAmount ?? t.amount), 0))} icon={<TrendingUp className="w-5 h-5" />} tone="success" />
          <StatCard label="নগদ গেছে" value={formatTaka(transactions.filter(t => t.datetime.slice(0,10) === today).reduce((s,t) => {
            if (['SUPPLIER_PAYMENT','EXPENSE','OWNER_WITHDRAWAL','LOAN_GIVEN'].includes(t.type)) return s + t.amount;
            if (t.type === 'PURCHASE') return s + (t.paidAmount ?? 0);
            return s;
          }, 0))} icon={<TrendingDown className="w-5 h-5" />} tone="danger" />
          <StatCard label="ঘাটতি" value={formatTaka(totalDeficit)} icon={<AlertTriangle className="w-5 h-5" />} tone="warning" />
        </div>
      </div>

      {/* Adjust button */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setAdjustOpen(true)}
          className="w-full card p-4 flex items-center gap-3 btn-press hover:shadow-soft"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 grid place-items-center">
            <Plus className="w-5 h-5 text-primary-700" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-ink-800 text-sm">ক্যাশ সমন্বয়</p>
            <p className="text-xs text-ink-400">নগদ যোগ/বিয়োগ/ঠিক করুন</p>
          </div>
        </button>
      </div>

      {/* Daily closes history */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-semibold text-ink-700 mb-2">দিন শেষ ইতিহাস</h2>
        {recentCloses.length === 0 ? (
          <EmptyState icon={<Wallet className="w-7 h-7" />} title="এখনো দিন শেষ করা হয়নি" />
        ) : (
          <div className="space-y-2">
            {recentCloses.map((dc) => (
              <div key={dc.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-ink-800">{formatBnDate(dc.date)}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dc.difference === 0 ? 'bg-success-100 text-success-700' : dc.difference < 0 ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-700'}`}>
                    {dc.difference === 0 ? 'ঠিক' : dc.difference < 0 ? `${formatTaka(dc.difference)} ঘাটতি` : `${formatTaka(dc.difference)} বেশি`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span className="text-ink-400">হিসাব</span><span className="font-medium text-ink-700 bangla-num">{formatTaka(dc.expectedCash)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">গণনা</span><span className="font-medium text-ink-700 bangla-num">{formatTaka(dc.countedCash)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">বিক্রি</span><span className="font-medium text-success-600 bangla-num">{formatTaka(dc.totalSales)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">খরচ</span><span className="font-medium text-danger-600 bangla-num">{formatTaka(dc.totalExpenses)}</span></div>
                </div>
                {dc.notes && <p className="text-xs text-ink-400 mt-2 italic">{dc.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash entries log */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-semibold text-ink-700 mb-2">ক্যাশ এন্ট্রি ({toBnDigits(cashEntries.length)})</h2>
        {cashEntries.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-4">কোনো ম্যানুয়াল এন্ট্রি নেই</p>
        ) : (
          <div className="card overflow-hidden">
            {cashEntries.slice(0, 10).map((e) => (
              <CashEntryRow key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>

      {/* Adjust sheet */}
      <Sheet open={adjustOpen} onClose={() => setAdjustOpen(false)} title="ক্যাশ সমন্বয়">
        <div className="space-y-4">
          <div className="flex gap-2">
            {([
              { type: 'CASH_IN' as const, label: 'নগদ যোগ', icon: ArrowUpCircle },
              { type: 'CASH_OUT' as const, label: 'নগদ বিয়োগ', icon: ArrowDownCircle },
              { type: 'ADJUSTMENT' as const, label: 'সমন্বয়', icon: Wallet },
            ]).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => setAdjustType(opt.type)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl btn-press ${adjustType === opt.type ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">পরিমাণ</label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="০"
              className="w-full text-2xl font-bold text-ink-900 bg-ink-50 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary-400 bangla-num"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">বিবরণ</label>
            <input
              value={adjustDesc}
              onChange={(e) => setAdjustDesc(e.target.value)}
              placeholder="কেন যোগ/বিয়োগ করছেন..."
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
            />
          </div>
          <button
            onClick={handleAdjust}
            disabled={!adjustAmount}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function CashEntryRow({ entry }: { entry: CashEntry }) {
  const isIn = entry.type === 'CASH_IN' || entry.type === 'ADJUSTMENT';
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0">
      <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${isIn ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-600'}`}>
        {isIn ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800 truncate">{entry.description}</p>
        <p className="text-xs text-ink-400">{relativeDay(entry.datetime)} · {formatBnTime(entry.datetime)}</p>
      </div>
      <p className={`font-bold bangla-num text-sm shrink-0 ${isIn ? 'text-success-600' : 'text-danger-600'}`}>
        {isIn ? '+' : '−'}{formatTaka(entry.amount)}
      </p>
    </div>
  );
}
