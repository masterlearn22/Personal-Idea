import Dexie, { type Table } from 'dexie';

export interface ChecklistItem {
  id?: number;
  label: string;
  checked: boolean;
  order: number;
}

export interface MetaRecord {
  key: string;
  value: string | number | boolean;
}

export interface HabitItem {
  id?: number;
  title: string;
  lastDoneAt: number;
}

export interface ParkingSpot {
  id: string;
  note: string;
  photoBlob: Blob | null;
  savedAt: number;
}

export interface StoredItem {
  id?: number;
  name: string;
  location: string;
  updatedAt: number;
}

export class SakuDatabase extends Dexie {
  checklist!: Table<ChecklistItem, number>;
  meta!: Table<MetaRecord, string>;
  habits!: Table<HabitItem, number>;
  parking!: Table<ParkingSpot, string>;
  items!: Table<StoredItem, number>;

  constructor() {
    super('SakuDB');
    this.version(1).stores({
      checklist: '++id, label, checked, order',
      meta: 'key',
      habits: '++id, title, lastDoneAt',
      parking: 'id',
      items: '++id, name, location, updatedAt'
    });
  }
}

export const db = new SakuDatabase();

export function getLocalDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function ensureSeedAndDailyReset(): Promise<void> {
  const today = getLocalDateStr();
  const seeded = await db.meta.get('seeded');

  if (!seeded) {
    const now = Date.now();
    const DAY = 86400000;

    await db.checklist.bulkAdd([
      { label: 'Kunci Kamar / Motor', checked: false, order: 0 },
      { label: 'Dompet & STNK', checked: false, order: 1 },
      { label: 'Cabut Colokan / Saklar', checked: false, order: 2 },
      { label: 'Charger HP', checked: false, order: 3 },
      { label: 'Botol Minum', checked: false, order: 4 }
    ]);

    await db.habits.bulkAdd([
      { title: 'Ganti Sprei', lastDoneAt: now - 5 * DAY },
      { title: 'Bersihkan Kipas Angin', lastDoneAt: now - 14 * DAY },
      { title: 'Potong Kuku', lastDoneAt: now - 6 * DAY },
      { title: 'Cek Tekanan Ban', lastDoneAt: now - 9 * DAY }
    ]);

    await db.items.bulkAdd([
      { name: 'Obeng Set', location: 'Laci meja kanan', updatedAt: now },
      { name: 'Kunci Cadangan Motor', location: 'Gantungan belakang pintu', updatedAt: now },
      { name: 'Kabel Data Cadangan', location: 'Tas selempang hitam', updatedAt: now },
      { name: 'Materai 10000', location: 'Map dokumen biru', updatedAt: now }
    ]);

    await db.meta.bulkPut([
      { key: 'seeded', value: true },
      { key: 'lastChecklistDate', value: today },
      { key: 'scratchpad', value: '' },
      { key: 'reflekCount', value: 0 },
      { key: 'reflekDate', value: today }
    ]);
    return;
  }

  const lastDate = await db.meta.get('lastChecklistDate');
  if (!lastDate || lastDate.value !== today) {
    await db.checklist.toCollection().modify({ checked: false });
    await db.meta.put({ key: 'lastChecklistDate', value: today });
  }

  const reflekDate = await db.meta.get('reflekDate');
  if (!reflekDate || reflekDate.value !== today) {
    await db.meta.put({ key: 'reflekCount', value: 0 });
    await db.meta.put({ key: 'reflekDate', value: today });
  }
}
