import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../db';

function formatDaysAgo(ts: number): string {
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const then = new Date(ts);
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const diffDays = Math.round((startNow - startThen) / 86400000);
  if (diffDays <= 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return `${diffDays} hari lalu`;
}

export default function KapanTerakhir({
  onShowUndo
}: {
  onShowUndo: (message: string, undoAction: () => Promise<void>) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const habits = useLiveQuery(() => db.habits.toArray(), []) ?? [];

  const handleReset = async (id: number, prevTs: number, title: string) => {
    try {
      navigator.vibrate?.(15);
    } catch {
      // ignore
    }
    await db.habits.update(id, { lastDoneAt: Date.now() });
    onShowUndo(`"${title}" direset ke Hari ini`, async () => {
      await db.habits.update(id, { lastDoneAt: prevTs });
    });
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await db.habits.add({ title: trimmed, lastDoneAt: Date.now() });
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-white">Kapan Terakhir Kali?</h2>
        <p className="text-xs text-zinc-400">Satu ketukan untuk mereset waktu ke hari ini</p>
      </div>

      <div className="space-y-2.5">
        {habits.map((h) => {
          const label = formatDaysAgo(h.lastDoneAt);
          const isToday = label === 'Hari ini';
          return (
            <div
              key={h.id}
              className="p-4 rounded-2xl bg-card border border-borderline flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white truncate">{h.title}</h3>
                <p className={`text-xs mt-1 ${isToday ? 'text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                  {label}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => h.id !== undefined && handleReset(h.id, h.lastDoneAt, h.title)}
                  className="min-h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-800 active:scale-95 transition"
                >
                  Reset
                </button>
                <button
                  type="button"
                  aria-label="Hapus aktivitas"
                  onClick={() => h.id !== undefined && db.habits.delete(h.id)}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 active:scale-95 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAdd} className="pt-2 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tambah aktivitas (mis. Ganti Oli Motor)..."
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
