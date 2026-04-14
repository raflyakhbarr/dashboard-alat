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
  DitugaskanKe,
  PenindaklanjutKerusakan,
  PenindaklanjutKerusakanInput,
  PenindaklanjutKerusakanWithDetails,
} from '@/types/rtg';

// ============= RTG GROUPS =============

export async function getAllRTGGroups(): Promise<RTGGroup[]> {
  const result = await pool.query('SELECT * FROM rtg_groups ORDER BY nama_group');
  return result.rows;
}

export async function getRTGGroupById(id: string): Promise<RTGGroup | null> {
  const result = await pool.query('SELECT * FROM rtg_groups WHERE id = $1', [id]);
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
    'UPDATE rtg_groups SET nama_group = COALESCE($1, nama_group), deskripsi = COALESCE($2, deskripsi), lokasi = COALESCE($3, lokasi) WHERE id = $4 RETURNING *',
    [nama_group || null, deskripsi || null, lokasi || null, id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteRTGGroup(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM rtg_groups WHERE id = $1', [id]);
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
      created_at: row.group_created_at || new Date(),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at,
    updated_at: row.updated_at,
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
    WHERE u.id = $1
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
      created_at: row.group_created_at || new Date(),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at,
    updated_at: row.updated_at,
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
     WHERE id = $9
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
    'UPDATE rtg_units SET status_kondisi = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status_kondisi, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteRTGUnit(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM rtg_units WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
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
      created_at: row.group_created_at || new Date(),
    } : null,
    kapasitas: row.kapasitas,
    tahun_pembuatan: row.tahun_pembuatan,
    manufacturer: row.manufacturer,
    spesifikasi: row.spesifikasi,
    status_kondisi: row.status_kondisi,
    created_at: row.created_at,
    updated_at: row.updated_at,
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
    ditugaskan_ke: row.ditugaskan_ke,
    tanggal_laporan: row.tanggal_laporan,
    waktu_laporan: row.waktu_laporan,
    jenis_kerusakan: row.jenis_kerusakan,
    deskripsi: row.deskripsi,
    foto_laporan: row.foto_laporan || [],
    status_kerusakan: row.status_kerusakan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
  };
}

export async function getAllLaporan(): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg
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
      u.nama_rtg
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.id = $1
  `, [id]);

  if (result.rows.length === 0) return null;

  return mapLaporanRow(result.rows[0]);
}

export async function getLaporanByDitugaskan(ditugaskanKe: DitugaskanKe): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.ditugaskan_ke = $1
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `, [ditugaskanKe]);

  return result.rows.map(mapLaporanRow);
}

export async function getLaporanByStatus(status: StatusKerusakan): Promise<LaporanKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg
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
    ditugaskan_ke,
    tanggal_laporan,
    waktu_laporan,
    jenis_kerusakan,
    deskripsi,
    foto_laporan = [],
  } = input;

  const result = await pool.query(
    `INSERT INTO laporan_kerusakan (rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, ditugaskan_ke, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor || null, ditugaskan_ke, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi || null, JSON.stringify(foto_laporan)]
  );

  return result.rows[0];
}

export async function updateLaporanStatus(id: string, status: StatusKerusakan): Promise<LaporanKerusakan | null> {
  const result = await pool.query(
    'UPDATE laporan_kerusakan SET status_kerusakan = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteLaporan(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM laporan_kerusakan WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
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
    LEFT JOIN users usr ON p.ditangani_oleh_id = usr.id
    WHERE p.laporan_kerusakan_id = $1
    ORDER BY p.created_at DESC
  `, [laporanId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti,
    created_at: row.created_at,
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
    LEFT JOIN users usr ON p.ditangani_oleh_id = usr.id
    WHERE p.ditangani_oleh_id = $1
    ORDER BY p.created_at DESC
  `, [userId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti,
    created_at: row.created_at,
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
