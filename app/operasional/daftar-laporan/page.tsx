import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllLaporan } from '@/lib/rtg';
import { DaftarLaporanClient } from './client';

export default async function DaftarLaporanPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const laporanList = await getAllLaporan();

  return <DaftarLaporanClient session={session} initialLaporan={laporanList} />;
}
