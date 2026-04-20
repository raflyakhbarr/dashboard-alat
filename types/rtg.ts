// RTG Status Enums
export type StatusKondisiRTG = 'READY' | 'READY_CATATAN_RINGAN' | 'READY_CATATAN_BERAT' | 'TIDAK_READY';
export type StatusPerbaikan = 'DALAM_PROSES' | 'SELESAI' | 'MENUNGGU_PART';

// RTG Group
export interface RTGGroup {
  id: string;
  nama_group: string;
  deskripsi: string | null;
  lokasi: string | null;
  created_at: string;
}

export interface RTGGroupInput {
  nama_group: string;
  deskripsi?: string;
  lokasi?: string;
}

// RTG Unit
export interface RTGUnit {
  id: string;
  kode_rtg: string;
  nama_rtg: string;
  group_rtg_id: string | null;
  group_rtg?: RTGGroup | undefined;
  kapasitas: number | null;
  tahun_pembuatan: number | null;
  manufacturer: string | null;
  spesifikasi: string | null;
  status_kondisi: StatusKondisiRTG;
  created_at: string;
  updated_at: string;
}

export interface RTGUnitInput {
  kode_rtg: string;
  nama_rtg: string;
  group_rtg_id?: string;
  kapasitas?: number;
  tahun_pembuatan?: number;
  manufacturer?: string;
  spesifikasi?: string;
  status_kondisi?: StatusKondisiRTG;
}

export interface RTGUnitWithGroup {
  id: string;
  kode_rtg: string;
  nama_rtg: string;
  group_rtg_id: string | null;
  group_rtg: RTGGroup | null;
  kapasitas: number | null;
  tahun_pembuatan: number | null;
  manufacturer: string | null;
  spesifikasi: string | null;
  status_kondisi: StatusKondisiRTG;
  created_at: string;
  updated_at: string;
}

// Laporan Kerusakan Types
export type StatusKerusakan = 'DIPERIKSA' | 'DITINDAKLANJUTI' | 'SELESAI';
export type PenindakLanjut = 'peralatan_terminal' | 'perencanaan_persediaan' | 'fasilitas';

export interface LaporanKerusakan {
  id: string;
  rtg_unit_id: string;
  dilaporkan_oleh: string;
  nama_pelapor: string;
  email_pelapor: string | null;
  penindak_lanjut: PenindakLanjut;
  tanggal_laporan: string;
  waktu_laporan: string;
  jenis_kerusakan: string;
  deskripsi: string | null;
  foto_laporan: string[];
  status_kerusakan: StatusKerusakan;
  created_at: string;
}

export interface LaporanKerusakanWithDetails extends LaporanKerusakan {
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
    status_kondisi: StatusKondisiRTG;
  };
}

export interface LaporanKerusakanInput {
  rtg_unit_id: string;
  dilaporkan_oleh: string;
  nama_pelapor: string;
  email_pelapor?: string;
  penindak_lanjut: PenindakLanjut;
  tanggal_laporan: string;
  waktu_laporan: string;
  jenis_kerusakan: string;
  deskripsi?: string;
  foto_laporan?: string[];
}

// Status Harian RTG
export interface StatusHarianRTG {
  id: string;
  rtg_unit_id: string;
  rtg_unit?: RTGUnit;
  operator_id: string;
  operator?: { nama: string; email: string };
  tanggal_status: string;
  status_kondisi: StatusKondisiRTG;
  catatan: string | null;
  jam_pemeriksaan: string;
  shift: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHarianRTGInput {
  rtg_unit_id: string;
  tanggal_status: string;
  status_kondisi: StatusKondisiRTG;
  catatan?: string;
  jam_pemeriksaan: string;
  shift: string;
}

// Perbaikan RTG
export interface PerbaikanRTG {
  id: string;
  rtg_unit_id: string;
  rtg_unit?: RTGUnit;
  status_harian_id?: string;
  mekanik_id: string;
  mekanik?: { nama: string; email: string };
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  deskripsi_kerusakan: string;
  tindakan_perbaikan: string;
  suku_cadang_digunakan: string | null;
  biaya: number | null;
  status_perbaikan: StatusPerbaikan;
  status_setelah_perbaikan: 'READY' | 'PERUBA_CEK_ULANG';
  pesan_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerbaikanRTGInput {
  rtg_unit_id: string;
  status_harian_id?: string;
  tanggal_mulai: string;
  deskripsi_kerusakan: string;
  tindakan_perbaikan: string;
  suku_cadang_digunakan?: string;
  biaya?: number;
  status_setelah_perbaikan: 'READY' | 'PERUBA_CEK_ULANG';
  pesan_feedback?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  total_rtg: number;
  ready: number;
  ready_catatan_ringan: number;
  ready_catatan_berat: number;
  tidak_ready: number;
}

// ============= LAPORAN KERUSAKAN TYPES =============

export const StatusKerusakanLabels: Record<StatusKerusakan, string> = {
  DIPERIKSA: 'Diperiksa',
  DITINDAKLANJUTI: 'Ditindaklanjuti',
  SELESAI: 'Selesai',
};

export const PenindakLanjutLabels: Record<PenindakLanjut, string> = {
  peralatan_terminal: 'Peralatan Terminal',
  perencanaan_persediaan: 'Perencanaan Persediaan',
  fasilitas: 'Fasilitas',
};

// Penindaklanjut Kerusakan Types
export interface PenindaklanjutKerusakan {
  id: string;
  laporan_kerusakan_id: string;
  ditangani_oleh_id: string;
  tanggal_selesai: string;
  deskripsi_tindakan: string;
  foto_bukti: string[];
  created_at: string;
}

export interface PenindaklanjutKerusakanInput {
  laporan_kerusakan_id: string;
  ditangani_oleh_id: string;
  tanggal_selesai: string;
  deskripsi_tindakan: string;
  foto_bukti: string[];
}

export interface PenindaklanjutKerusakanWithDetails extends PenindaklanjutKerusakan {
  laporan_kerusakan: {
    jenis_kerusakan: string;
    rtg_unit: {
      kode_rtg: string;
      nama_rtg: string;
    };
  };
  ditangani_oleh: {
    nama: string;
    email: string;
    role: string;
  };
}

// RTG Status History
export interface RTGStatusHistory {
  id: string;
  rtg_unit_id: string;
  status_kondisi_sebelumnya: StatusKondisiRTG | null;
  status_kondisi_baru: StatusKondisiRTG;
  alasan_perubahan: string | null;
  laporan_kerusakan_id: string | null;
  diubah_oleh: string | null;
  created_at: string;
}

export interface RTGStatusHistoryWithDetails extends RTGStatusHistory {
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
  };
  diubah_oleh_details?: {
    nama: string;
    email: string;
    role: string;
  } | null;
  foto_laporan?: string[];
  penindaklanjut_foto_bukti?: string[];
  jenis_kerusakan?: string;
}

// RTG Monthly Statistics
export interface RTGMonthlyStats {
  bulan: string;
  kode_rtg: string;
  nama_rtg: string;
  jumlah_masalah: number;
  jumlah_catatan_ringan: number;
  jumlah_catatan_berat: number;
  jumlah_tidak_ready: number;
  laporan_terkait: string[] | null;
}

// Status display names
export const StatusKondisiLabels: Record<StatusKondisiRTG, string> = {
  READY: 'Ready',
  READY_CATATAN_RINGAN: 'Ready dgn Catatan Ringan',
  READY_CATATAN_BERAT: 'Ready dgn Catatan Berat',
  TIDAK_READY: 'Tidak Ready',
};

export const StatusKondisiColors: Record<StatusKondisiRTG, string> = {
  READY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  READY_CATATAN_RINGAN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  READY_CATATAN_BERAT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  TIDAK_READY: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
