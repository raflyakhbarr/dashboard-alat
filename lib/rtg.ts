import pool from '@/lib/db';
import {
  RTGGroup,
  RTGGroupInput,
  RTGUnit,
  RTGUnitInput,
  RTGUnitWithGroup,
  StatusKondisiRTG,
  DashboardStats,
  TemuanRTG,
  TemuanRTGWithDetails,
  TemuanRTGInput,
  StatusTemuan,
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

// ============= TEMUAN RTG =============

function mapTemuanRow(row: any): TemuanRTGWithDetails {
  return {
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    pelapor_id: row.pelapor_id,
    tanggal_temuan: row.tanggal_temuan,
    waktu_temuan: row.waktu_temuan,
    jenis_temuan: row.jenis_temuan,
    deskripsi_temuan: row.deskripsi_temuan,
    foto: row.foto || [],
    status_temuan: row.status_temuan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    pelapor: {
      nama: row.pelapor_nama,
      email: row.pelapor_email,
    },
  };
}

export async function getAllTemuan(): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `);

  return result.rows.map(mapTemuanRow);
}

export async function getTemuanById(id: string): Promise<TemuanRTGWithDetails | null> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.id = $1
  `, [id]);

  if (result.rows.length === 0) return null;

  return mapTemuanRow(result.rows[0]);
}

export async function getTemuanByPelapor(pelaporId: string): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.pelapor_id = $1
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `, [pelaporId]);

  return result.rows.map(mapTemuanRow);
}

export async function getTemuanByStatus(status: StatusTemuan): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.status_temuan = $1
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `, [status]);

  return result.rows.map(mapTemuanRow);
}

export async function createTemuan(input: TemuanRTGInput & { pelapor_id: string }): Promise<TemuanRTG> {
  const {
    rtg_unit_id,
    pelapor_id,
    tanggal_temuan,
    waktu_temuan,
    jenis_temuan,
    deskripsi_temuan,
    foto = [],
  } = input;

  const result = await pool.query(
    `INSERT INTO temuan_rtg (rtg_unit_id, pelapor_id, tanggal_temuan, waktu_temuan, jenis_temuan, deskripsi_temuan, foto)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [rtg_unit_id, pelapor_id, tanggal_temuan, waktu_temuan, jenis_temuan, deskripsi_temuan || null, JSON.stringify(foto)]
  );

  return result.rows[0];
}

export async function updateTemuanStatus(id: string, status: StatusTemuan): Promise<TemuanRTG | null> {
  const result = await pool.query(
    'UPDATE temuan_rtg SET status_temuan = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteTemuan(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM temuan_rtg WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function getTemuanCountByStatus(): Promise<Record<StatusTemuan, number>> {
  const result = await pool.query(`
    SELECT
      status_temuan,
      COUNT(*) as count
    FROM temuan_rtg
    GROUP BY status_temuan
  `);

  const counts: Record<string, number> = {
    DIPERIKSA: 0,
    DITINDAKLANJUTI: 0,
    SELESAI: 0,
    DITUTUP: 0,
  };

  result.rows.forEach((row: any) => {
    counts[row.status_temuan] = parseInt(row.count);
  });

  return counts as Record<StatusTemuan, number>;
}
