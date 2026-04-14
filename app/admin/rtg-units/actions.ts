'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllRTGUnits,
  getAllRTGGroups,
  createRTGUnit,
  deleteRTGUnit,
} from '@/lib/rtg';
import { redirect } from 'next/navigation';
import { type StatusKondisiRTG } from '@/types/rtg';

export async function createUnit(formData: FormData) {
  const kode_rtg = formData.get('kode_rtg') as string;
  const nama_rtg = formData.get('nama_rtg') as string;
  const group_rtg_id = formData.get('group_rtg_id') as string;
  const kapasitas = formData.get('kapasitas') as string;
  const tahun_pembuatan = formData.get('tahun_pembuatan') as string;
  const manufacturer = formData.get('manufacturer') as string;
  const spesifikasi = formData.get('spesifikasi') as string;
  const status_kondisi = formData.get('status_kondisi') as StatusKondisiRTG;

  await createRTGUnit({
    kode_rtg,
    nama_rtg,
    group_rtg_id: group_rtg_id || undefined,
    kapasitas: kapasitas ? parseInt(kapasitas) : undefined,
    tahun_pembuatan: tahun_pembuatan ? parseInt(tahun_pembuatan) : undefined,
    manufacturer,
    spesifikasi,
    status_kondisi,
  });
  revalidatePath('/admin/rtg-units');
  revalidatePath('/dashboard');
  redirect('/admin/rtg-units');
}

export async function deleteUnit(formData: FormData) {
  const id = formData.get('id') as string;
  await deleteRTGUnit(id);
  revalidatePath('/admin/rtg-units');
  revalidatePath('/dashboard');
  redirect('/admin/rtg-units');
}
