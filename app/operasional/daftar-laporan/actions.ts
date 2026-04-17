'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getRTGUnitByCode,
  createLaporan,
  createRTGStatusHistory,
  updateRTGUnitStatus,
  createRTGUnit,
  getAllRTGGroups,
  createRTGGroup,
} from '@/lib/rtg';
import { StatusKondisiRTG, PenindakLanjut } from '@/types/rtg';
import {
  parseExcelDate,
  extractRTGCode,
  collectPhotoURLs,
} from '@/lib/import-excel';

export interface ImportRow {
  row: any;
  status: StatusKondisiRTG;
  penindakLanjut: PenindakLanjut;
  catatan?: string;
}

export async function importLaporanOperator(data: ImportRow[]) {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    return { success: false, error: 'Unauthorized' };
  }

  const results = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
    details: [] as any[],
    createdUnits: [] as any[],
  };

  for (const item of data) {
    try {
      const { row, status, penindakLanjut, catatan } = item;

      // Extract data
      const rtgFullCode = row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'];
      const rtgCode = extractRTGCode(rtgFullCode);
      const namaPelapor = row['Name'];
      const emailPelapor = row['Email'];
      const groupName = row['Group'] || 'Default';
      const temuanPra = row['Temuan Pra-Penggunaan'] || '';
      const temuanPasca = row['Temuan Pasca Pengoprasian Alat'] || '';
      const saranPerbaikan = row['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '] || '';
      const rating = row['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'] || 0;
      const tanggal = parseExcelDate(row['Tanggal Pengoprasian']);
      const photos = collectPhotoURLs(row);

      // Cari RTG unit
      let rtgUnit = await getRTGUnitByCode(rtgCode);

      // Jika tidak ada, buat baru
      if (!rtgUnit) {
        try {
          // Cari atau buat group
          const allGroups = await getAllRTGGroups();
          let group = allGroups.find(g => g.nama_group.toLowerCase() === groupName.toLowerCase());

          if (!group) {
            // Buat group baru jika belum ada
            group = await createRTGGroup({
              nama_group: groupName,
              deskripsi: `Group ${groupName} - dibuat otomatis dari import Excel`,
              lokasi: null,
            });
          }

          // Buat RTG unit baru
          rtgUnit = await createRTGUnit({
            kode_rtg: rtgCode,
            nama_rtg: rtgFullCode.trim(),
            group_rtg_id: group.id,
            status_kondisi: status,
          });

          results.createdUnits.push({
            kode: rtgCode,
            nama: rtgFullCode.trim(),
            group: groupName,
          });
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: namaPelapor,
            error: `Gagal membuat RTG unit ${rtgCode}: ${error.message}`,
          });
          continue;
        }
      }

      // Cek apakah perlu create laporan (ada temuan)
      const hasTemuan = temuanPra && !temuanPra.toLowerCase().includes('tidak ada');

      let laporanId = null;

      if (hasTemuan) {
        // Create laporan
        const jenisKerusakan = temuanPra;
        const deskripsi = temuanPasca || saranPerbaikan;

        const laporan = await createLaporan({
          rtg_unit_id: rtgUnit.id,
          dilaporkan_oleh: session.id,
          nama_pelapor: namaPelapor,
          email_pelapor: emailPelapor,
          penindak_lanjut: penindakLanjut,
          tanggal_laporan: tanggal,
          waktu_laporan: new Date().toTimeString().slice(0, 5), // Format: "HH:mm"
          jenis_kerusakan: jenisKerusakan,
          deskripsi: deskripsi,
          foto_laporan: photos,
        });

        laporanId = laporan.id;

        results.details.push({
          nama: namaPelapor,
          rtg: rtgCode,
          laporan_id: laporanId,
          status: 'Created',
        });
      } else {
        results.details.push({
          nama: namaPelapor,
          rtg: rtgCode,
          status: 'Skipped (Tidak ada temuan)',
        });
      }

      // Update status RTG
      const previousStatus = rtgUnit.status_kondisi;
      await updateRTGUnitStatus(rtgUnit.id, status);

      // Create history
      await createRTGStatusHistory({
        rtg_unit_id: rtgUnit.id,
        status_kondisi_sebelumnya: previousStatus,
        status_kondisi_baru: status,
        alasan_perubahan: catatan || `Import laporan operator: ${namaPelapor}${hasTemuan ? ' - ' + temuanPra : ''}`,
        laporan_kerusakan_id: laporanId,
        diubah_oleh: session.id,
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        row: item.row['Name'],
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}
