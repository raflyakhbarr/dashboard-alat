# RTG Status History - Migration Guide

## Overview
Migration ini menambahkan sistem tracking/log untuk perubahan status RTG. Setiap kali status RTG berubah, sistem akan mencatat history yang dapat digunakan untuk:
- Melihat berapa kali RTG bermasalah dalam satu bulan
- Membuat laporan statistik
- Tracking pattern kerusakan
- Audit trail perubahan status

## Files yang Dibuat/Diubah

### 1. Migration Files
- `migrations/add_rtg_status_history.sql` - Migration untuk membuat tabel dan view
- `migrations/rollback_add_rtg_status_history.sql` - Rollback migration

### 2. Types
- `types/rtg.ts` - Menambahkan interface:
  - `RTGStatusHistory`
  - `RTGStatusHistoryWithDetails`
  - `RTGMonthlyStats`

### 3. Library Functions
- `lib/rtg.ts` - Menambahkan fungsi:
  - `createRTGStatusHistory()` - Mencatat history perubahan status
  - `getRTGStatusHistoryByUnit()` - Mengambil history per unit
  - `getRTGMonthlyStats()` - Mengambil statistik bulanan
  - `getRTGIssueFrequency()` - Mengambil frekuensi masalah

### 4. Pages
- `app/operasional/history/page.tsx` - Halaman untuk melihat history per unit RTG

### 5. Sidebar
- `components/app-sidebar.tsx` - Menambahkan menu "History"

## Cara Menjalankan Migration

### 1. Jalankan Migration
```bash
psql -U your_username -d your_database -f migrations/add_rtg_status_history.sql
```

### 2. Verifikasi Tabel
```sql
\d rtg_status_history
```

### 3. Verifikasi View
```sql
SELECT * FROM vw_rtg_monthly_stats;
```

## Cara Menggunakan

### 1. Mencatat History Saat Status Berubah

Saat status RTG diubah (misalnya saat membuat laporan kerusakan), panggil fungsi `createRTGStatusHistory()`:

```typescript
import { createRTGStatusHistory } from '@/lib/rtg';

// Contoh: Saat membuat laporan kerusakan
await createRTGStatusHistory({
  rtg_unit_id: 'unit-uuid',
  status_kondisi_sebelumnya: 'READY',
  status_kondisi_baru: 'READY_CATATAN_RINGAN',
  alasan_perubahan: 'Lapor kerusakan #123',
  laporan_kerusakan_id: 'laporan-uuid',
  diubah_oleh: 'nama_user',
});
```

### 2. Mengambil History Unit

```typescript
import { getRTGStatusHistoryByUnit } from '@/lib/rtg';

const history = await getRTGStatusHistoryByUnit('unit-uuid', 50);
// Returns: Array of RTGStatusHistoryWithDetails
```

### 3. Mengambil Statistik Bulanan

```typescript
import { getRTGMonthlyStats } from '@/lib/rtg';

// Statistik untuk tahun dan bulan tertentu
const stats = await getRTGMonthlyStats(2024, 12);

// Statistik untuk seluruh tahun
const stats = await getRTGMonthlyStats(2024);

// Statistik untuk semua data
const stats = await getRTGMonthlyStats();
```

### 4. Melihat History di UI

Buka menu "History" di sidebar untuk melihat semua log perubahan status RTG per unit.

## Struktur Tabel

### rtg_status_history
```sql
- id (UUID, Primary Key)
- rtg_unit_id (UUID, Foreign Key ke rtg_units)
- status_kondisi_sebelumnya (VARCHAR, nullable)
- status_kondisi_baru (VARCHAR, not null)
- alasan_perubahan (TEXT, nullable)
- laporan_kerusakan_id (UUID, Foreign Key ke laporan_kerusakan, nullable)
- diubah_oleh (VARCHAR, nullable)
- created_at (TIMESTAMP, default: CURRENT_TIMESTAMP)
```

## View untuk Statistik

### vw_rtg_monthly_stats
View yang mengagregasi data history per bulan per unit:
```sql
- bulan (DATE_TRUNC to month)
- kode_rtg
- nama_rtg
- jumlah_masalah (total perubahan ke status tidak ready)
- jumlah_catatan_ringan
- jumlah_catatan_berat
- jumlah_tidak_ready
- laporan_terkait (array of laporan IDs)
```

## Rollback

Jika perlu rollback migration:
```bash
psql -U your_username -d your_database -f migrations/rollback_add_rtg_status_history.sql
```

## Tips

1. **Otomatisasi**: Untuk mengotomatisasi pencatatan history, panggil `createRTGStatusHistory()` setiap kali status RTG diubah.

2. **Filter**: Gunakan parameter year/month di `getRTGMonthlyStats()` untuk filter periode tertentu.

3. **Performance**: Tabel sudah di-index untuk query cepat berdasarkan unit_id dan created_at.

4. **Audit**: Semua perubahan status tercatat dengan timestamp, sehingga dapat digunakan untuk audit.

## Contoh Query Langsung

### Melihat history unit tertentu
```sql
SELECT * FROM rtg_status_history
WHERE rtg_unit_id = 'unit-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

### Statistik bulanan
```sql
SELECT * FROM vw_rtg_monthly_stats
WHERE EXTRACT(YEAR FROM bulan) = 2024
  AND EXTRACT(MONTH FROM bulan) = 12;
```

### Unit paling bermasalah
```sql
SELECT
  u.kode_rtg,
  u.nama_rtg,
  COUNT(*) as jumlah_masalah
FROM rtg_status_history h
JOIN rtg_units u ON h.rtg_unit_id = u.id
WHERE h.status_kondisi_baru IN ('READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY')
  AND EXTRACT(MONTH FROM h.created_at) = 12
  AND EXTRACT(YEAR FROM h.created_at) = 2024
GROUP BY u.kode_rtg, u.nama_rtg
ORDER BY jumlah_masalah DESC;
```
