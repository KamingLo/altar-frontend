import type { SessionFromAPI } from '@/lib/actions/jadwal';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

export type PresensiMode = 'qr' | 'link' | 'unknown';

type SessionWithPresensiMode = SessionFromAPI & {
  tipe_absensi?: string | null;
  tipe_presensi?: string | null;
  mode_presensi?: string | null;
  presensi_mode?: string | null;
  attendance_mode?: string | null;
  id_sesi_pengganti?: string | null;
  id_pengganti?: string | null;
  id_substitute_session?: string | null;
  id_substitute?: string | null;
  is_online?: boolean | null;
};

function normalizeMode(value?: string | null): PresensiMode {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized.includes('link') || normalized.includes('online')) {
    return 'link';
  }

  if (normalized.includes('qr') || normalized.includes('offline') || normalized.includes('normal')) {
    return 'qr';
  }

  return 'unknown';
}

export function getSessionStartMinutes(session: Pick<SessionFromAPI, 'waktu'>): number | null {
  const match = session.waktu.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

export function getSessionPresensiMode(session: SessionFromAPI): PresensiMode {
  const sessionWithMode = session as SessionWithPresensiMode;
  const explicitMode = normalizeMode(
    sessionWithMode.tipe_absensi ??
    sessionWithMode.tipe_presensi ??
    sessionWithMode.mode_presensi ??
    sessionWithMode.presensi_mode ??
    sessionWithMode.attendance_mode,
  );

  if (explicitMode !== 'unknown') return explicitMode;
  if (sessionWithMode.is_online === true) return 'link';
  if (sessionWithMode.is_online === false) return 'qr';

  const startMinutes = getSessionStartMinutes(session);
  if (startMinutes === null) return 'unknown';

  return startMinutes > 17 * 60 + 10 ? 'link' : 'qr';
}

export function isQrSession(session: SessionFromAPI): boolean {
  return getSessionPresensiMode(session) === 'qr';
}

export function isOnlineSession(session: SessionFromAPI): boolean {
  return getSessionPresensiMode(session) === 'link';
}

export function isQrPresensi(presensi: Pick<PresensiResponseDTO, 'tipe_absensi'>): boolean {
  return normalizeMode(presensi.tipe_absensi) === 'qr';
}

export function isOnlinePresensi(presensi: Pick<PresensiResponseDTO, 'tipe_absensi'>): boolean {
  return normalizeMode(presensi.tipe_absensi) === 'link';
}

export function getSubstituteSessionId(session?: SessionFromAPI | null): string | undefined {
  if (!session) return undefined;
  const sessionWithMode = session as SessionWithPresensiMode;
  const candidate =
    sessionWithMode.id_sesi_pengganti ??
    sessionWithMode.id_pengganti ??
    sessionWithMode.id_substitute_session ??
    sessionWithMode.id_substitute;

  if (!candidate || candidate === session.id_sesi) return undefined;
  return candidate;
}
