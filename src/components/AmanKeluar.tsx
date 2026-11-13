import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Plus, Trash2 } from 'lucide-react';
import { db } from '../db';

function vibrate(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // ignore unsupported environments
  }
}

export default function AmanKeluar({ onReadyChange }: { onReadyChange?: (ready: boolean) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const items = useLiveQuery(() => db.checklist.orderBy('order').toArray(), []) ?? [];

  const total = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const allReady = total > 0 && checkedCount === total;

  if (onReadyChange) {
    onReadyChange(allReady);
  }

  const toggleItem = async (id: number, current: boolean) => {
    vibrate(18);
    await db.checklist.update(id, { checked: !current });
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    vibrate(12);
    await db.checklist.add({ label: trimmed, checked: false, order: items.length });
    setNewLabel('');
  };

  const resetAll = async () => {
    vibrate(15);
    await db.checklist.toCollection().modify({ checked: false });
  };

  return (
    <div className="space-y-4">
      {allReady ? (
        <div className="rounded-3xl bg-emerald-500/15 border border-emerald-400/40 p-6 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Check className="w-8 h-8 stroke-[2.75]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-emerald-300">SIAP BERANGKAT</h2>
          <p className="text-sm text-emerald-200/80">Semua barang &amp; keamanan rumah sudah dicek.</p>
          <button
            type="button"
            onClick={resetAll}
            className="min-h-[48px] px-5 rounded-2xl bg-emerald-900/70 border border-emerald-500/30 text-emerald-200 text-xs font-semibold hover:bg-emerald-900 active:scale-95 transition"
          >
            Centang Ulang
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white">Cek 5 Detik Sebelum Pergi</h2>
            <p className="text-xs text-zinc-400">Ketuk kartu untuk menandai selesai</p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {checkedCount}/{total}
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => item.id !== undefined && toggleItem(item.id, item.checked)}
              className={`flex-1 min-h-[64px] px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition active:scale-[0.98] ${
                item.checked
                  ? allReady
                    ? 'bg-emerald-900/50 border-emerald-500/40 text-emerald-100'
                    : 'bg-zinc-900/80 border-emerald-500/50 text-zinc-200'
                  : 'bg-card border-borderline text-white hover:border-zinc-700'
              }`}
            >
              <span className={`text-base font-semibold ${item.checked ? 'line-through opacity-75' : ''}`}>
                {item.label}
              </span>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition ${
                  item.checked ? 'bg-emerald-500 text-black' : 'bg-zinc-900 border border-zinc-700 text-transparent'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
            <button
              type="button"
              aria-label="Hapus item"
              onClick={() => item.id !== undefined && db.checklist.delete(item.id)}
              className="min-w-[48px] min-h-[64px] rounded-2xl bg-card border border-borderline flex items-center justify-center text-zinc-500 hover:text-red-400 active:scale-95 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="pt-2 flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Tambah item cek (mis. Jas Hujan)..."
          required
          className="flex-1 min-h-[48px] px-4 rounded-2xl bg-card border border-borderline text-sm text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
        />
        <button
          type="submit"
          className="min-w-[56px] min-h-[48px] px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
