import { useAppStore } from '@/store/StoreContext';
import { StatCard } from '@/components/StatCard';
import { summarizeToday, totalCustomerDue, totalSupplierPayable, computeExpectedCash } from '@/lib/accounting';
import { formatTaka, formatBnDate, toBnDigits } from '@/lib/format';
import { Mic, TrendingUp, AlertCircle, Wallet, Users, Building2, ChevronRight, Bell } from 'lucide-react';
import type { Route } from '@/components/Navigation';

interface HomeScreenProps {
  onNavigate: (route: Route) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { shop, transactions, customers, suppliers, reminders } = useAppStore((s) => ({
    shop: s.shop,
    transactions: s.transactions,
    customers: s.customers,
    suppliers: s.suppliers,
    reminders: s.reminders,
  }));

  if (!shop) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const today = summarizeToday(transactions);
  const custDue = totalCustomerDue(customers);
  const supPayable = totalSupplierPayable(suppliers);
  const cashNow = computeExpectedCash(shop.openingCash, transactions, new Date().toISOString().slice(0, 10));
  const pendingReminders = reminders.filter((r) => !r.done).length;

  const greeting = getGreeting();

  return (
    <div className="max-w-md mx-auto pb-4">
      {/* Greeting */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-sm text-ink-400">{formatBnDate(new Date().toISOString())}</p>
        <h1 className="text-2xl font-bold text-ink-900 mt-0.5">{greeting}, {shop.ownerName.split(' ')[0]}</h1>
      </div>

      {/* Voice button — visually dominant */}
      <div className="px-5 py-4">
        <button
          onClick={() => onNavigate('speak')}
          className="relative w-full bg-gradient-to-br from-primary-700 to-primary-800 rounded-3xl py-8 px-6 shadow-float btn-press overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -left-4 -bottom-12 w-32 h-32 rounded-full bg-white" />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse-ring" />
              <div className="w-20 h-20 rounded-full bg-white grid place-items-center shadow-lg">
                <Mic className="w-10 h-10 text-primary-700" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">কথা বলুন</p>
              <p className="text-sm text-primary-100 mt-1">বিক্রি, ক্রয়, বাকি — সব ভয়েসে লিখুন</p>
            </div>
          </div>
        </button>
      </div>

      {/* Today's summary cards */}
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="আজকের বিক্রি"
            value={formatTaka(today.sales)}
            sublabel={`${toBnDigits(today.transactionCount)} টি লেনদেন`}
            icon={<TrendingUp className="w-5 h-5" />}
            tone="success"
            onClick={() => onNavigate('today')}
          />
          <StatCard
            label="ক্যাশ ব্যালেন্স"
            value={formatTaka(cashNow)}
            sublabel="এখন ক্যাশে"
            icon={<Wallet className="w-5 h-5" />}
            tone="primary"
            onClick={() => onNavigate('cash')}
          />
          <StatCard
            label="কাস্টমার বাকি"
            value={formatTaka(custDue)}
            sublabel={`${toBnDigits(customers.filter((c) => c.due > 0).length)} জন`}
            icon={<Users className="w-5 h-5" />}
            tone="warning"
            onClick={() => onNavigate('customers')}
          />
          <StatCard
            label="সাপ্লায়ার পাওনা"
            value={formatTaka(supPayable)}
            sublabel={`${toBnDigits(suppliers.filter((s) => s.payable > 0).length)} জন`}
            icon={<Building2 className="w-5 h-5" />}
            tone="danger"
            onClick={() => onNavigate('suppliers')}
          />
        </div>
      </div>

      {/* Alerts */}
      {pendingReminders > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-warning-500" />
            <h2 className="text-sm font-semibold text-ink-700">গুরুত্বপূর্ণ রিমাইন্ডার</h2>
          </div>
          <div className="card divide-y divide-ink-50">
            {reminders.filter((r) => !r.done).slice(0, 3).map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate('reminders')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left btn-press hover:bg-ink-50"
              >
                <div className="w-8 h-8 rounded-full bg-warning-100 grid place-items-center shrink-0">
                  <Bell className="w-4 h-4 text-warning-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{r.title}</p>
                  {r.amount && <p className="text-xs text-ink-400">{formatTaka(r.amount)}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's report mini */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-700">আজকের সারসংক্ষেপ</h2>
          <button onClick={() => onNavigate('reports')} className="text-xs font-medium text-primary-600">
            বিস্তারিত
          </button>
        </div>
        <div className="card p-4 space-y-3">
          <SummaryRow label="মোট বিক্রি" value={formatTaka(today.sales)} tone="text-success-600" />
          <SummaryRow label="মোট ক্রয়" value={formatTaka(today.purchases)} tone="text-warning-600" />
          <SummaryRow label="খরচ" value={formatTaka(today.expenses)} tone="text-danger-600" />
          <SummaryRow label="মালিক তুলেছেন" value={formatTaka(today.withdrawals)} tone="text-ink-500" />
          <div className="border-t border-ink-100 pt-3">
            <SummaryRow label="নগদ প্রবাহ" value={`${today.netCashIn >= today.netCashOut ? '+' : '−'}${formatTaka(Math.abs(today.netCashIn - today.netCashOut))}`} tone="text-primary-700" bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone, bold }: { label: string; value: string; tone: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-ink-800' : 'text-ink-500'}`}>{label}</span>
      <span className={`bangla-num ${bold ? 'font-bold' : 'font-semibold'} ${tone}`}>{value}</span>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 4) return 'শুভ রাত্রি';
  if (h < 12) return 'শুভ সকাল';
  if (h < 16) return 'শুভ দুপুর';
  if (h < 19) return 'শুভ বিকেল';
  return 'শুভ সন্ধ্যা';
}
