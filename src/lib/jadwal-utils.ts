export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayIso(): string {
  const n = new Date();
  return toIsoDate(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getMonthBounds(year: number, month: number) {
  const start_date = toIsoDate(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end_date = toIsoDate(year, month, lastDay);
  return { start_date, end_date };
}

export function semesterLabel(tahun: string, tipe: string) {
  return `${tahun} · ${tipe}`;
}

/** Normalisasi tanggal dari API (YYYY-MM-DD atau ISO datetime) */
export function sessionDateKey(tanggal: string): string {
  return tanggal.slice(0, 10);
}

/** Sesi pengganti memakai prefix sub- dan endpoint /substitute-sessions */
export function isSubstituteSessionId(id: string): boolean {
  return /^sub-/i.test(id);
}

function resolveDatedSessionId(id: string, isoDate: string, prefix: 'ses' | 'sub'): string {
  const re = new RegExp(`^${prefix}-(\\d{8})-(.+)$`, 'i');
  const m = id.match(re);
  if (!m) return id;
  const ymd = isoDate.replace(/-/g, '');
  if (m[1] === ymd) return id;
  return `${prefix}-${ymd}-${m[2]}`;
}

/**
 * Backend kadang memakai id format ses-YYYYMMDD-...
 * Timeline bisa mengembalikan id dari instance lain; sesuaikan id ke tanggal baris.
 */
export function resolveSessionIdForDate(id: string, isoDate: string): string {
  return resolveDatedSessionId(id, isoDate, 'ses');
}

/** Sama seperti ses-, untuk id sub-YYYYMMDD-... pada sesi pengganti */
export function resolveSubstituteSessionIdForDate(id: string, isoDate: string): string {
  return resolveDatedSessionId(id, isoDate, 'sub');
}

export type SessionTipe = 'REGULER' | 'PENGGANTI';

/** Backend bisa mengirim REGULAR/REGULER atau SUBSTITUTE/PENGGANTI */
export function normalizeSessionTipe(tipe: string): SessionTipe {
  const u = tipe.trim().toUpperCase();
  if (u === 'PENGGANTI' || u === 'SUBSTITUTE') return 'PENGGANTI';
  return 'REGULER';
}

export function isPenggantiTipe(tipe: string): boolean {
  return normalizeSessionTipe(tipe) === 'PENGGANTI';
}

/** Key unik per baris list (id_sesi bisa sama untuk beberapa instance tanggal) */
export function sessionRowKey(session: {
  id_sesi: string;
  tanggal: string;
  waktu: string;
  nama_kelas?: string;
  mata_kuliah?: string;
}): string {
  return [
    session.id_sesi,
    sessionDateKey(session.tanggal),
    session.waktu,
    session.nama_kelas ?? '',
    session.mata_kuliah ?? '',
  ].join('|');
}

export function normalizeLookupLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Cocokkan label dari timeline ke item dropdown (nama bisa sedikit berbeda) */
export function findByDisplayLabel<T>(
  items: T[],
  label: string,
  getLabel: (item: T) => string,
): T | undefined {
  const target = normalizeLookupLabel(label);
  if (!target) return undefined;
  const exact = items.find(item => normalizeLookupLabel(getLabel(item)) === target);
  if (exact) return exact;
  return items.find(item => {
    const itemLabel = normalizeLookupLabel(getLabel(item));
    return itemLabel.includes(target) || target.includes(itemLabel);
  });
}

/** Pengajar di timeline bisa berformat "Nama (Substitute Teacher)" */
export function pengajarDisplayName(pengajar: string): string {
  return pengajar.split('(')[0]?.trim() ?? pengajar.trim();
}

export function dedupeSessions<T extends { id_sesi: string; tanggal: string; waktu: string }>(
  items: T[],
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = sessionRowKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
