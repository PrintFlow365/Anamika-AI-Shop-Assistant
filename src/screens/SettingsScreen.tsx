import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { useAuth } from '@/auth/AuthContext';
import { Sheet } from '@/components/Sheet';
import { formatBnDate } from '@/lib/format';
import { Settings as SettingsIcon, Store, BookOpen, Ruler, Info, Plus, Trash2, ChevronRight, Volume2, LogOut } from 'lucide-react';
import type { InventoryMode } from '@/types';

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { shop, vocabulary, units, updateShop, addVocabulary, deleteVocabulary, addUnit, deleteUnit } = useAppStore((s) => ({
    shop: s.shop,
    vocabulary: s.vocabulary,
    units: s.units,
    updateShop: s.updateShop,
    addVocabulary: s.addVocabulary,
    deleteVocabulary: s.deleteVocabulary,
    addUnit: s.addUnit,
    deleteUnit: s.deleteUnit,
  }));

  const [shopOpen, setShopOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const [shopName, setShopName] = useState(shop?.name ?? '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName ?? '');
  const [phone, setPhone] = useState(shop?.phone ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [openingCash, setOpeningCash] = useState(shop ? String(shop.openingCash) : '5000');

  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');

  const [unitName, setUnitName] = useState('');
  const [piecesPerUnit, setPiecesPerUnit] = useState('');
  const [baseUnitName, setBaseUnitName] = useState('');

  const mode = shop?.inventoryMode ?? 'none';

  const handleSaveShop = async () => {
    await updateShop({
      name: shopName.trim() || 'আমার দোকান',
      ownerName: ownerName.trim() || 'মালিক',
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      openingCash: Number(openingCash) || 0,
    });
    setShopOpen(false);
  };

  const handleAddVocab = async () => {
    if (!term.trim() || !meaning.trim()) return;
    await addVocabulary({ shopId: 'shop-1', term: term.trim(), meaning: meaning.trim() });
    setTerm('');
    setMeaning('');
  };

  const handleAddUnit = async () => {
    if (!unitName.trim() || !piecesPerUnit) return;
    await addUnit({
      shopId: 'shop-1',
      unitName: unitName.trim(),
      piecesPerUnit: Number(piecesPerUnit),
      baseUnitName: baseUnitName.trim() || undefined,
    });
    setUnitName('');
    setPiecesPerUnit('');
    setBaseUnitName('');
  };

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-ink-900">সেটিংস</h1>
        <p className="text-sm text-ink-400 mt-0.5">দোকান ও ভাষা সেটআপ</p>
      </div>

      <div className="px-5 mt-4">
        <button
          onClick={() => {
            setShopName(shop?.name ?? '');
            setOwnerName(shop?.ownerName ?? '');
            setPhone(shop?.phone ?? '');
            setAddress(shop?.address ?? '');
            setOpeningCash(shop ? String(shop.openingCash) : '5000');
            setShopOpen(true);
          }}
          className="w-full card p-4 flex items-center gap-3 btn-press hover:shadow-soft text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 grid place-items-center shrink-0">
            <Store className="w-5 h-5 text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 text-sm">{shop?.name ?? '—'}</p>
            <p className="text-xs text-ink-400">{shop?.ownerName ?? '—'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
        </button>
      </div>

      <div className="px-5 mt-3">
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink-700 mb-2">স্টক মোড</p>
          <div className="flex gap-2">
            {([
              { key: 'none' as const, label: 'বন্ধ' },
              { key: 'approximate' as const, label: 'আনুমানিক' },
              { key: 'full' as const, label: 'পূর্ণ' },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => updateShop({ inventoryMode: m.key as InventoryMode })}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold btn-press ${mode === m.key ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-ink-700">ভোকাবুলারি</h2>
          </div>
          <button onClick={() => setVocabOpen(true)} className="text-xs font-medium text-primary-600">+ যোগ</button>
        </div>
        <p className="text-xs text-ink-400 mb-3">স্থানীয় শব্দের অর্থ শেখান। যেমন: "পেজ" = "পিয়াজ"</p>
        {vocabulary.length === 0 ? (
          <div className="bg-ink-50 rounded-xl p-4 text-center">
            <p className="text-sm text-ink-400">এখনো কোনো শব্দ যোগ করা হয়নি</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vocabulary.map((v) => (
              <div key={v.id} className="card p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-ink-900">{v.term}</span>
                    <span className="text-ink-400 mx-1.5">=</span>
                    <span className="text-ink-700">{v.meaning}</span>
                  </p>
                </div>
                <button onClick={() => deleteVocabulary(v.id)} className="p-1.5 rounded-lg hover:bg-danger-50 btn-press">
                  <Trash2 className="w-4 h-4 text-danger-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-ink-700">কাস্টম একক</h2>
          </div>
          <button onClick={() => setUnitOpen(true)} className="text-xs font-medium text-primary-600">+ যোগ</button>
        </div>
        <p className="text-xs text-ink-400 mb-3">ব্যবসায়িক একক নির্ধারণ করুন। যেমন: ১ বিড়া = ২০ পিস</p>
        {units.length === 0 ? (
          <div className="bg-ink-50 rounded-xl p-4 text-center">
            <p className="text-sm text-ink-400">এখনো কোনো একক যোগ করা হয়নি</p>
          </div>
        ) : (
          <div className="space-y-2">
            {units.map((u) => (
              <div key={u.id} className="card p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-ink-900">১ {u.unitName}</span>
                    <span className="text-ink-400 mx-1.5">=</span>
                    <span className="text-ink-700">{u.piecesPerUnit} {u.baseUnitName ?? 'পিস'}</span>
                  </p>
                </div>
                <button onClick={() => deleteUnit(u.id)} className="p-1.5 rounded-lg hover:bg-danger-50 btn-press">
                  <Trash2 className="w-4 h-4 text-danger-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => signOut()}
          className="w-full card p-4 flex items-center gap-3 btn-press hover:shadow-soft text-left"
        >
          <div className="w-10 h-10 rounded-full bg-danger-100 grid place-items-center shrink-0">
            <LogOut className="w-5 h-5 text-danger-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink-900 text-sm">সাইন আউট</p>
            <p className="text-xs text-ink-400">অ্যাকাউন্ট থেকে বের হন</p>
          </div>
        </button>
      </div>

      {shop && (
        <p className="text-xs text-ink-300 text-center mt-6 px-5">
          দোকান তৈরি: {formatBnDate(shop.createdAt)}
        </p>
      )}

      <Sheet open={shopOpen} onClose={() => setShopOpen(false)} title="দোকানের তথ্য">
        <div className="space-y-4">
          <Field label="দোকানের নাম" value={shopName} onChange={setShopName} placeholder="যেমন: মোবারক স্টোর" />
          <Field label="মালিকের নাম" value={ownerName} onChange={setOwnerName} placeholder="যেমন: মোবারক হোসেন" />
          <Field label="ফোন" value={phone} onChange={setPhone} placeholder="০১৭xxxxxxxx" />
          <Field label="ঠিকানা" value={address} onChange={setAddress} placeholder="গ্রাম, উপজেলা" />
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">শুরুর ক্যাশ</label>
            <input value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} type="number" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
          </div>
          <button onClick={handleSaveShop} className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800">
            সংরক্ষণ করুন
          </button>
        </div>
      </Sheet>

      <Sheet open={vocabOpen} onClose={() => setVocabOpen(false)} title="নতুন শব্দ">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">স্থানীয় শব্দ</label>
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="যেমন: পেজ" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">অর্থ</label>
            <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="যেমন: পিয়াজ" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <button onClick={handleAddVocab} disabled={!term.trim() || !meaning.trim()} className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40">
            যোগ করুন
          </button>
        </div>
      </Sheet>

      <Sheet open={unitOpen} onClose={() => setUnitOpen(false)} title="নতুন একক">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">এককের নাম</label>
            <input value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="যেমন: বিড়া" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">কয়টি পিস এক এককে</label>
            <input value={piecesPerUnit} onChange={(e) => setPiecesPerUnit(e.target.value)} type="number" placeholder="যেমন: ২০" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
          </div>
          <Field label="মূল এককের নাম (ঐচ্ছিক)" value={baseUnitName} onChange={setBaseUnitName} placeholder="যেমন: পিস" />
          <button onClick={handleAddUnit} disabled={!unitName.trim() || !piecesPerUnit} className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40">
            যোগ করুন
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink-500 mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
    </div>
  );
}
