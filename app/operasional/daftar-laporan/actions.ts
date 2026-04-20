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
  cekLaporanExist,
  cekLaporanExistDebug,
} from '@/lib/rtg';
import { StatusKondisiRTG, PenindakLanjut } from '@/types/rtg';
import {
  parseExcelDate,
  extractRTGCode,
  collectPhotoURLs,
  serializeForServer,
  getRTGCodeFromRow,
} from '@/lib/import-excel';

export interface ImportRow {
  row: any;
  status: StatusKondisiRTG;
  penindakLanjut: PenindakLanjut;
  catatan?: string;
}

export interface CekDataBaruResult {
  existingData: any[];
  existingIndices: number[];
  total: number;
  baru: number;
  lama: number;
}

/**
 * Cek data mana yang baru dan mana yang sudah ada di database
 */
export async function cekDataBaru(data: any[]): Promise<CekDataBaruResult> {
  // Serialize data untuk memastikan plain objects
  const serializedData = serializeForServer(data);

  // DEBUG: Log 3 data pertama untuk melihat struktur
  console.log('=== DEBUG cekDataBaru ===');
  console.log('Total data:', serializedData.length);
  if (serializedData.length > 0) {
    console.log('Sample first row keys:', Object.keys(serializedData[0]));
    console.log('Sample first row:', JSON.stringify(serializedData[0], null, 2));
    console.log('Sample first row RTG code (flexible):', getRTGCodeFromRow(serializedData[0]));
  }

  const existingData: any[] = [];
  const existingIndices: number[] = [];

  for (let i = 0; i < serializedData.length; i++) {
    const row = serializedData[i];

    // Skip jika row tidak valid
    if (!row || typeof row !== 'object') {
      console.log(`Row ${i}: Skipped - invalid row`);
      continue;
    }

    // DEBUG: Log keys dan values untuk row yang bermasalah
    if (i < 3) {
      console.log(`Row ${i} keys:`, Object.keys(row));
      console.log(`Row ${i} 'Jenis dan Nomor Alat...':`, row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51']);
    }

    const rtgCode = getRTGCodeFromRow(row);

    // Skip jika rtgCode tidak valid
    if (!rtgCode) {
      console.log(`Row ${i}: Skipped - RTG Code kosong. Available keys:`, Object.keys(row));
      continue;
    }

    console.log(`Row ${i}: RTG Code = "${rtgCode}"`);

    const rtgUnit = await getRTGUnitByCode(rtgCode);

    if (rtgUnit) {
      const tanggal = parseExcelDate(row['Tanggal Pengoprasian']);
      const namaPelapor = String(row['Name'] || '').trim();
      const temuanPra = String(row['Temuan Pra-Penggunaan'] || '').trim();

      // Hanya cek jika ada temuan
      if (temuanPra && !temuanPra.toLowerCase().includes('tidak ada')) {
        const exists = await cekLaporanExist(
          rtgUnit.id,
          tanggal,
          namaPelapor,
          temuanPra
        );

        if (exists) {
          existingData.push(row);
          existingIndices.push(i);
        }
      } else {
        // Data tanpa temuan dianggap sudah ada/skip
        // karena tidak akan membuat laporan kerusakan
        existingData.push(row);
        existingIndices.push(i);
      }
    }
  }

  console.log('=== END DEBUG cekDataBaru ===');

  return {
    existingData,
    existingIndices,
    total: data.length,
    baru: data.length - existingData.length,
    lama: existingData.length,
  };
}

/**
 * Server action untuk debug pengecekan data
 * Mengembalikan detail tentang 3 data pertama yang dicek
 */
export async function debugCheckLaporan(data: any[]): Promise<any[]> {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    throw new Error('Unauthorized');
  }

  // Serialize data ULANG untuk memastikan plain objects
  // Meskipun sudah di-serialize di client, kita serialize lagi untuk safety
  const serializedData = serializeForServer(data);
  const debugResults = [];

  console.log('debugCheckLaporan received', serializedData.length, 'rows');
  console.log('First row type:', typeof serializedData[0]);
  console.log('First row keys:', Object.keys(serializedData[0] || {}));

  for (let i = 0; i < Math.min(serializedData.length, 3); i++) {
    const row = serializedData[i];

    // Skip jika row tidak valid
    if (!row || typeof row !== 'object') {
      continue;
    }

    const rtgCode = getRTGCodeFromRow(row);

    // Skip jika rtgCode tidak valid
    if (!rtgCode) {
      continue;
    }

    const rtgUnit = await getRTGUnitByCode(rtgCode);

    if (rtgUnit) {
      const tanggal = parseExcelDate(row['Tanggal Pengoprasian']);
      const namaPelapor = String(row['Name'] || '').trim();
      const temuanPra = String(row['Temuan Pra-Penggunaan'] || '').trim();

      if (temuanPra && !temuanPra.toLowerCase().includes('tidak ada')) {
        const debugResult = await cekLaporanExistDebug(
          rtgUnit.id,
          tanggal,
          namaPelapor,
          temuanPra
        );

        debugResults.push({
          index: i,
          rtgCode,
          tanggalExcel: row['Tanggal Pengoprasian'],
          tanggalParsed: tanggal,
          namaPelapor,
          temuanPra,
          exists: debugResult.exists,
          foundData: debugResult.foundData,
          allReportsForDate: debugResult.allReportsForDate,
        });
      }
    }
  }

  return debugResults;
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
    skipped: 0, // Data yang sudah ada
    errors: [] as any[],
    details: [] as any[],
    createdUnits: [] as any[],
    skippedData: [] as any[], // Data yang sudah ada di database
  };

  // DEBUG: Log untuk melihat struktur data yang diterima
  console.log('=== DEBUG importLaporanOperator ===');
  console.log('Total data received:', data.length);
  if (data.length > 0) {
    console.log('Sample first item type:', typeof data[0]);
    console.log('Sample first item:', JSON.stringify(data[0], null, 2));
    console.log('Sample first item row type:', typeof data[0].row);
    console.log('Sample first item row:', data[0].row);
  }

  // JANGAN serialize lagi! Data dari client sudah di-serialize
  // Kita langsung loop pada data asli
  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      const { row, status, penindakLanjut, catatan } = item;

      // DEBUG: Log untuk setiap row
      console.log(`=== Processing row ${i} ===`);
      console.log('Row type:', typeof row);
      console.log('Row keys:', Object.keys(row));
      console.log('RTG Code (flexible):', getRTGCodeFromRow(row));

      // Skip jika row tidak valid
      if (!row || typeof row !== 'object') {
        results.failed++;
        results.errors.push({
          row: `Data ${i + 1}`,
          error: 'Invalid row data',
        });
        continue;
      }

      // Extract data dengan null/undefined checks menggunakan helper yang fleksibel
      const rtgCode = getRTGCodeFromRow(row);

      // Skip jika rtgCode tidak valid
      if (!rtgCode) {
        results.failed++;
        results.errors.push({
          row: `Data ${i + 1}`,
          error: 'RTG Code tidak valid atau kosong',
        });
        continue;
      }

      // Dapatkan full RTG name untuk display
      const rtgFullCode =
        row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'] ||
        row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG51'] ||
        row['RTG'] ||
        rtgCode;

      const namaPelapor = String(row['Name'] || '').trim();
      const emailPelapor = String(row['Email'] || '').trim();
      const groupName = String(row['Group'] || 'Default').trim();
      const temuanPra = String(row['Temuan Pra-Penggunaan'] || '').trim();
      const temuanPasca = String(row['Temuan Pasca Pengoprasian Alat'] || '').trim();
      const saranPerbaikan = String(row['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '] || '').trim();
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
            nama_rtg: (rtgFullCode || '').trim(),
            group_rtg_id: group.id,
            status_kondisi: status,
          });

          results.createdUnits.push({
            kode: rtgCode,
            nama: (rtgFullCode || '').trim(),
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

      // Cek apakah data laporan sudah ada
      const hasTemuan = temuanPra && !temuanPra.toLowerCase().includes('tidak ada');

      if (hasTemuan) {
        // Cek apakah laporan sudah ada
        const laporanExist = await cekLaporanExist(
          rtgUnit.id,
          tanggal,
          namaPelapor,
          temuanPra
        );

        if (laporanExist) {
          results.skipped++;
          results.skippedData.push({
            nama: namaPelapor,
            rtg: rtgCode,
            alasan: 'Data sudah ada di database',
          });
          continue;
        }

        // Create laporan baru
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

        results.details.push({
          nama: namaPelapor,
          rtg: rtgCode,
          laporan_id: laporan.id,
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
        laporan_kerusakan_id: results.details[results.details.length - 1]?.laporan_id || null,
        diubah_oleh: session.id,
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        row: serializedData[i]['Name'],
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}
