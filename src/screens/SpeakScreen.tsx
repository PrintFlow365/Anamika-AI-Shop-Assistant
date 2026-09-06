import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { Sheet } from '@/components/Sheet';
import { TRANSACTION_TYPE_META } from '@/types';
import type { TransactionType } from '@/types';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Mic, Square, AlertCircle, Volume2, Keyboard, Loader2, Check, X, Sparkles } from 'lucide-react';

interface ParsedTransaction {
  type: string;
  amount: number;
  paidAmount: number | null;
  dueAmount: number | null;
  partyId: string | null;
  partyName: string | null;
  isCustomer: boolean;
  notes: string | null;
  confident: boolean;
  summary: string;
}

interface SpeakScreenProps {
  onDone: () => void;
}

export function SpeakScreen({ onDone }: SpeakScreenProps) {
  const { addTransaction, shop, customers, suppliers, vocabulary, units } = useAppStore((s) => ({
    addTransaction: s.addTransaction,
    shop: s.shop,
    customers: s.customers,
    suppliers: s.suppliers,
    vocabulary: s.vocabulary,
    units: s.units,
  }));

  const { supported, state, transcript, errorMessage, errorKind, diagnosticInfo, start, stop, reset } =
    useSpeechRecognition('bn');

  const [manualOpen, setManualOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isListening = state === 'listening';
  const isStarting = state === 'starting';
  const isProcessing = state === 'processing';
  const isBusy = isListening || isStarting || isProcessing;

  const handleMicToggle = () => {
    if (isBusy) {
      stop();
    } else {
      reset();
      setParsed(null);
      setParseError(null);
      start();
    }
  };

  const parseTranscript = useCallback(async (text: string) => {
    if (!text.trim() || !shop) return;
    setParsing(true);
    setParseError(null);

    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(`${url}/functions/v1/parse-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          transcript: text,
          vocabulary: vocabulary.map((v) => ({ term: v.term, meaning: v.meaning })),
          units: units.map((u) => ({ unitName: u.unitName, piecesPerUnit: u.piecesPerUnit, baseUnitName: u.baseUnitName })),
          customers: customers.map((c) => ({ id: c.id, name: c.name })),
          suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.parsed as ParsedTransaction;

      if (!result || !result.type) {
        throw new Error('AI বাক্যটি বুঝতে পারেনি');
      }

      setParsed(result);
      setConfirmOpen(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'বিশ্লেষণ ব্যর্থ');
    } finally {
      setParsing(false);
    }
  }, [shop, vocabulary, units, customers, suppliers]);

  const handleConfirmSave = async () => {
    if (!parsed || !shop) return;
    setSaving(true);

    try {
      const txType = parsed.type as TransactionType;
      const isCustomerTx = ['SALE', 'CUSTOMER_PAYMENT', 'LOAN_GIVEN'].includes(txType);
      const isSupplierTx = ['PURCHASE', 'SUPPLIER_PAYMENT'].includes(txType);

      let customerId: string | undefined;
      let supplierId: string | undefined;

      if (isCustomerTx && parsed.partyId) {
        customerId = parsed.partyId;
      } else if (isSupplierTx && parsed.partyId) {
        supplierId = parsed.partyId;
      }

      await addTransaction({
        shopId: shop.id,
        datetime: new Date().toISOString(),
        type: txType,
        amount: parsed.amount,
        customerId,
        supplierId,
        paidAmount: parsed.paidAmount ?? undefined,
        dueAmount: parsed.dueAmount ?? undefined,
        source: 'voice',
        notes: parsed.notes || parsed.summary || undefined,
      });

      setConfirmOpen(false);
      setParsed(null);
      reset();
      onDone();
    } catch {
      setParseError('সংরক্ষণ ব্যর্থ। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setParsed(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-ink-900">কথা বলুন</h1>
        <p className="text-sm text-ink-400 mt-1">আপনার ব্যবসার কথা বলুন — আমি শুনে লিখে রাখব</p>
      </div>

      {!supported && (
        <div className="px-5 mt-3">
          <div className="flex items-start gap-2 bg-warning-50 border border-warning-200 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
            <p className="text-xs text-warning-800">
              <span className="font-semibold">মাইক্রোফোন সাপোর্ট নেই।</span> এই ব্রাউজারে ভয়েস রিকগনিশন কাজ করবে না। নিচে হাতে লিখে এন্ট্রি করুন।
            </p>
          </div>
        </div>
      )}

      <div className="px-5 py-8">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleMicToggle}
            disabled={!supported || parsing}
            className={`relative w-28 h-28 rounded-full grid place-items-center btn-press transition-all disabled:cursor-not-allowed ${
              isListening ? 'bg-danger-500' : 'bg-primary-700'
            } ${!supported || parsing ? 'opacity-60' : ''}`}
          >
            {(isListening || isStarting || isProcessing) && (
              <>
                <div className="absolute inset-0 rounded-full bg-danger-500/40 animate-pulse-ring" />
                <div className="absolute inset-0 rounded-full bg-danger-500/30 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
              </>
            )}
            {parsing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isListening ? (
              <Square className="w-10 h-10 text-white" fill="white" />
            ) : (
              <Mic className="w-12 h-12 text-white" strokeWidth={2.5} />
            )}
          </button>

          <div className="flex items-center gap-2">
            {parsing ? (
              <>
                <Sparkles className="w-4 h-4 text-primary-500" />
                <p className="text-sm font-semibold text-primary-600">AI বিশ্লেষণ করছে...</p>
              </>
            ) : isListening ? (
              <>
                <span className="flex h-2.5 w-2.5 rounded-full bg-danger-500 animate-pulse" />
                <p className="text-sm font-semibold text-danger-600">শুনছি... থামাতে চাপুন</p>
              </>
            ) : isProcessing ? (
              <p className="text-sm font-semibold text-primary-600">লেখা হচ্ছে...</p>
            ) : isStarting ? (
              <p className="text-sm font-semibold text-primary-600">শুরু হচ্ছে...</p>
            ) : state === 'error' ? (
              <p className="text-sm font-semibold text-warning-600">সমস্যা হয়েছে — আবার চেষ্টা করুন</p>
            ) : supported ? (
              <>
                <Volume2 className="w-4 h-4 text-ink-400" />
                <p className="text-sm font-medium text-ink-500">বোতামে চাপ দিয়ে কথা বলুন</p>
              </>
            ) : (
              <p className="text-sm font-medium text-ink-400">ভয়েস সাপোর্ট নেই</p>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="px-5 mt-1">
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border ${
            errorKind === 'permission'
              ? 'bg-danger-50 border-danger-200'
              : 'bg-warning-50 border-warning-200'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
              errorKind === 'permission' ? 'text-danger-600' : 'text-warning-600'
            }`} />
            <p className={`text-xs ${
              errorKind === 'permission' ? 'text-danger-800' : 'text-warning-800'
            }`}>{errorMessage}</p>
          </div>
          {diagnosticInfo && (
            <p className="text-[10px] text-ink-300 mt-1.5 px-1 font-mono">{diagnosticInfo}</p>
          )}
        </div>
      )}

      {transcript && (
        <div className="px-5 mt-4">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary-200 grid place-items-center">
                <Mic className="w-3.5 h-3.5 text-primary-700" />
              </div>
              <p className="text-xs font-semibold text-primary-700">চেনা কথা</p>
              <button
                onClick={() => { reset(); setParsed(null); setParseError(null); }}
                className="ml-auto text-xs text-ink-400 hover:text-ink-600 font-medium"
              >
                মুছুন
              </button>
            </div>
            <p className="text-lg text-ink-800 leading-relaxed">
              {transcript}
            </p>
          </div>

          {!isListening && !parsing && !parsed && !parseError && (
            <button
              onClick={() => parseTranscript(transcript)}
              className="w-full mt-3 py-3 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI দিয়ে বিশ্লেষণ করুন
            </button>
          )}

          {parseError && (
            <div className="mt-3 flex items-start gap-2 bg-danger-50 border border-danger-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-danger-800">{parseError}</p>
                <button
                  onClick={() => { setParseError(null); parseTranscript(transcript); }}
                  className="text-xs text-primary-600 font-medium mt-1"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            </div>
          )}

          {!isListening && !parsing && !parseError && !parsed && (
            <p className="text-xs text-ink-400 mt-2 text-center">
              এই লেখাটি AI দিয়ে বিশ্লেষণ করে লেনদেন তৈরি করা হবে
            </p>
          )}
        </div>
      )}

      <div className="px-5 mt-5">
        <p className="text-xs font-semibold text-ink-400 mb-2">উদাহরণ বাক্য:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'রহিমকে ৫০০ টাকার মাল দিলাম',
            'করিমের কাছ থেকে ৩০০ টাকা পেলাম',
            'আজ ২ হাজার টাকা বিক্রি',
            'বিকাশে ৫০০ টাকা নিলাম',
          ].map((sentence, i) => (
            <span
              key={i}
              className="text-xs bg-ink-50 border border-ink-100 rounded-full px-3 py-1.5 text-ink-500"
            >
              {sentence}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <button
          onClick={() => setManualOpen(true)}
          className="w-full card p-4 flex items-center gap-3 btn-press hover:shadow-soft"
        >
          <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
            <Keyboard className="w-5 h-5 text-ink-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-ink-800 text-sm">নিজে লিখুন</p>
            <p className="text-xs text-ink-400">ভয়েস ছাড়া হাতে এন্ট্রি করুন</p>
          </div>
        </button>
      </div>

      <ManualEntrySheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSaved={() => { setManualOpen(false); onDone(); }}
      />

      <Sheet open={confirmOpen} onClose={handleCancelConfirm} title="AI বিশ্লেষণ ফলাফল">
        {parsed && (
          <div className="space-y-4">
            <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 ${
              parsed.confident
                ? 'bg-success-50 border border-success-200'
                : 'bg-warning-50 border border-warning-200'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                parsed.confident ? 'text-success-600' : 'text-warning-600'
              }`} />
              <p className={`text-xs ${parsed.confident ? 'text-success-800' : 'text-warning-800'}`}>
                {parsed.confident
                  ? 'AI নিশ্চিত যে বাক্যটি সঠিকভাবে বুঝেছে'
                  : 'AI এই বাক্যটি সম্পূর্ণ নিশ্চিত নয়। তথ্য ঠিক আছে কিনা দেখে নিন।'}
              </p>
            </div>

            <div className="bg-ink-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">ধরন</span>
                <span className="text-sm font-semibold text-ink-800">
                  {TRANSACTION_TYPE_META[parsed.type as TransactionType]?.labelBn || parsed.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">পরিমাণ</span>
                <span className="text-sm font-semibold text-ink-800 bangla-num">৳{parsed.amount.toLocaleString('bn-BD')}</span>
              </div>
              {parsed.paidAmount != null && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-400">দেওয়া হয়েছে</span>
                  <span className="text-sm font-semibold text-ink-800 bangla-num">৳{parsed.paidAmount.toLocaleString('bn-BD')}</span>
                </div>
              )}
              {parsed.dueAmount != null && parsed.dueAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-400">বাকি</span>
                  <span className="text-sm font-semibold text-warning-600 bangla-num">৳{parsed.dueAmount.toLocaleString('bn-BD')}</span>
                </div>
              )}
              {parsed.partyName && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-400">{parsed.isCustomer ? 'কাস্টমার' : 'সাপ্লায়ার'}</span>
                  <span className="text-sm font-semibold text-ink-800">{parsed.partyName}</span>
                </div>
              )}
              {parsed.notes && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-400">মন্তব্য</span>
                  <span className="text-sm text-ink-700">{parsed.notes}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-ink-400 text-center">{parsed.summary}</p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-ink-100 text-ink-700 font-semibold btn-press hover:bg-ink-200 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                বাতিল
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function ManualEntrySheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { addTransaction, customers, suppliers, shop } = useAppStore((s) => ({
    addTransaction: s.addTransaction,
    customers: s.customers,
    suppliers: s.suppliers,
    shop: s.shop,
  }));

  const [type, setType] = useState<TransactionType>('SALE');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [partyId, setPartyId] = useState('');
  const [notes, setNotes] = useState('');

  const requiresParty = ['SALE', 'CUSTOMER_PAYMENT', 'LOAN_GIVEN'].includes(type);
  const requiresSupplier = ['PURCHASE', 'SUPPLIER_PAYMENT'].includes(type);
  const partyList = requiresParty ? customers : requiresSupplier ? suppliers : [];

  const handleSave = async () => {
    if (!shop || !amount) return;
    const amt = Number(amount);
    const paid = paidAmount ? Number(paidAmount) : type === 'SALE' || type === 'PURCHASE' ? amt : amt;
    const due = (type === 'SALE' || type === 'PURCHASE') ? Math.max(0, amt - paid) : 0;
    await addTransaction({
      shopId: shop.id,
      datetime: new Date().toISOString(),
      type,
      amount: amt,
      customerId: requiresParty ? partyId || undefined : undefined,
      supplierId: requiresSupplier ? partyId || undefined : undefined,
      paidAmount: paid || undefined,
      dueAmount: due || undefined,
      source: 'manual',
      notes: notes || undefined,
    });
    setType('SALE');
    setAmount('');
    setPaidAmount('');
    setPartyId('');
    setNotes('');
    onSaved();
  };

  const typeOptions: TransactionType[] = ['SALE', 'PURCHASE', 'CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'EXPENSE', 'OWNER_WITHDRAWAL', 'LOAN_GIVEN', 'DAMAGE_LOSS'];

  return (
    <Sheet open={open} onClose={onClose} title="নতুন এন্ট্রি">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ধরন</label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium btn-press ${type === t ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600'}`}
              >
                {TRANSACTION_TYPE_META[t].labelBn}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-500 mb-1.5 block">টাকার পরিমাণ</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="০"
            className="w-full text-2xl font-bold text-ink-900 bg-ink-50 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary-400 bangla-num"
          />
        </div>

        {(type === 'SALE' || type === 'PURCHASE') && (
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">যা দিয়েছেন</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="পুরো টাকা দিলে খালি রাখুন"
              className="w-full text-lg font-semibold text-ink-700 bg-ink-50 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary-400 bangla-num"
            />
          </div>
        )}

        {(requiresParty || requiresSupplier) && partyList.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">
              {requiresParty ? 'কাস্টমার' : 'সাপ্লায়ার'}
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400"
            >
              <option value="">নির্বাচন করুন</option>
              {partyList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-ink-500 mb-1.5 block">মন্তব্য</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ঐচ্ছিক..."
            rows={2}
            className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm text-ink-700 outline-none focus:ring-2 ring-primary-400 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!amount}
          className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
        >
          সংরক্ষণ করুন
        </button>
      </div>
    </Sheet>
  );
}
