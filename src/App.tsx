import { useEffect, useRef, useState } from 'react';
import { CheckSquare, History, MapPin, Pocket, Wind } from 'lucide-react';
import { ensureSeedAndDailyReset } from './db';
import AmanKeluar from './components/AmanKeluar';
import BreathingDoor from './components/BreathingDoor';
import KapanTerakhir from './components/KapanTerakhir';
import ParkirSimpan from './components/ParkirSimpan';

type TabKey = 'keluar' | 'napas' | 'terakhir' | 'simpan';
const VALID_TABS: TabKey[] = ['keluar', 'napas', 'terakhir', 'simpan'];

function getInitialTab(): TabKey {
  const param = new URLSearchParams(window.location.search).get('tab') as TabKey | null;
  return param && VALID_TABS.includes(param) ? param : 'keluar';
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>(getInitialTab);
  const [allDepartReady, setAllDepartReady] = useState(false);
  const [undoToast, setUndoToast] = useState<{ message: string; action: () => Promise<void> } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    ensureSeedAndDailyReset().then(() => setReady(true));
  }, []);

  const switchTab = (next: TabKey) => {
    setTab(next);
    if (next !== 'keluar') setAllDepartReady(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const showUndo = (message: string, action: () => Promise<void>) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoToast({ message, action });
    undoTimerRef.current = window.setTimeout(() => setUndoToast(null), 4000);
  };

  const handleUndoClick = async () => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    const current = undoToast;
    setUndoToast(null);
    if (current) await current.action();
  };

  const isEmerald = tab === 'keluar' && allDepartReady;

  return (
    <div className="bg-black text-zinc-100 min-h-screen flex justify-center">
      <div
        className={`w-full max-w-md min-h-screen flex flex-col relative transition-colors duration-500 ${
          isEmerald ? 'bg-emerald-950' : 'bg-black'
        }`}
      >
        <header
          className={`sticky top-0 z-20 px-4 pt-4 pb-3 backdrop-blur-md border-b flex items-center justify-between transition-colors duration-500 ${
            isEmerald ? 'bg-emerald-950/90 border-emerald-800/60' : 'bg-black/85 border-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Pocket className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">Saku</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Offline-first Micro-Utility</p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
            PWA Lokal
          </span>
        </header>

        <main className="flex-1 px-4 pt-4 pb-28 overflow-y-auto">
          {!ready ? (
            <div className="py-12 text-center text-sm text-zinc-500">Memuat Saku...</div>
          ) : (
            <>
              {tab === 'keluar' && <AmanKeluar onReadyChange={setAllDepartReady} />}
              {tab === 'napas' && <BreathingDoor />}
              {tab === 'terakhir' && <KapanTerakhir onShowUndo={showUndo} />}
              {tab === 'simpan' && <ParkirSimpan />}
            </>
          )}
        </main>

        {undoToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <span className="text-sm font-medium truncate">{undoToast.message}</span>
            <button
              type="button"
              onClick={handleUndoClick}
              className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 active:scale-95 transition"
            >
              Undo
            </button>
          </div>
        )}

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-black/95 backdrop-blur-md border-t border-zinc-900 safe-bottom">
          <div className="grid grid-cols-4 gap-1 px-2 pt-1.5 pb-1">
            {[
              { id: 'keluar' as TabKey, label: 'Keluar', Icon: CheckSquare },
              { id: 'napas' as TabKey, label: 'Napas', Icon: Wind },
              { id: 'terakhir' as TabKey, label: 'Terakhir', Icon: History },
              { id: 'simpan' as TabKey, label: 'Simpan', Icon: MapPin }
            ].map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id)}
                  className={`min-h-[52px] rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                    active ? 'bg-zinc-900 text-white' : 'text-zinc-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
