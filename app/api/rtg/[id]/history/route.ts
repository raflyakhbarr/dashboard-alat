import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRTGUnitHistory } from '@/lib/rtg';

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
    const history = await getRTGUnitHistory(id);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching RTG history:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
