import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { formatTaka, formatBnDate, toBnDigits, todayISODate } from '@/lib/format';
import { Bell, Plus, Check, BellOff, Clock, ChevronRight } from 'lucide-react';

export function RemindersScreen() {
  const { reminders, customers, suppliers, addReminder, toggleReminder } = useAppStore((s) => ({
    reminders: s.reminders,
    customers: s.customers,
    suppliers: s.suppliers,
    addReminder: s.addReminder,
    toggleReminder: s.toggleReminder,
  }));

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayISODate());
  const [amount, setAmount] = useState('');

  const today = todayISODate();
  const pending = reminders.filter((r) => !r.done);
  const overdue = pending.filter((r) => r.dueDate < today);
  const todayReminders = pending.filter((r) => r.dueDate === today);
  const upcoming = pending.filter((r) => r.dueDate > today);
  const done = reminders.filter((r) => r.done);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addReminder({
      shopId: 'shop-1',
      title: title.trim(),
      dueDate,
      done: false,
      amount: amount ? Number(amount) : undefined,
    });
    setTitle('');
    setAmount('');
    setDueDate(todayISODate());
    setAddOpen(false);
  };

  const partyName = (r: typeof reminders[0]) => {
    if (r.customerId) return customers.find((c) => c.id === r.customerId)?.name;
    if (r.supplierId) return suppliers.find((s) => s.id === r.supplierId)?.name;
    return undefined;
  };

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">রিমাইন্ডার</h1>
          <p className="text-sm text-ink-400 mt-0.5">{toBnDigits(pending.length)} টি বাকি</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-10 h-10 rounded-full bg-primary-700 grid place-items-center btn-press shadow-float"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="px-5 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-danger-500" />
            <h2 className="text-sm font-semibold text-danger-600">মেয়াদ পার হয়েছে</h2>
          </div>
          <div className="space-y-2">
            {overdue.map((r) => (
              <ReminderCard key={r.id} reminder={r} partyName={partyName(r)} onToggle={() => toggleReminder(r.id, true)} overdue />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {todayReminders.length > 0 && (
        <div className="px-5 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-warning-500" />
            <h2 className="text-sm font-semibold text-ink-700">আজকের রিমাইন্ডার</h2>
          </div>
          <div className="space-y-2">
            {todayReminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} partyName={partyName(r)} onToggle={() => toggleReminder(r.id, true)} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="px-5 mt-3">
          <h2 className="text-sm font-semibold text-ink-700 mb-2">আসছে</h2>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <ReminderCard key={r.id} reminder={r} partyName={partyName(r)} onToggle={() => toggleReminder(r.id, true)} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="text-sm font-semibold text-ink-400 mb-2">সম্পন্ন ({toBnDigits(done.length)})</h2>
          <div className="space-y-2">
            {done.map((r) => (
              <ReminderCard key={r.id} reminder={r} partyName={partyName(r)} onToggle={() => toggleReminder(r.id, false)} done />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {reminders.length === 0 && (
        <EmptyState icon={<BellOff className="w-7 h-7" />} title="কোনো রিমাইন্ডার নেই" message="বাকি টাকা বা কাজ মনে করাতে রিমাইন্ডার যোগ করুন" />
      )}

      {/* Add sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="নতুন রিমাইন্ডার">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">কী মনে করাবেন</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: রহিমের কাছ থেকে টাকা নিতে" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">তারিখ</label>
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">টাকার পরিমাণ (ঐচ্ছিক)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="৳" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
          >
            যোগ করুন
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function ReminderCard({ reminder, partyName, onToggle, overdue, done }: {
  reminder: { id: string; title: string; dueDate: string; amount?: number; done: boolean };
  partyName?: string;
  onToggle: () => void;
  overdue?: boolean;
  done?: boolean;
}) {
  return (
    <div className={`card p-3 flex items-center gap-3 ${done ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-7 h-7 rounded-full border-2 grid place-items-center shrink-0 btn-press ${done ? 'bg-success-500 border-success-500' : overdue ? 'border-danger-400' : 'border-ink-300'}`}
      >
        {done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-ink-800 ${done ? 'line-through' : ''}`}>{reminder.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {partyName && <span className="text-xs text-ink-400">{partyName}</span>}
          <span className={`text-xs ${overdue ? 'text-danger-500 font-medium' : 'text-ink-400'}`}>{formatBnDate(reminder.dueDate)}</span>
        </div>
      </div>
      {reminder.amount && (
        <p className="text-sm font-bold text-ink-700 bangla-num shrink-0">{formatTaka(reminder.amount)}</p>
      )}
    </div>
  );
}
