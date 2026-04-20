import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPenindaklanjutByLaporan } from '@/lib/rtg';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const penindaklanjutList = await getPenindaklanjutByLaporan(id);
    return NextResponse.json(penindaklanjutList);
  } catch (error) {
    console.error('Error fetching penindaklanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
