import pool from '@/lib/db';
import {
  RTGGroup,
  RTGGroupInput,
  RTGUnit,
  RTGUnitInput,
  RTGUnitWithGroup,
  StatusKondisiRTG,
  DashboardStats,
  LaporanKerusakan,
  LaporanKerusakanWithDetails,
  LaporanKerusakanInput,
  StatusKerusakan,
  PenindakLanjut,
  PenindaklanjutKerusakan,
  PenindaklanjutKerusakanInput,
  PenindaklanjutKerusakanWithDetails,
  RTGStatusHistory,
  RTGStatusHistoryWithDetails,
} from '@/types/rtg';

// ============= RTG GROUPS =============

export async function getAllRTGGroups(): Promise<RTGGroup[]> {
  const result = await pool.query('SELECT * FROM rtg_groups ORDER BY nama_group');
  return result.rows;
}

export async function getRTGGroupById(id: string): Promise<RTGGroup | null> {
  const result = await pool.query('SELECT * FROM rtg_groups WHERE id = $1::uuid', [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function createRTGGroup(input: RTGGroupInput): Promise<RTGGroup> {
  const { nama_group, deskripsi, lokasi } = input;
  const result = await pool.query(
    'INSERT INTO rtg_groups (nama_group, deskripsi, lokasi) VALUES ($1, $2, $3) RETURNING *',
    [nama_group, deskripsi || null, lokasi || null]
  );
  return result.rows[0];
}

export async function updateRTGGroup(id: string, input: Partial<RTGGroupInput>): Promise<RTGGroup | null> {
  const { nama_group, deskripsi, lokasi } = input;
  const result = await pool.query(
    'UPDATE rtg_groups SET nama_group = COALESCE($1, nama_group), deskripsi = COALESCE($2, deskripsi), lokasi = COALESCE($3, lokasi) WHERE id = $4::uuid RETURNING *',
    [nama_group || null, deskripsi || null, lokasi || null, id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteRTGGroup(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM rtg_groups WHERE id = $1::uuid', [id]);
  return (result.rowCount || 0) > 0;
}

// ============= RTG UNITS =============

export async function getAllRTGUnits(): Promise<RTGUnitWithGroup[]> {
  const result = await pool.query(`
    SELECT
      u.*,
      g.id as group_id,
      g.nama_group,
      g.deskripsi as group_deskripsi,
      g.lokasi as group_lokasi
    FROM rtg_units u
    LEFT JOIN rtg_groups g ON u.group_rtg_id = g.id
    ORDER BY u.kode_rtg
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    kode_rtg: row.kode_rtg,
    nama_rtg: row.nama_rtg,
    group_rtg_id: row.group_rtg_id,
    group_rtg: row.group_id ? {
      id: row.group_id,
      nama_group: row.nama_group,
      deskripsi: row.group_deskripsi,
      lokasi: row.group_lokasi,
      created_at: row.group_created_at instanceof Date ? row.group_created_at.toISOString() : (row.group_created_at || new Date().toISOString()),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }));
}

export async function getRTGUnitById(id: string): Promise<RTGUnitWithGroup | null> {
  const result = await pool.query(`
    SELECT
      u.*,
      g.id as group_id,
      g.nama_group,
      g.deskripsi as group_deskripsi,
      g.lokasi as group_lokasi
    FROM rtg_units u
    LEFT JOIN rtg_groups g ON u.group_rtg_id = g.id
    WHERE u.id = $1::uuid
  `, [id]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    kode_rtg: row.kode_rtg,
    nama_rtg: row.nama_rtg,
    group_rtg_id: row.group_rtg_id,
    group_rtg: row.group_id ? {
      id: row.group_id,
      nama_group: row.nama_group,
      deskripsi: row.group_deskripsi,
      lokasi: row.group_lokasi,
      created_at: row.group_created_at instanceof Date ? row.group_created_at.toISOString() : (row.group_created_at || new Date().toISOString()),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function createRTGUnit(input: RTGUnitInput): Promise<RTGUnit> {
  const {
    kode_rtg,
    nama_rtg,
    group_rtg_id,
    kapasitas,
    tahun_pembuatan,
    manufacturer,
    spesifikasi,
    status_kondisi = 'READY',
  } = input;

  const result = await pool.query(
    `INSERT INTO rtg_units (kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      kode_rtg,
      nama_rtg,
      group_rtg_id || null,
      kapasitas || null,
      tahun_pembuatan || null,
      manufacturer || null,
      spesifikasi || null,
      status_kondisi,
    ]
  );
  return result.rows[0];
}

export async function updateRTGUnit(
  id: string,
  input: Partial<RTGUnitInput>
): Promise<RTGUnit | null> {
  const {
    kode_rtg,
    nama_rtg,
    group_rtg_id,
    kapasitas,
    tahun_pembuatan,
    manufacturer,
    spesifikasi,
    status_kondisi,
  } = input;

  const result = await pool.query(
    `UPDATE rtg_units
     SET kode_rtg = COALESCE($1, kode_rtg),
         nama_rtg = COALESCE($2, nama_rtg),
         group_rtg_id = COALESCE($3, group_rtg_id),
         kapasitas = COALESCE($4, kapasitas),
         tahun_pembuatan = COALESCE($5, tahun_pembuatan),
         manufacturer = COALESCE($6, manufacturer),
         spesifikasi = COALESCE($7, spesifikasi),
         status_kondisi = COALESCE($8, status_kondisi),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $9::uuid
     RETURNING *`,
    [
      kode_rtg || null,
      nama_rtg || null,
      group_rtg_id !== undefined ? group_rtg_id || null : null,
      kapasitas !== undefined ? kapasitas || null : null,
      tahun_pembuatan !== undefined ? tahun_pembuatan || null : null,
      manufacturer || null,
      spesifikasi || null,
      status_kondisi || null,
      id,
    ]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function updateRTGUnitStatus(
  id: string,
  status_kondisi: StatusKondisiRTG
): Promise<RTGUnit | null> {
  const result = await pool.query(
    'UPDATE rtg_units SET status_kondisi = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2::uuid RETURNING *',
    [status_kondisi, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteRTGUnit(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM rtg_units WHERE id = $1::uuid', [id]);
  return (result.rowCount || 0) > 0;
}

export async function getRTGUnitByCode(kode_rtg: string): Promise<RTGUnitWithGroup | null> {
  const result = await pool.query(`
    SELECT
      u.*,
      g.id as group_id,
      g.nama_group,
      g.deskripsi as group_deskripsi,
      g.lokasi as group_lokasi
    FROM rtg_units u
    LEFT JOIN rtg_groups g ON u.group_rtg_id = g.id
    WHERE u.kode_rtg = $1
  `, [kode_rtg]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    kode_rtg: row.kode_rtg,
    nama_rtg: row.nama_rtg,
    group_rtg_id: row.group_rtg_id,
    group_rtg: row.group_id ? {
      id: row.group_id,
      nama_group: row.nama_group,
      deskripsi: row.group_deskripsi,
      lokasi: row.group_lokasi,
      created_at: row.group_created_at instanceof Date ? row.group_created_at.toISOString() : (row.group_created_at || new Date().toISOString()),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total_rtg,
      SUM(CASE WHEN status_kondisi = 'READY' THEN 1 ELSE 0 END) as ready,
      SUM(CASE WHEN status_kondisi = 'READY_CATATAN_RINGAN' THEN 1 ELSE 0 END) as ready_catatan_ringan,
      SUM(CASE WHEN status_kondisi = 'READY_CATATAN_BERAT' THEN 1 ELSE 0 END) as ready_catatan_berat,
      SUM(CASE WHEN status_kondisi = 'TIDAK_READY' THEN 1 ELSE 0 END) as tidak_ready
    FROM rtg_units
  `);

  const row = result.rows[0];
  return {
    total_rtg: parseInt(row.total_rtg) || 0,
    ready: parseInt(row.ready) || 0,
    ready_catatan_ringan: parseInt(row.ready_catatan_ringan) || 0,
    ready_catatan_berat: parseInt(row.ready_catatan_berat) || 0,
    tidak_ready: parseInt(row.tidak_ready) || 0,
  };
}

export async function getRTGUnitsByStatus(status: StatusKondisiRTG): Promise<RTGUnitWithGroup[]> {
  const result = await pool.query(`
    SELECT
      u.*,
      g.id as group_id,
      g.nama_group,
      g.deskripsi as group_deskripsi,
      g.lokasi as group_lokasi
    FROM rtg_units u
    LEFT JOIN rtg_groups g ON u.group_rtg_id = g.id
    WHERE u.status_kondisi = $1
    ORDER BY u.kode_rtg
  `, [status]);

  return result.rows.map((row: any) => ({
    id: row.id,
    kode_rtg: row.kode_rtg,
    nama_rtg: row.nama_rtg,
    group_rtg_id: row.group_rtg_id,
    group_rtg: row.group_id ? {
      id: row.group_id,
      nama_group: row.nama_group,
      deskripsi: row.group_deskripsi,
      lokasi: row.group_lokasi,
      created_at: row.group_created_at instanceof Date ? row.group_created_at.toISOString() : (row.group_created_at || new Date().toISOString()),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }));
}

// ============= LAPORAN KERUSAKAN =============

function mapLaporanRow(row: any): LaporanKerusakanWithDetails {
  return {
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    dilaporkan_oleh: row.dilaporkan_oleh,
    nama_pelapor: row.nama_pelapor,
    email_pelapor: row.email_pelapor,
    penindak_lanjut: row.penindak_lanjut,
    tanggal_laporan: row.tanggal_laporan instanceof Date ? row.tanggal_laporan.toISOString().split('T')[0] : row.tanggal_laporan,
    waktu_laporan: row.waktu_laporan,
    jenis_kerusakan: row.jenis_kerusakan,
    deskripsi: row.deskripsi,
    foto_laporan: row.foto_laporan || [],
    status_kerusakan: row.status_kerusakan,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
      status_kondisi: row.status_kondisi,
    },
  };
}

export async function getAllLaporan(): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg,
      u.status_kondisi
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `);

  return result.rows.map(mapLaporanRow);
}

export async function getLaporanById(id: string): Promise<LaporanKerusakanWithDetails | null> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg,
      u.status_kondisi
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.id = $1::uuid
  `, [id]);

  if (result.rows.length === 0) return null;

  return mapLaporanRow(result.rows[0]);
}

export async function getLaporanByPenindakLanjut(penindakLanjut: PenindakLanjut): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg,
      u.status_kondisi
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.penindak_lanjut = $1
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `, [penindakLanjut]);

  return result.rows.map(mapLaporanRow);
}

export async function getLaporanByStatus(status: StatusKerusakan): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg,
      u.status_kondisi
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.status_kerusakan = $1
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `, [status]);

  return result.rows.map(mapLaporanRow);
}

export async function createLaporan(input: LaporanKerusakanInput): Promise<LaporanKerusakan> {
  const {
    rtg_unit_id,
    dilaporkan_oleh,
    nama_pelapor,
    email_pelapor,
    penindak_lanjut,
    tanggal_laporan,
    waktu_laporan,
    jenis_kerusakan,
    deskripsi,
    foto_laporan = [],
  } = input;

  const result = await pool.query(
    `INSERT INTO laporan_kerusakan (rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor || null, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi || null, JSON.stringify(foto_laporan)]
  );

  return result.rows[0];
}

export async function updateLaporanStatus(id: string, status: StatusKerusakan): Promise<LaporanKerusakan | null> {
  const result = await pool.query(
    'UPDATE laporan_kerusakan SET status_kerusakan = $1 WHERE id = $2::uuid RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteLaporan(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM laporan_kerusakan WHERE id = $1::uuid', [id]);
  return (result.rowCount || 0) > 0;
}

/**
 * Cek apakah laporan sudah ada berdasarkan kombinasi
 * rtg_unit_id, tanggal_laporan, nama_pelapor, dan jenis_kerusakan
 *
 * Menggunakan normalization untuk pengecekan yang lebih akurat:
 * - Trim whitespace
 * - Case insensitive untuk nama pelapor dan jenis kerusakan
 */
export async function cekLaporanExist(
  rtg_unit_id: string,
  tanggal_laporan: string,
  nama_pelapor: string,
  jenis_kerusakan: string
): Promise<boolean> {
  // Normalize input data
  const normalizedNama = nama_pelapor.trim().toLowerCase();
  const normalizedJenis = jenis_kerusakan.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id FROM laporan_kerusakan
     WHERE rtg_unit_id = $1::uuid
     AND tanggal_laporan = $2
     AND LOWER(TRIM(nama_pelapor)) = $3
     AND LOWER(TRIM(jenis_kerusakan)) = $4
     LIMIT 1`,
    [rtg_unit_id, tanggal_laporan, normalizedNama, normalizedJenis]
  );

  return result.rows.length > 0;
}

/**
 * Debug: Cek apakah laporan sudah ada dan return detailnya
 * Berguna untuk melihat apa yang sebenarnya dicari vs apa yang ada di database
 */
export async function cekLaporanExistDebug(
  rtg_unit_id: string,
  tanggal_laporan: string,
  nama_pelapor: string,
  jenis_kerusakan: string
): Promise<{ exists: boolean; foundData?: any; searchData?: any }> {
  // Normalize input data
  const normalizedNama = nama_pelapor.trim().toLowerCase();
  const normalizedJenis = jenis_kerusakan.trim().toLowerCase();

  // Cari data yang cocok
  const result = await pool.query(
    `SELECT id, nama_pelapor, tanggal_laporan, jenis_kerusakan
     FROM laporan_kerusakan
     WHERE rtg_unit_id = $1::uuid
     AND tanggal_laporan = $2
     AND LOWER(TRIM(nama_pelapor)) = $3
     AND LOWER(TRIM(jenis_kerusakan)) = $4
     LIMIT 1`,
    [rtg_unit_id, tanggal_laporan, normalizedNama, normalizedJenis]
  );

  // Cari semua laporan untuk RTG dan tanggal yang sama (untuk debug)
  const allReports = await pool.query(
    `SELECT id, nama_pelapor, tanggal_laporan, jenis_kerusakan
     FROM laporan_kerusakan
     WHERE rtg_unit_id = $1::uuid
     AND tanggal_laporan = $2
     ORDER BY created_at DESC
     LIMIT 5`,
    [rtg_unit_id, tanggal_laporan]
  );

  return {
    exists: result.rows.length > 0,
    foundData: result.rows[0] || null,
    searchData: {
      rtg_unit_id,
      tanggal_laporan,
      nama_pelapor: normalizedNama,
      jenis_kerusakan: normalizedJenis,
    },
    allReportsForDate: allReports.rows,
  };
}

/**
 * Cek apakah ada laporan dengan kombinasi yang sama dalam batch data
 * Returns array of indices yang data nya sudah ada
 */
export async function cekBatchLaporanExist(data: any[]): Promise<number[]> {
  const existingIndices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rtgCode = row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'];
    const rtgUnit = await getRTGUnitByCode(rtgCode.replace(/^RTG\s*/, ''));

    if (rtgUnit) {
      const tanggal = parseExcelDate(row['Tanggal Pengoprasian']);
      const namaPelapor = row['Name'];
      const temuanPra = row['Temuan Pra-Penggunaan'] || '';

      // Hanya cek jika ada temuan
      if (temuanPra && !temuanPra.toLowerCase().includes('tidak ada')) {
        const exists = await cekLaporanExist(
          rtgUnit.id,
          tanggal,
          namaPelapor,
          temuanPra
        );

        if (exists) {
          existingIndices.push(i);
        }
      }
    }
  }

  return existingIndices;
}

export async function getLaporanCountByStatus(): Promise<Record<StatusKerusakan, number>> {
  const result = await pool.query(`
    SELECT
      status_kerusakan,
      COUNT(*) as count
    FROM laporan_kerusakan
    GROUP BY status_kerusakan
  `);

  const counts: Record<string, number> = {
    DIPERIKSA: 0,
    DITINDAKLANJUTI: 0,
    SELESAI: 0,
  };

  result.rows.forEach((row: any) => {
    counts[row.status_kerusakan] = parseInt(row.count);
  });

  return counts as Record<StatusKerusakan, number>;
}

// ============= PENINDAKLANJUT KERUSAKAN =============

export async function createPenindaklanjut(input: PenindaklanjutKerusakanInput): Promise<PenindaklanjutKerusakan> {
  const {
    laporan_kerusakan_id,
    ditangani_oleh_id,
    tanggal_selesai,
    deskripsi_tindakan,
    foto_bukti,
  } = input;

  const result = await pool.query(
    `INSERT INTO penindaklanjut_kerusakan (laporan_kerusakan_id, ditangani_oleh_id, tanggal_selesai, deskripsi_tindakan, foto_bukti)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [laporan_kerusakan_id, ditangani_oleh_id, tanggal_selesai, deskripsi_tindakan, JSON.stringify(foto_bukti)]
  );

  // Update laporan status to SELESAI
  await updateLaporanStatus(laporan_kerusakan_id, 'SELESAI');

  return result.rows[0];
}

export async function getPenindaklanjutByLaporan(laporanId: string): Promise<PenindaklanjutKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      p.*,
      l.jenis_kerusakan,
      u.kode_rtg,
      u.nama_rtg as unit_rtg,
      usr.nama as penangan_nama,
      usr.email as penangan_email,
      usr.role as penangan_role
    FROM penindaklanjut_kerusakan p
    LEFT JOIN laporan_kerusakan l ON p.laporan_kerusakan_id = l.id
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    LEFT JOIN users usr ON p.ditangani_oleh_id::uuid = usr.id
    WHERE p.laporan_kerusakan_id = $1::uuid
    ORDER BY p.created_at DESC
  `, [laporanId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai instanceof Date ? row.tanggal_selesai.toISOString() : row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    laporan_kerusakan: {
      jenis_kerusakan: row.jenis_kerusakan,
      rtg_unit: {
        kode_rtg: row.kode_rtg,
        nama_rtg: row.unit_rtg,
      },
    },
    ditangani_oleh: {
      nama: row.penangan_nama,
      email: row.penangan_email,
      role: row.penangan_role,
    },
  }));
}

export async function getPenindaklanjutByUser(userId: string): Promise<PenindaklanjutKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      p.*,
      l.jenis_kerusakan,
      u.kode_rtg,
      u.nama_rtg as unit_rtg,
      usr.nama as penangan_nama,
      usr.email as penangan_email,
      usr.role as penangan_role
    FROM penindaklanjut_kerusakan p
    LEFT JOIN laporan_kerusakan l ON p.laporan_kerusakan_id = l.id
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    LEFT JOIN users usr ON p.ditangani_oleh_id::uuid = usr.id
    WHERE p.ditangani_oleh_id = $1::uuid
    ORDER BY p.created_at DESC
  `, [userId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai instanceof Date ? row.tanggal_selesai.toISOString() : row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    laporan_kerusakan: {
      jenis_kerusakan: row.jenis_kerusakan,
      rtg_unit: {
        kode_rtg: row.kode_rtg,
        nama_rtg: row.unit_rtg,
      },
    },
    ditangani_oleh: {
      nama: row.penangan_nama,
      email: row.penangan_email,
      role: row.penangan_role,
    },
  }));
}


// ============= RTG STATUS HISTORY =============

export async function createRTGStatusHistory(input: {
  rtg_unit_id: string;
  status_kondisi_sebelumnya?: StatusKondisiRTG | null;
  status_kondisi_baru: StatusKondisiRTG;
  alasan_perubahan?: string;
  laporan_kerusakan_id?: string | null;
  diubah_oleh?: string | null;
}): Promise<RTGStatusHistory> {
  const {
    rtg_unit_id,
    status_kondisi_sebelumnya,
    status_kondisi_baru,
    alasan_perubahan,
    laporan_kerusakan_id,
    diubah_oleh,
  } = input;

  const result = await pool.query(
    `INSERT INTO rtg_status_history (rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh)
     VALUES ($1::uuid, $2, $3, $4, $5::uuid, $6::uuid) RETURNING *`,
    [
      rtg_unit_id,
      status_kondisi_sebelumnya || null,
      status_kondisi_baru,
      alasan_perubahan || null,
      laporan_kerusakan_id || null,
      diubah_oleh || null,
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    status_kondisi_sebelumnya: row.status_kondisi_sebelumnya,
    status_kondisi_baru: row.status_kondisi_baru,
    alasan_perubahan: row.alasan_perubahan,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    diubah_oleh: row.diubah_oleh,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function getRTGUnitHistory(
  rtgUnitId: string,
  limit: number = 50
): Promise<RTGStatusHistoryWithDetails[]> {
  const result = await pool.query(`
    SELECT
      h.*,
      u.kode_rtg,
      u.nama_rtg,
      usr.nama as diubah_oleh_nama,
      usr.email as diubah_oleh_email,
      usr.role as diubah_oleh_role,
      l.foto_laporan,
      l.jenis_kerusakan,
      pk.foto_bukti as penindaklanjut_foto_bukti,
      pk.deskripsi_tindakan,
      pk.tanggal_selesai
    FROM rtg_status_history h
    INNER JOIN rtg_units u ON h.rtg_unit_id = u.id
    LEFT JOIN users usr ON h.diubah_oleh::uuid = usr.id
    LEFT JOIN laporan_kerusakan l ON h.laporan_kerusakan_id = l.id
    LEFT JOIN penindaklanjut_kerusakan pk ON l.id = pk.laporan_kerusakan_id
    WHERE h.rtg_unit_id = $1::uuid
    ORDER BY h.created_at DESC
    LIMIT $2
  `, [rtgUnitId, limit]);

  return result.rows.map((row: any) => ({
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    status_kondisi_sebelumnya: row.status_kondisi_sebelumnya,
    status_kondisi_baru: row.status_kondisi_baru,
    alasan_perubahan: row.alasan_perubahan,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    diubah_oleh: row.diubah_oleh,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    diubah_oleh_details: row.diubah_oleh_nama ? {
      nama: row.diubah_oleh_nama,
      email: row.diubah_oleh_email,
      role: row.diubah_oleh_role,
    } : null,
    foto_laporan: row.foto_laporan || [],
    penindaklanjut_foto_bukti: row.penindaklanjut_foto_bukti || [],
    jenis_kerusakan: row.jenis_kerusakan,
  }));
}

export async function getRTGStatusHistoryByUnit(
  rtgUnitId: string,
  limit: number = 50
): Promise<RTGStatusHistoryWithDetails[]> {
  const result = await pool.query(`
    SELECT
      h.*,
      u.kode_rtg,
      u.nama_rtg,
      usr.nama as diubah_oleh_nama,
      usr.email as diubah_oleh_email,
      usr.role as diubah_oleh_role
    FROM rtg_status_history h
    INNER JOIN rtg_units u ON h.rtg_unit_id = u.id
    LEFT JOIN users usr ON h.diubah_oleh::uuid = usr.id
    WHERE h.rtg_unit_id = $1::uuid
    ORDER BY h.created_at DESC
    LIMIT $2
  `, [rtgUnitId, limit]);

  return result.rows.map((row: any) => ({
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    status_kondisi_sebelumnya: row.status_kondisi_sebelumnya,
    status_kondisi_baru: row.status_kondisi_baru,
    alasan_perubahan: row.alasan_perubahan,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    diubah_oleh: row.diubah_oleh,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    diubah_oleh_details: row.diubah_oleh_nama ? {
      nama: row.diubah_oleh_nama,
      email: row.diubah_oleh_email,
      role: row.diubah_oleh_role,
    } : null,
  }));
}

export async function getRTGMonthlyStats(
  year?: number,
  month?: number
): Promise<RTGMonthlyStats[]> {
  let query = `
    SELECT
      DATE_TRUNC('month', h.created_at) as bulan,
      u.kode_rtg,
      u.nama_rtg,
      COUNT(*) FILTER (
        WHERE h.status_kondisi_baru IN ('READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY')
      ) as jumlah_masalah,
      COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'READY_CATATAN_RINGAN'
      ) as jumlah_catatan_ringan,
      COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'READY_CATATAN_BERAT'
      ) as jumlah_catatan_berat,
      COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'TIDAK_READY'
      ) as jumlah_tidak_ready,
      ARRAY_AGG(DISTINCT h.laporan_kerusakan_id) FILTER (
        WHERE h.laporan_kerusakan_id IS NOT NULL
      ) as laporan_terkait
    FROM rtg_status_history h
    INNER JOIN rtg_units u ON h.rtg_unit_id = u.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (year !== undefined && month !== undefined) {
    conditions.push(`DATE_TRUNC('month', h.created_at) = $1`);
    params.push(`${year}-${month.toString().padStart(2, '0')}-01`);
  } else if (year !== undefined) {
    conditions.push(`EXTRACT(YEAR FROM h.created_at) = $1`);
    params.push(year);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY DATE_TRUNC('month', h.created_at), u.kode_rtg, u.nama_rtg
    ORDER BY DATE_TRUNC('month', h.created_at) DESC, u.kode_rtg
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row: any) => ({
    bulan: row.bulan instanceof Date ? row.bulan.toISOString() : row.bulan,
    kode_rtg: row.kode_rtg,
    nama_rtg: row.nama_rtg,
    jumlah_masalah: parseInt(row.jumlah_masalah) || 0,
    jumlah_catatan_ringan: parseInt(row.jumlah_catatan_ringan) || 0,
    jumlah_catatan_berat: parseInt(row.jumlah_catatan_berat) || 0,
    jumlah_tidak_ready: parseInt(row.jumlah_tidak_ready) || 0,
    laporan_terkait: row.laporan_terkait,
  }));
}

export async function getRTGIssueFrequency(
  rtgUnitId: string,
  months: number = 12
): Promise<{ month: string; count: number }[]> {
  const result = await pool.query(`
    SELECT
      DATE_TRUNC('month', h.created_at) as month,
      COUNT(*) FILTER (
        WHERE h.status_kondisi_baru IN ('READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY')
      ) as count
    FROM rtg_status_history h
    WHERE h.rtg_unit_id = $1::uuid
      AND h.created_at >= CURRENT_DATE - INTERVAL '1 month' * $2
    GROUP BY DATE_TRUNC('month', h.created_at)
    ORDER BY month DESC
  `, [rtgUnitId, months]);

  return result.rows.map((row: any) => ({
    month: row.month instanceof Date ? row.month.toISOString() : row.month,
    count: parseInt(row.count) || 0,
  }));
}
