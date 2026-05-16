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
