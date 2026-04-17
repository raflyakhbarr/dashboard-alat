import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllLaporan } from '@/lib/rtg';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const laporanList = await getAllLaporan();
    return NextResponse.json(laporanList);
  } catch (error) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
