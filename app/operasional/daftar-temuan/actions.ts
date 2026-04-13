'use server';

import { revalidatePath } from 'next/navigation';
import { updateTemuanStatus } from '@/lib/rtg';

export async function updateStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as any;

  await updateTemuanStatus(id, status);
  revalidatePath('/operasional/daftar-temuan');
}
