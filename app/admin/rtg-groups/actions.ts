'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllRTGGroups,
  createRTGGroup,
  updateRTGGroup,
  deleteRTGGroup,
} from '@/lib/rtg';
import { redirect } from 'next/navigation';

export async function createGroup(formData: FormData) {
  const nama_group = formData.get('nama_group') as string;
  const deskripsi = formData.get('deskripsi') as string;
  const lokasi = formData.get('lokasi') as string;

  await createRTGGroup({ nama_group, deskripsi, lokasi });
  revalidatePath('/admin/rtg-groups');
  revalidatePath('/dashboard');
  redirect('/admin/rtg-groups');
}

export async function deleteGroup(formData: FormData) {
  const id = formData.get('id') as string;
  await deleteRTGGroup(id);
  revalidatePath('/admin/rtg-groups');
  revalidatePath('/dashboard');
  redirect('/admin/rtg-groups');
}
