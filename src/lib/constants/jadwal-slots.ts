export const HARI_OPTIONS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
] as const;

export const JAM_OPTIONS = [
  { value: 1, label: 'Jam 1', range: '07:30 — 09:10' },
  { value: 2, label: 'Jam 2', range: '09:30 — 11:10' },
  { value: 3, label: 'Jam 3', range: '11:30 — 13:10' },
  { value: 4, label: 'Jam 4', range: '13:30 — 15:10' },
  { value: 5, label: 'Jam 5', range: '15:30 — 17:10' },
  { value: 6, label: 'Jam 6', range: '17:40 — 19:15' },
  { value: 7, label: 'Jam 7', range: '19:30 — 21:00' },
] as const;

export function opsiHariFromTanggal(tanggal: string): number {
  const d = new Date(`${tanggal}T12:00:00`);
  const day = d.getDay();
  if (day === 0) return 6;
  return day;
}

export function opsiJamFromWaktu(waktu: string): number {
  const match = waktu.match(/(\d{1,2}:\d{2})/);
  if (!match) return 1;
  const t = match[1].padStart(5, '0');
  const starts = ['07:30', '09:30', '11:30', '13:30', '15:30', '17:40', '19:30'];
  for (let i = starts.length - 1; i >= 0; i--) {
    if (t >= starts[i]) return i + 1;
  }
  return 1;
}

