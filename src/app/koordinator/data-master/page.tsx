import { redirect } from 'next/navigation';

export default function DataMasterPage() {
  // Data master (kelas, MK, ruangan, lecturer, semester) sekarang
  // dikelola inline dari form di /koordinator/manajemen-jadwal.
  redirect('/koordinator/manajemen-jadwal');
}
