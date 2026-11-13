import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Archive, ArrowRight, Camera, Car, CheckCircle2, Plus, Search, Trash2 } from 'lucide-react';
import { db } from '../db';

function formatRelativeTime(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.floor(diffHour / 24)} hari lalu`;
}

function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca gambar'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gambar tidak valid'));
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Gagal kompresi'))),
          'image/jpeg',
          quality
        );
      };
      img.src = String(ev.target?.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

export default function ParkirSimpan() {
  const [note, setNote] = useState('');
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemLocation, setItemLocation] = useState('');

  const parking = useLiveQuery(() => db.parking.get('active'), []);
  const items = useLiveQuery(() => db.items.orderBy('updatedAt').reverse().toArray(), []) ?? [];

  useEffect(() => {
    if (!parking?.photoBlob) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(parking.photoBlob);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [parking]);

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setPendingBlob(compressed);
    } catch {
      setPendingBlob(file);
    }
  };

  const saveParking = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !pendingBlob) return;
    await db.parking.put({
      id: 'active',
      note: note.trim(),
      photoBlob: pendingBlob,
      savedAt: Date.now()
    });
    setNote('');
    setPendingBlob(null);
  };

  const clearParking = async () => {
    await db.parking.delete('active');
    setPendingBlob(null);
  };

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemLocation.trim()) return;
    await db.items.add({
      name: itemName.trim(),
      location: itemLocation.trim(),
      updatedAt: Date.now()
    });
    setItemName('');
    setItemLocation('');
  };

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => it.name.toLowerCase().includes(q) || it.location.toLowerCase().includes(q))
    : items;

  return (
    <div className="space-y-6">
      <section className="p-4 rounded-3xl bg-card border border-borderline space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Spot Parkir Aktif</h2>
          </div>
          {parking && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {formatRelativeTime(parking.savedAt)}
            </span>
          )}
        </div>

        {parking ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-black border border-zinc-800">
              <p className="text-base font-semibold text-white">
                {parking.note || 'Foto spot parkir tersimpan'}
              </p>
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Foto spot parkir"
                className="w-full max-h-56 object-cover rounded-2xl border border-zinc-800"
              />
            )}
            <button
              type="button"
              onClick={clearParking}
              className="w-full min-h-[52px] rounded-2xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              Sudah Diambil
            </button>
          </div>
        ) : (
          <form onSubmit={saveParking} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catat lokasi (mis. Lantai P2, tiang B4)"
                className="flex-1 min-h-[48px] px-4 rounded-2xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
              />
              <label className="min-w-[52px] min-h-[48px] px-3 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 cursor-pointer hover:bg-zinc-800 active:scale-95 transition">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
            {pendingBlob && (
              <div className="text-xs text-emerald-400 flex items-center justify-between px-1">
                <span>Foto siap ({Math.round(pendingBlob.size / 1024)} KB · maks 800px)</span>
                <button type="button" onClick={() => setPendingBlob(null)} className="text-zinc-400 underline">
                  Hapus foto
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 active:scale-95 transition"
            >
              Simpan Spot Parkir
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-zinc-300" />
            <h2 className="text-base font-bold text-white">Lokasi Barang</h2>
          </div>
          <span className="text-xs text-zinc-500">{filtered.length} barang</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barang atau lokasi..."
            className="w-full min-h-[48px] pl-11 pr-4 rounded-2xl bg-card border border-borderline text-sm text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">Tidak ada barang yang cocok.</p>
          ) : (
            filtered.map((it) => (
              <div
                key={it.id}
                className="p-3.5 rounded-2xl bg-card border border-borderline flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{it.name}</p>
                  <p className="text-xs text-emerald-400/90 mt-0.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{it.location}</span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Hapus barang"
                  onClick={() => it.id !== undefined && db.items.delete(it.id)}
                  className="min-w-[48px] min-h-[48px] rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 active:scale-95 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={addItem} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
          <p className="text-xs font-semibold text-zinc-400">Simpan Lokasi Baru</p>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Nama barang (mis. Kunci Gembok)"
            required
            className="w-full min-h-[48px] px-3.5 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={itemLocation}
              onChange={(e) => setItemLocation(e.target.value)}
              placeholder="Disimpan di mana?"
              required
              className="flex-1 min-h-[48px] px-3.5 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
            />
            <button
              type="submit"
              className="min-w-[56px] min-h-[48px] px-4 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
