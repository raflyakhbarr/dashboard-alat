# Database Schema - Sistem Monitoring RTG

## Tables

### 1. rtg_units (Master Data RTG)
- id (UUID, PK)
- kode_rtg (VARCHAR, UNIQUE) - Contoh: RTG-01, RTG-02
- nama_rtg (VARCHAR) - Contoh: RTG A1, RTG B2
- group_rtg_id (UUID, FK → rtg_groups)
- kapasitas (INTEGER) - Kapasitas lifting (ton)
- tahun_pembuatan (INTEGER)
- manufacturer (VARCHAR)
- spesifikasi (TEXT)
- status_kondisi (VARCHAR) - Enum: 'READY', 'READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2. rtg_groups (Master Data Group RTG)
- id (UUID, PK)
- nama_group (VARCHAR, UNIQUE) - Contoh: Group A, Group B
- deskripsi (TEXT)
- lokasi (VARCHAR) - Area/Block di terminal
- created_at (TIMESTAMP)

### 3. temuan_rtg (Laporan Temuan Operator)
- id (UUID, PK)
- rtg_unit_id (UUID, FK → rtg_units)
- pelapor_id (UUID, FK → users) - Operator
- tanggal_temuan (DATE)
- waktu_temuan (TIME)
- jenis_temuan (VARCHAR) - Contoh: "Kursi rusak", "Kaca retak", "Ban bocor"
- deskripsi_temuan (TEXT)
- foto_1 (VARCHAR) - Path/URL foto
- foto_2 (VARCHAR)
- foto_3 (VARCHAR)
- status_temuan (VARCHAR) - Enum: 'DIPERIKSA', 'DITINDAKLANJUTI', 'SELESAI', 'DITUTUP'
- created_at (TIMESTAMP)

### 4. status_harian_rtg (Input Status Harian Operasional)
- id (UUID, PK)
- rtg_unit_id (UUID, FK → rtg_units)
- operator_id (UUID, FK → users) - Operasional
- tanggal_status (DATE)
- status_kondisi (VARCHAR) - Enum: 'READY', 'READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY'
- catatan (TEXT)
- jam_pemeriksaan (TIME)
- shift (VARCHAR) - Pagi/Siang/Malam
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 5. perbaikan_rtg (Tindak Lanjut Mekanik)
- id (UUID, PK)
- rtg_unit_id (UUID, FK → rtg_units)
- status_harian_id (UUID, FK → status_harian_rtg) - Link ke status "Tidak Ready"
- mekanik_id (UUID, FK → users) - Mekanik
- tanggal_mulai (DATE)
- tanggal_selesai (DATE)
- deskripsi_kerusakan (TEXT)
- tindakan_perbaikan (TEXT)
- suku_cadang_digunakan (TEXT)
- biaya (DECIMAL)
- status_perbaikan (VARCHAR) - Enum: 'DALAM_PROSES', 'SELESAI', 'MENUNGGU_PART'
- status_setelah_perbaikan (VARCHAR) - Enum: 'READY', 'PERUBA_CEK_ULANG'
- pesan_feedback (TEXT) - Jika PERUBA_CEK_ULANG
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 6. users (sudah ada, update kolom)
- id, email, nama, password, role, created_at
- Role tetap: admin, operator, operasional, mekanik

## Status Enum Values

### Status Kondisi RTG:
1. **READY** - Siap dioperasikan tanpa catatan
2. **READY_CATATAN_RINGAN** - Siap dioperasikan dengan catatan ringan
3. **READY_CATATAN_BERAT** - Siap dioperasikan dengan catatan berat (perlu perhatian khusus)
4. **TIDAK_READY** - Tidak siap dioperasikan, perlu perbaikan

### Status Temuan:
1. **DIPERIKSA** - Baru dilaporkan, belum diperiksa
2. **DITINDAKLANJUTI** - Sedang dalam pengerjaan
3. **SELESAI** - Perbaikan selesai
4. **DITUTUP** - Temuan ditutup (tidak jadi/tdk perlu perbaikan)

### Status Perbaikan:
1. **DALAM_PROSES** - Sedang diperbaiki
2. **SELESAI** - Perbaikan selesai
3. **MENUNGGU_PART** - Menunggu suku cadang

## Indexes yang Dibutuhkan:

- idx_rtg_units_kode (kode_rtg)
- idx_rtg_units_status (status_kondisi)
- idx_temuan_rtg_tanggal (tanggal_temuan)
- idx_temuan_rtg_status (status_temuan)
- idx_status_harian_rtg_tanggal (tanggal_status)
- idx_status_harian_rtg_rtg (rtg_unit_id, tanggal_status DESC)
- idx_perbaikan_rtg_status (status_perbaikan)
- idx_perbaikan_rtg_rtg (rtg_unit_id)
