import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PenLine, ShieldCheck, X } from 'lucide-react';
import { db, getLocalDateStr } from '../db';

export default function BreathingDoor() {
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [done, setDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scratchText, setScratchText] = useState('');
  const [saveLabel, setSaveLabel] = useState('Tersimpan otomatis di perangkat');

  const reflekRec = useLiveQuery(() => db.meta.get('reflekCount'), []);
  const reflekCount = typeof reflekRec?.value === 'number' ? reflekRec.value : 0;

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDone(true);
          try {
            navigator.vibrate?.(25);
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [done]);

  const openScratchpad = async () => {
    const rec = await db.meta.get('scratchpad');
    setScratchText(typeof rec?.value === 'string' ? rec.value : '');
    setSaveLabel('Tersimpan otomatis di perangkat');
    setModalOpen(true);
  };

  const handleScratchChange = async (val: string) => {
    setScratchText(val);
    setSaveLabel('Menyimpan...');
    await db.meta.put({ key: 'scratchpad', value: val });
    setSaveLabel('Tersimpan otomatis di perangkat');
  };

  const handleFinish = async () => {
    try {
      navigator.vibrate?.(20);
    } catch {
      // ignore
    }
    await db.meta.put({ key: 'reflekCount', value: reflekCount + 1 });
    await db.meta.put({ key: 'reflekDate', value: getLocalDateStr() });
    setConfirmed(true);
  };

  const replay = () => {
    setSecondsLeft(8);
    setDone(false);
    setConfirmed(false);
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-2 py-6 space-y-8">
      <div className="space-y-2 max-w-xs">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Jeda 8 Detik</p>
        <h2 className="text-xl font-bold text-white leading-snug">
          Tarik napas dulu.
          <br />
          Buka HP mau cari apa?
        </h2>
      </div>

      <div className="relative flex items-center justify-center w-52 h-52">
        <div
          className={`w-44 h-44 rounded-full border-2 border-zinc-400/50 bg-zinc-950 flex flex-col items-center justify-center transition-all duration-500 ${
            done ? '' : 'breathe-active'
          }`}
        >
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {done ? 'Selesai' : `${secondsLeft}d`}
          </span>
          <span className="text-xs text-zinc-400 mt-1 px-4">
            {done
              ? 'Sekarang putuskan dengan sadar'
              : secondsLeft > 4
                ? 'Tarik napas perlahan...'
                : 'Hembuskan perlahan...'}
          </span>
        </div>
      </div>

      {confirmed ? (
        <div className="w-full max-w-xs p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
          <p className="text-sm font-semibold text-emerald-400">Bagus! Reflek doomscroll berhasil ditahan.</p>
          <p className="text-xs text-zinc-400">
            Total hari ini: <strong className="text-white">{reflekCount}x</strong> Reflek Tertahan.
          </p>
          <button
            type="button"
            onClick={replay}
            className="w-full min-h-[48px] rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 active:scale-95 transition"
          >
            Ulangi Jeda 8 Detik
          </button>
        </div>
      ) : (
        <div
          className={`w-full max-w-xs space-y-3 transition-all duration-500 ${
            done ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
          }`}
        >
          <button
            type="button"
            onClick={openScratchpad}
            className="w-full min-h-[52px] px-5 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition"
          >
            <PenLine className="w-4 h-4" />
            Catat Ide Cepat
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="w-full min-h-[52px] px-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Selesai &amp; Tutup
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 text-left">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Catat Ide Cepat</h3>
                <p className="text-xs text-emerald-400 mt-0.5">{saveLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Tutup catatan"
                onClick={() => setModalOpen(false)}
                className="min-w-[48px] min-h-[48px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              rows={6}
              value={scratchText}
              onChange={(e) => handleScratchChange(e.target.value)}
              placeholder="Tulis ide, tugas, atau hal yang tadi mau dicari..."
              className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-2xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-none"
            />
            <div className="mt-3 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => handleScratchChange('')}
                className="min-h-[48px] px-4 rounded-xl bg-zinc-900 text-zinc-400 text-sm font-medium hover:text-red-400 active:scale-95 transition"
              >
                Kosongkan
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[48px] px-5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
