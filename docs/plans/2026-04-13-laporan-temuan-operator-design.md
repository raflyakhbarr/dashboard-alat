# Design Document: Batch 2 - Laporan Temuan (Operator)

**Date:** 2026-04-13
**Author:** Claude
**Status:** Approved

## Overview

Batch 2 mengimplementasikan fitur "Laporan Temuan" untuk Operator melaporkan kerusakan atau masalah pada RTG units. Operator dapat membuat laporan dengan foto, melihat riwayat laporan, dan Operasional/Admin dapat menindaklanjuti laporan tersebut.

## Architecture Approach

**Pendekatan:** Server Component + Server Actions (Next.js 16 Best Practices)
- Form sebagai Server Component untuk SEO dan performa
- Server Actions untuk handle submit form dan upload foto
- Konsisten dengan pattern yang digunakan di admin pages (Batch 1)
- Simple, secure, dan maintainable

## Database Schema

### Table: temuan_rtg

```sql
CREATE TABLE temuan_rtg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rtg_unit_id UUID NOT NULL REFERENCES rtg_units(id) ON DELETE CASCADE,
  pelapor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_temuan DATE NOT NULL,
  waktu_temuan TIME NOT NULL,
  jenis_temuan VARCHAR(255) NOT NULL,
  deskripsi_temuan TEXT,
  foto JSONB DEFAULT '[]'::jsonb,
  status_temuan VARCHAR(50) NOT NULL DEFAULT 'DIPERIKSA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_temuan_rtg_tanggal ON temuan_rtg(tanggal_temuan DESC);
CREATE INDEX idx_temuan_rtg_status ON temuan_rtg(status_temuan);
CREATE INDEX idx_temuan_rtg_pelapor ON temuan_rtg(pelapor_id);
```

**Key Design Decisions:**
- Kolom `foto` menggunakan JSONB untuk menyimpan array of paths (flexible, scalable)
- Foreign key dengan ON DELETE CASCADE untuk data integrity
- Index untuk query performance pada filter yang sering digunakan

## TypeScript Types

### Status Enum
```typescript
export type StatusTemuan = 'DIPERIKSA' | 'DITINDAKLANJUTI' | 'SELESAI' | 'DITUTUP';
```

### Core Types
```typescript
export interface TemuanRTG {
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
}

export interface TemuanRTGWithDetails extends TemuanRTG {
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
  };
  pelapor: {
    nama: string;
    email: string;
  };
}

export interface TemuanRTGInput {
  rtg_unit_id: string;
  tanggal_temuan: string;
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan?: string;
  foto?: string[];
}
```

## Service Layer (lib/rtg.ts)

Fungsi-fungsi CRUD untuk temuan_rtg:

```typescript
export async function getAllTemuan(): Promise<TemuanRTGWithDetails[]>
export async function getTemuanById(id: string): Promise<TemuanRTGWithDetails | null>
export async function getTemuanByPelapor(pelaporId: string): Promise<TemuanRTGWithDetails[]>
export async function getTemuanByStatus(status: StatusTemuan): Promise<TemuanRTGWithDetails[]>
export async function createTemuan(input: TemuanRTGInput & { pelapor_id: string }): Promise<TemuanRTG>
export async function updateTemuanStatus(id: string, status: StatusTemuan): Promise<TemuanRTG | null>
export async function deleteTemuan(id: string): Promise<boolean>
```

**Fitur:**
- Join dengan `rtg_units` dan `users` untuk detail
- Support filter by pelapor dan status
- Handle array foto untuk JSONB column

## Pages & Routes

### 1. `/operator/lapor-temuan` (Server Component)
**Purpose:** Form untuk operator membuat laporan temuan baru

**Komponen:**
- Combobox dengan search/filter untuk pilih RTG unit
- Input field: tanggal (default hari ini), waktu (default sekarang)
- Input field: jenis temuan (free text)
- Textarea: deskripsi temuan (opsional)
- File upload: foto (opsional, max 3 file, max 5MB per file)
- Tombol submit

**Server Action:**
- Validate input
- Handle file upload (simpan ke `public/uploads/temuan/`)
- Create record di database
- Auto-update status RTG jika jenis temuan mengandung keyword tertentu
- Redirect ke riwayat temuan

### 2. `/operator/riwayat-temuan` (Server Component)
**Purpose:** Operator melihat semua laporan yang pernah dibuat

**Komponen:**
- Table dengan kolom: Tanggal, Waktu, Kode RTG, Jenis Temuan, Status (badge)
- Filter dropdown berdasarkan status
- Klik baris untuk lihat detail (termasuk foto)
- Empty state jika belum ada laporan

### 3. `/operasional/daftar-temuan` (Server Component)
**Purpose:** Operasional/Admin melihat dan menindaklanjuti semua laporan temuan

**Komponen:**
- Table dengan kolom: Tanggal, Waktu, Kode RTG, Jenis Temuan, Pelapor, Status
- Filter: status, tanggal range, pelapor
- Action dropdown per row: Update status (DIPERIKSA → DITINDAKLANJUTI → SELESAI/DITUTUP)
- Badge counter di sidebar untuk temuan status "DIPERIKSA"

**Akses:** Role operasional dan admin

## Photo Upload

**Mekanisme:**
1. Form menggunakan `<input type="file" multiple accept="image/*">`
2. Server action handle upload:
   - Validate file type (jpg, jpeg, png, webp)
   - Validate max 3 files per request
   - Validate max 5MB per file
   - Generate unique filename: `temuan-{uuid}-{timestamp}.{ext}`
   - Simpan di `public/uploads/temuan/`
   - Return array of file paths

**Security Measures:**
- Validate MIME type dan file extension
- Sanitize filename
- Limit file size
- Hanya accept image files

## Workflow & Status Updates

### Status Workflow
1. **DIPERIKSA** (default) - Laporan baru dibuat operator
2. **DITINDAKLANJUTI** - Operasional/Admin mulai menindaklanjuti
3. **SELESAI** - Perbaikan selesai
4. **DITUTUP** - Temuan ditutup (tidak jadi/tdk perlu perbaikan)

### Auto-update RTG Status
Sistem otomatis update status kondisi RTG ke "TIDAK_READY" jika:
- Jenis temuan mengandung keywords: "berat", "rusak parah", "bahaya", "bocor", "patah"
- Keywords dapat dikonfigurasi di environment variable atau config file

### Notifications
- Badge counter di sidebar untuk Operasional/Admin (jumlah temuan status "DIPERIKSA")
- Toast notification saat ada temuan baru
- Notifikasi hanya di aplikasi web, tanpa email

## Sidebar Navigation

### Menu untuk Operator:
- **Laporan Temuan**
  - Buat Laporan Baru → `/operator/lapor-temuan`
  - Riwayat Laporan → `/operator/riwayat-temuan`

### Menu untuk Operasional:
- **Temuan Masuk**
  - Daftar Temuan → `/operasional/daftar-temuan` (dengan badge count)

### Menu untuk Admin:
- Akses penuh ke semua menu operator dan operasional

## UI/UX Considerations

### Form Lapor Temuan
- Menggunakan shadcn/ui components (Card, Input, Label, Button, Combobox)
- Combobox dengan search untuk memilih RTG (lebih user-friendly daripada dropdown panjang)
- File upload dengan preview foto sebelum submit
- Client-side validation sebelum submit

### Riwayat & Daftar Temuan
- Table dengan shadcn Table component
- Color-coded status badges:
  - DIPERIKSA: Yellow
  - DITINDAKLANJUTI: Blue
  - SELESAI: Green
  - DITUTUP: Gray
- Responsive design untuk mobile

### Success/Error States
- Toast notification untuk success/error
- Error message di form jika validasi gagal
- Loading state saat upload foto

## Implementation Checklist

- [ ] Create database migration for `temuan_rtg` table
- [ ] Add TypeScript types to `types/rtg.ts`
- [ ] Implement service layer functions in `lib/rtg.ts`
- [ ] Create server action for photo upload
- [ ] Create `/operator/lapor-temuan` page with form
- [ ] Create `/operator/riwayat-temuan` page
- [ ] Create `/operasional/daftar-temuan` page
- [ ] Update `components/app-sidebar.tsx` with new menus
- [ ] Create `public/uploads/temuan/` directory
- [ ] Implement auto-update RTG status logic
- [ ] Add badge counter logic for sidebar
- [ ] Test all user flows

## Future Enhancements (Out of Scope)

- Email notifications
- Real-time updates with WebSocket/SSE
- Photo editing/cropping before upload
- Advanced filtering and search
- Export to PDF/Excel
- Mobile app version