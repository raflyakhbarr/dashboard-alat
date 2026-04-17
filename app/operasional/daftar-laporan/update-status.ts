'use server';

import { updateLaporanStatus } from '@/lib/rtg';
import { StatusKerusakan } from '@/types/rtg';
import { redirect } from 'next/navigation';

export async function updateStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as StatusKerusakan;
  await updateLaporanStatus(id, status);
}
