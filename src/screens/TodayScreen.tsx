import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { TransactionRow } from '@/components/TransactionRow';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { summarizeToday, summarizeDay } from '@/lib/accounting';
import { formatTaka, formatBnDate, toBnDigits, todayISODate } from '@/lib/format';
import { ShoppingBag, TrendingUp, Wallet, Receipt, CalendarCheck } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import type { DailyClose } from '@/types';

export function TodayScreen() {
  const { transactions, customers, suppliers, shop, addDailyClose } = useAppStore((s) => ({
    transactions: s.transactions,
    customers: s.customers,
    suppliers: s.suppliers,
    shop: s.shop,
    addDailyClose: s.addDailyClose,
  }));

  const [closeOpen, setCloseOpen] = useState(false);
  const [countedCash, setCountedCash] = useState('');

  const today = todayISODate();
  const todayTx = transactions.filter((t) => t.datetime.slice(0, 10) === today);
  const summary = summarizeToday(transactions);
  const yesterdaySummary = summarizeDay(transactions, new Date(Date.now() - 86400000).toISOString().slice(0, 10));

  const expectedCash = shop ? computeExpectedCashForToday(shop.openingCash, transactions) : 0;

  const handleDailyClose = async () => {
    if (!shop || !countedCash) return;
    const counted = Number(countedCash);
    const dc: Omit<DailyClose, 'id' | 'createdAt'> = {
      shopId: shop.id,
      date: today,
      expectedCash,
      countedCash: counted,
      difference: counted - expectedCash,
      totalSales: summary.sales,
      totalPurchases: summary.purchases,
      totalExpenses: summary.expenses,
      totalWithdrawals: summary.withdrawals,
    };
    await addDailyClose(dc);
    setCloseOpen(false);
    setCountedCash('');
  };

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-ink-900">আজকের ব্যবসা</h1>
        <p className="text-sm text-ink-400 mt-0.5">{formatBnDate(new Date().toISOString())}</p>
      </div>

      {/* Summary cards */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="বিক্রি" value={formatTaka(summary.sales)} icon={<TrendingUp className="w-5 h-5" />} tone="success" />
          <StatCard label="ক্রয়" value={formatTaka(summary.purchases)} icon={<ShoppingBag className="w-5 h-5" />} tone="warning" />
          <StatCard label="খরচ" value={formatTaka(summary.expenses)} icon={<Receipt className="w-5 h-5" />} tone="danger" />
          <StatCard label="মালিক তুলেছেন" value={formatTaka(summary.withdrawals)} icon={<Wallet className="w-5 h-5" />} tone="neutral" />
        </div>
      </div>

      {/* Cash flow summary */}
      <div className="px-5 mt-4">
        <div className="card p-4 space-y-2">
          <Row label="নগদ এসেছে" value={formatTaka(summary.netCashIn)} tone="text-success-600" />
          <Row label="নগদ গেছে" value={formatTaka(summary.netCashOut)} tone="text-danger-600" />
          <div className="border-t border-ink-100 pt-2">
            <Row label="নিট নগদ" value={`${summary.netCashIn - summary.netCashOut >= 0 ? '+' : '−'}${formatTaka(Math.abs(summary.netCashIn - summary.netCashOut))}`} tone="text-primary-700" bold />
          </div>
        </div>
      </div>

      {/* Daily close button */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setCloseOpen(true)}
          className="w-full card p-4 flex items-center gap-3 btn-press hover:shadow-soft"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 grid place-items-center">
            <CalendarCheck className="w-5 h-5 text-primary-700" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-ink-800 text-sm">দিন শেষ করুন</p>
            <p className="text-xs text-ink-400">ক্যাশ গণনা ও রিকনসাইল</p>
          </div>
        </button>
      </div>

      {/* Yesterday comparison */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-semibold text-ink-700 mb-2">গতকালের তুলনা</h2>
        <div className="card p-4 space-y-2">
          <Row label="গতকাল বিক্রি" value={formatTaka(yesterdaySummary.sales)} tone="text-ink-600" />
          <Row label="আজ বিক্রি" value={formatTaka(summary.sales)} tone="text-ink-900" bold />
        </div>
      </div>

      {/* Transactions list */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-semibold text-ink-700 mb-2">
          আজকের লেনদেন ({toBnDigits(todayTx.length)})
        </h2>
        {todayTx.length === 0 ? (
          <EmptyState icon={<ShoppingBag className="w-7 h-7" />} title="আজ এখনো কোনো লেনদেন নেই" message="কথা বলুন বোতাম দিয়ে প্রথম এন্ট্রি যোগ করুন" />
        ) : (
          <div className="card overflow-hidden">
            {todayTx.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                customer={customers.find((c) => c.id === tx.customerId)}
                supplier={suppliers.find((s) => s.id === tx.supplierId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Daily close sheet */}
      <Sheet open={closeOpen} onClose={() => setCloseOpen(false)} title="দিন শেষ">
        <div className="space-y-4">
          <div className="bg-ink-50 rounded-xl p-4 space-y-2">
            <Row label="হিসাব অনুযায়ী ক্যাশ" value={formatTaka(expectedCash)} tone="text-primary-700" bold />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">গণনা করা ক্যাশ</label>
            <input
              type="number"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="০"
              className="w-full text-2xl font-bold text-ink-900 bg-ink-50 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary-400 bangla-num"
            />
          </div>
          {countedCash && (
            <div className="bg-ink-50 rounded-xl p-3">
              <Row
                label="পার্থক্য"
                value={`${Number(countedCash) - expectedCash >= 0 ? '+' : '−'}${formatTaka(Math.abs(Number(countedCash) - expectedCash))}`}
                tone={Math.abs(Number(countedCash) - expectedCash) < 1 ? 'text-success-600' : 'text-warning-600'}
                bold
              />
            </div>
          )}
          <button
            onClick={handleDailyClose}
            disabled={!countedCash}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
          >
            দিন শেষ নিশ্চিত করুন
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Row({ label, value, tone, bold }: { label: string; value: string; tone: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-ink-800' : 'text-ink-500'}`}>{label}</span>
      <span className={`bangla-num ${bold ? 'font-bold' : 'font-semibold'} ${tone}`}>{value}</span>
    </div>
  );
}

function computeExpectedCashForToday(openingCash: number, transactions: { datetime: string; type: string; amount: number; paidAmount?: number }[]): number {
  let cash = openingCash;
  const today = todayISODate();
  for (const t of transactions) {
    if (t.datetime.slice(0, 10) > today) continue;
    switch (t.type) {
      case 'SALE': cash += t.paidAmount ?? 0; break;
      case 'CUSTOMER_PAYMENT': case 'LOAN_REPAID': cash += t.amount; break;
      case 'PURCHASE': cash -= t.paidAmount ?? 0; break;
      case 'SUPPLIER_PAYMENT': case 'EXPENSE': case 'OWNER_WITHDRAWAL': case 'LOAN_GIVEN': cash -= t.amount; break;
    }
  }
  return cash;
}
