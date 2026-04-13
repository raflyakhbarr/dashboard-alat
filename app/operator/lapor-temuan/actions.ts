'use server';

import { redirect, revalidatePath } from 'next/navigation';
import { createTemuan, updateRTGUnitStatus } from '@/lib/rtg';
import { uploadPhotos, isAutoUpdateKeyword } from '@/lib/upload';
import { getSession } from '@/lib/auth';

export async function submitLaporan(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  try {
    // Extract form data
    const rtg_unit_id = formData.get('rtg_unit_id') as string;
    const tanggal_temuan = formData.get('tanggal_temuan') as string;
    const waktu_temuan = formData.get('waktu_temuan') as string;
    const jenis_temuan = formData.get('jenis_temuan') as string;
    const deskripsi_temuan = formData.get('deskripsi_temuan') as string;

    // Handle photo upload
    const photoFiles = formData.getAll('foto') as File[];
    const foto = photoFiles.length > 0 && photoFiles[0].size > 0
      ? await uploadPhotos(photoFiles)
      : [];

    // Create temuan record
    await createTemuan({
      rtg_unit_id,
      pelapor_id: session.id,
      tanggal_temuan,
      waktu_temuan,
      jenis_temuan,
      deskripsi_temuan,
      foto,
    utility: session.id,
    });

    // Auto-update RTG status if keyword detected
    if (isAutoUpdateKeyword(jenis_temuan)) {
      await updateRTGUnitStatus(rtg_unit_id, 'TIDAK_READY');
    }

    revalidatePath('/operator/riwayat-temuan');
    redirect('/operator/riwayat-temuan');
  } catch (error: any) {
    return { error: error.message };
  }
}
