// RTG Status Enums
export type StatusKondisiRTG = 'READY' | 'READY_CATATAN_RINGAN' | 'READY_CATATAN_BERAT' | 'TIDAK_READY';
export type StatusTemuan = 'DIPERIKSA' | 'DITINDAKLANJUTI' | 'SELESAI' | 'DITUTUP';
export type StatusPerbaikan = 'DALAM_PROSES' | 'SELESAI' | 'MENUNGGU_PART';

// RTG Group
export interface RTGGroup {
  id: string;
  nama_group: string;
  deskripsi: string | null;
  lokasi: string | null;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

// Temuan RTG
export interface TemuanRTG {
  id: string;
  rtg_unit_id: string;
  pelapor_id: string;
  tanggal_temuan: string;  // Changed from Date to string for ISO format
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan: string | null;  // Changed from required to nullable
  foto: string[];  // Changed from foto_1, foto_2, foto_3 to array
  status_temuan: StatusTemuan;
  created_at: string;  // Changed from Date to string
}

export interface TemuanRTGInput {
  rtg_unit_id: string;
  tanggal_temuan: string;
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan?: string;  // Optional
  foto?: string[];  // Changed from foto_1, foto_2, foto_3 to array
}

// Status Harian RTG
export interface StatusHarianRTG {
  id: string;
  rtg_unit_id: string;
  rtg_unit?: RTGUnit;
  operator_id: string;
  operator?: { nama: string; email: string };
  tanggal_status: Date;
  status_kondisi: StatusKondisiRTG;
  catatan: string | null;
  jam_pemeriksaan: string;
  shift: string;
  created_at: Date;
  updated_at: Date;
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
  tanggal_mulai: Date;
  tanggal_selesai: Date | null;
  deskripsi_kerusakan: string;
  tindakan_perbaikan: string;
  suku_cadang_digunakan: string | null;
  biaya: number | null;
  status_perbaikan: StatusPerbaikan;
  status_setelah_perbaikan: 'READY' | 'PERUBA_CEK_ULANG';
  pesan_feedback: string | null;
  created_at: Date;
  updated_at: Date;
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

// ============= TEMUAN RTG TYPES =============

export interface TemuanRTGWithDetails {
  id: string;
  rtg_unit_id: string;
  pelapor_id: string;
  tanggal_temuan: string;
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan: string | null;
  foto: string[];
  status_temuan: StatusTemuan;
  created_at: string;
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
  };
  pelapor: {
    nama: string;
    email: string;
  };
}

export const StatusTemuanLabels: Record<StatusTemuan, string> = {
  DIPERIKSA: 'Diperiksa',
  DITINDAKLANJUTI: 'Ditindaklanjuti',
  SELESAI: 'Selesai',
  DITUTUP: 'Ditutup',
};

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
