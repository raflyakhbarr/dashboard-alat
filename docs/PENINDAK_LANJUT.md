# Penindak Lanjut Laporan Kerusakan RTG

## Overview

Fitur ini memungkinkan tim Fasilitas, Peralatan Terminal, dan Perencanaan Persediaan untuk menindaklanjuti laporan kerusakan yang dibuat oleh tim operasional.

## Files yang Dibuat

### Dashboard Pages
1. **`app/fasilitas/page.tsx`** - Dashboard untuk role fasilitas
2. **`app/peralatan_terminal/page.tsx`** - Dashboard untuk role peralatan terminal
3. **`app/perencanaan_persediaan/page.tsx`** - Dashboard untuk role perencanaan persediaan

### Penindak Lanjut Pages
1. **`app/fasilitas/penindak-lanjut/page.tsx`** - Halaman penindak lanjut untuk fasilitas
2. **`app/peralatan_terminal/penindak-lanjut/page.tsx`** - Halaman penindak lanjut untuk peralatan terminal
3. **`app/perencanaan_persediaan/penindak-lanjut/page.tsx`** - Halaman penindak lanjut untuk perencanaan persediaan

## Workflow

### 1. Operasional Membuat Laporan
- Tim operasional membuat laporan kerusakan melalui menu "Buat Laporan"
- Memilih tim penindak lanjut: Fasilitas, Peralatan Terminal, atau Perencanaan Persediaan
- Status laporan: "DIPERIKSA"

### 2. Tim Terkait Melihat Laporan
- Login sesuai role (fasilitas/peralatan_terminal/perencanaan_persediaan)
- Buka menu "Penindak Lanjut"
- Melihat daftar laporan yang perlu ditindaklanjuti
- Filter status laporan: "DIPERIKSA" atau "DITINDAKLANJUTI"

### 3. Tim Melakukan Penindak Lanjut
- Klik tombol "Tangani" pada laporan yang dipilih
- Mengisi form:
  - **Tanggal Selesai**: Tanggal penyelesaian tindakan
  - **Deskripsi Tindakan**: Detail tindakan yang dilakukan
  - **Foto Bukti**: Upload foto bukti pengerjaan (opsional, max 3 foto)
- Submit form

### 4. Status Update Otomatis
Setelah submit penindak lanjut:
- Status laporan otomatis berubah menjadi "SELESAI"
- Data tersimpan di tabel `penindaklanjut_kerusakan`
- Riwayat ditampilkan di dashboard masing-masing role

## Struktur Tabel

### penindaklanjut_kerusakan
```sql
- id (UUID, Primary Key)
- laporan_kerusakan_id (UUID, Foreign Key)
- ditangani_oleh_id (UUID, Foreign Key ke users)
- tanggal_selesai (DATE)
- deskripsi_tindakan (TEXT)
- foto_bukti (JSONB array of strings)
- created_at (TIMESTAMP)
```

## Library Functions yang Digunakan

### 1. `getLaporanByPenindakLanjut(penindakLanjut)`
Mengambil semua laporan yang ditugaskan ke tim tertentu.

```typescript
const laporanFasilitas = await getLaporanByPenindakLanjut('fasilitas');
const laporanPeralatan = await getLaporanByPenindakLanjut('peralatan_terminal');
const laporanPerencanaan = await getLaporanByPenindakLanjut('perencanaan_persediaan');
```

### 2. `createPenindaklanjut(input)`
Membuat record penindak lanjut baru.

```typescript
await createPenindaklanjut({
  laporan_kerusakan_id: 'laporan-id',
  ditangani_oleh_id: 'user-id',
  tanggal_selesai: '2024-12-15',
  deskripsi_tindakan: 'Ban diganti dengan yang baru',
  foto_bukti: ['url-foto-1', 'url-foto-2'],
});
```

### 3. `getPenindaklanjutByUser(userId)`
Mengambil semua riwayat penindak lanjut yang dilakukan oleh user tertentu.

```typescript
const riwayat = await getPenindaklanjutByUser(session.userId);
```

## Dashboard Pages

Setiap role memiliki dashboard dengan:

1. **Quick Actions**
   - Card navigasi ke halaman Penindak Lanjut

2. **Statistics**
   - Total penindak lanjut yang selesai

3. **Recent Activity**
   - 5 riwayat penindak lanjut terakhir

## URL Access

- **Fasilitas**: `https://domain.com/fasilitas/penindak-lanjut`
- **Peralatan Terminal**: `https://domain.com/peralatan_terminal/penindak-lanjut`
- **Perencanaan Persediaan**: `https://domain.com/perencanaan_persediaan/penindak-lanjut`

## Catatan

1. **Otorisasi**: Setiap halaman memeriksa role user sebelum mengakses
2. **Upload Foto**: Menggunakan fungsi `uploadPhotos()` dari `lib/upload.ts`
3. **Status Update**: Otomatis update status laporan menjadi "SELESAI" setelah penindak lanjut disubmit
4. **Multiple Penindak Lanjut**: Satu laporan bisa memiliki multiple penindak lanjut (history)

## Contoh Query untuk Melihat Penindak Lanjut

```sql
-- Lihat semua penindak lanjut untuk laporan tertentu
SELECT
  p.*,
  l.jenis_kerusakan,
  u.kode_rtg,
  u.nama_rtg,
  usr.nama as penangan_nama
FROM penindaklanjut_kerusakan p
LEFT JOIN laporan_kerusakan l ON p.laporan_kerusakan_id = l.id
LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
LEFT JOIN users usr ON p.ditangani_oleh_id = usr.id
WHERE p.laporan_kerusakan_id = 'laporan-id'
ORDER BY p.created_at DESC;
```
