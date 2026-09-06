import { useState } from 'react';
import { useAppStore } from '@/store/StoreContext';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { formatTaka, toBnDigits } from '@/lib/format';
import { Package, Plus, AlertCircle, Boxes, Layers, Ban, Edit2, Trash2 } from 'lucide-react';
import type { Product, InventoryMode } from '@/types';

const MODE_META: Record<InventoryMode, { label: string; desc: string; icon: typeof Ban }> = {
  none: { label: 'কোনো স্টক নেই', desc: 'স্টক ট্র্যাক করবেন না', icon: Ban },
  approximate: { label: 'আনুমানিক', desc: 'পরিমাণ থাকলে রাখবেন', icon: Layers },
  full: { label: 'পূর্ণ স্টক', desc: 'প্রতিটি পণ্যের হিসাব', icon: Boxes },
};

export function InventoryScreen() {
  const { shop, products, addProduct, updateProduct, updateShop } = useAppStore((s) => ({
    shop: s.shop,
    products: s.products,
    addProduct: s.addProduct,
    updateProduct: s.updateProduct,
    updateShop: s.updateShop,
  }));

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [modeOpen, setModeOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [unit, setUnit] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [unitSize, setUnitSize] = useState('');

  const mode = shop?.inventoryMode ?? 'none';

  const resetForm = () => {
    setName(''); setAliases(''); setUnit(''); setStockQty(''); setCostPrice(''); setSalePrice(''); setUnitSize('');
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addProduct({
      shopId: 'shop-1',
      name: name.trim(),
      aliases: aliases.trim() ? aliases.split(',').map((a) => a.trim()).filter(Boolean) : [],
      unit: unit.trim() || undefined,
      stockQty: stockQty ? Number(stockQty) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      salePrice: salePrice ? Number(salePrice) : undefined,
      unitSize: unitSize ? Number(unitSize) : undefined,
    });
    resetForm();
    setAddOpen(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !name.trim()) return;
    await updateProduct(editTarget.id, {
      name: name.trim(),
      aliases: aliases.trim() ? aliases.split(',').map((a) => a.trim()).filter(Boolean) : [],
      unit: unit.trim() || undefined,
      stockQty: stockQty ? Number(stockQty) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      salePrice: salePrice ? Number(salePrice) : undefined,
      unitSize: unitSize ? Number(unitSize) : undefined,
    });
    resetForm();
    setEditTarget(null);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setName(p.name);
    setAliases(p.aliases.join(', '));
    setUnit(p.unit ?? '');
    setStockQty(p.stockQty !== undefined ? String(p.stockQty) : '');
    setCostPrice(p.costPrice !== undefined ? String(p.costPrice) : '');
    setSalePrice(p.salePrice !== undefined ? String(p.salePrice) : '');
    setUnitSize(p.unitSize !== undefined ? String(p.unitSize) : '');
  };

  const ModeIcon = MODE_META[mode].icon;

  return (
    <div className="max-w-md mx-auto pb-4">
      <div className="px-5 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">স্টক</h1>
          <p className="text-sm text-ink-400 mt-0.5">পণ্য ও মজুত</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-10 h-10 rounded-full bg-primary-700 grid place-items-center btn-press shadow-float"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Inventory mode banner */}
      <div className="px-5 mt-3">
        <button
          onClick={() => setModeOpen(true)}
          className="w-full bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center gap-3 btn-press"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 grid place-items-center shrink-0">
            <ModeIcon className="w-5 h-5 text-primary-700" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-primary-800">{MODE_META[mode].label}</p>
            <p className="text-xs text-primary-600">{MODE_META[mode].desc}</p>
          </div>
          <Edit2 className="w-4 h-4 text-primary-500" />
        </button>
      </div>

      {mode === 'none' && (
        <div className="px-5 mt-4">
          <div className="flex items-start gap-2 bg-accent-50 border border-accent-200 rounded-xl px-3 py-3">
            <AlertCircle className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
            <p className="text-xs text-accent-800">
              স্টক ট্র্যাকিং বন্ধ আছে। আপনি এখনো বিক্রি/ক্রয় লিখতে পারবেন — শুধু মজুতের হিসাব রাখা হবে না। চাইলে আনুমানিক বা পূর্ণ মোডে চালু করুন।
            </p>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="px-5 mt-4">
        {products.length === 0 ? (
          <EmptyState icon={<Package className="w-7 h-7" />} title="কোনো পণ্য নেই" message="পণ্য যোগ করতে উপরের + বোতামে চাপুন" />
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900 text-sm">{p.name}</p>
                    {p.aliases.length > 0 && (
                      <p className="text-xs text-ink-400 mt-0.5">ওরফে: {p.aliases.join(', ')}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.unit && (
                        <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                          একক: {p.unit}{p.unitSize ? ` (${toBnDigits(p.unitSize)} ${p.baseUnitName ?? 'পিস'})` : ''}
                        </span>
                      )}
                      {p.costPrice !== undefined && (
                        <span className="text-xs bg-warning-50 text-warning-600 px-2 py-0.5 rounded-full">
                          ক্রয়: {formatTaka(p.costPrice)}
                        </span>
                      )}
                      {p.salePrice !== undefined && (
                        <span className="text-xs bg-success-50 text-success-600 px-2 py-0.5 rounded-full">
                          বিক্রি: {formatTaka(p.salePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {mode !== 'none' && p.stockQty !== undefined ? (
                      <p className="text-lg font-bold text-primary-700 bangla-num">{toBnDigits(p.stockQty)}</p>
                    ) : mode !== 'none' ? (
                      <p className="text-xs text-ink-400">পরিমাণ নেই</p>
                    ) : null}
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-ink-100 btn-press">
                      <Edit2 className="w-4 h-4 text-ink-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit product sheet */}
      <Sheet
        open={addOpen || !!editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null); resetForm(); }}
        title={editTarget ? 'পণ্য এডিট' : 'নতুন পণ্য'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">পণ্যের নাম</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: পিয়াজ" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ওরফে / স্থানীয় নাম (কমা দিয়ে)</label>
            <input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="যেমন: পেজ, পেঁয়াজ" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-500 mb-1.5 block">একক</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="কেজি, লিটার..." className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 mb-1.5 block">এককে কয়টি</label>
              <input value={unitSize} onChange={(e) => setUnitSize(e.target.value)} type="number" placeholder="যেমন: ২০" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
            </div>
          </div>
          {mode !== 'none' && (
            <div>
              <label className="text-xs font-semibold text-ink-500 mb-1.5 block">মজুত পরিমাণ</label>
              <input value={stockQty} onChange={(e) => setStockQty(e.target.value)} type="number" placeholder="খালি রাখলে আনুমানিক" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-500 mb-1.5 block">ক্রয় মূল্য</label>
              <input value={costPrice} onChange={(e) => setCostPrice(e.target.value)} type="number" placeholder="৳" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 mb-1.5 block">বিক্রি মূল্য</label>
              <input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} type="number" placeholder="৳" className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 outline-none focus:ring-2 ring-primary-400 bangla-num" />
            </div>
          </div>
          <button
            onClick={editTarget ? handleEdit : handleAdd}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold btn-press hover:bg-primary-800 disabled:opacity-40"
          >
            {editTarget ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
        </div>
      </Sheet>

      {/* Mode selector sheet */}
      <Sheet open={modeOpen} onClose={() => setModeOpen(false)} title="স্টক মোড">
        <div className="space-y-3">
          {(Object.keys(MODE_META) as InventoryMode[]).map((m) => {
            const Icon = MODE_META[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={async () => {
                  await updateShop({ inventoryMode: m });
                  setModeOpen(false);
                }}
                className={`w-full card p-4 flex items-center gap-3 btn-press text-left ${active ? 'ring-2 ring-primary-400' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${active ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink-900 text-sm">{MODE_META[m].label}</p>
                  <p className="text-xs text-ink-400">{MODE_META[m].desc}</p>
                </div>
                {active && <div className="w-5 h-5 rounded-full bg-primary-600 grid place-items-center"><div className="w-2 h-2 rounded-full bg-white" /></div>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
