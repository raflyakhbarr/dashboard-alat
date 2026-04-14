# Redesign: Roles & Laporan Kerusakan System

**Date:** 2026-04-14
**Status:** APPROVED
**Type:** Complete Redesign

## Overview

Redesign complete sistem monitoring RTG untuk menghapus roles admin/operator/mekanik dan menggantinya dengan workflow baru di mana operasional membuat laporan dan menugaskan ke role spesialis (peralatan_terminal, perencanaan_persediaan, fasilitas) untuk penindaklanjut.

## Background

**Original System:**
- Roles: admin, operator, operasional, mekanik
- Workflow: Operator lapor → Operasional update status → Mekanik perbaiki
- Issue: Terlalu complex, tidak efisien

**New System:**
- Roles: operasional, peralatan_terminal, perencanaan_persediaan, fasilitas
- Workflow: Operasional lapor + assign → Role spesialis tindak lanjut
- Lebih efisien dan jelas tanggung jawab

## Database Schema Changes

### 1. Users Table

```sql
DROP TABLE users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN (
    'operasional',
    'peralatan_terminal',
    'perencanaan_persediaan',
    'fasilitas'
  ))
);
```

**Roles Baru:**
- `operasional` - Manage master data, create laporan, assign penindaklanjut
- `peralatan_terminal` - Handle RTG equipment issues
- `perencanaan_persediaan` - Handle planning/spare parts issues
- `fasilitas` - Handle facility/infrastructure issues

### 2. Laporan Kerusakan Table

```sql
DROP TABLE temuan_rtg CASCADE;

CREATE TABLE laporan_kerusakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rtg_unit_id UUID NOT NULL REFERENCES rtg_units(id) ON DELETE CASCADE,
  dilaporkan_oleh VARCHAR(255) NOT NULL,
  nama_pelapor VARCHAR(255) NOT NULL,
  email_pelapor VARCHAR(255),
  ditugaskan_ke VARCHAR(50) NOT NULL,
  tanggal_laporan DATE NOT NULL,
  waktu_laporan TIME NOT NULL,
  jenis_kerusakan VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  foto_laporan JSONB DEFAULT '[]'::jsonb,
  status_kerusakan VARCHAR(50) NOT NULL DEFAULT 'DIPERIKSA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ditugaskan_ke CHECK (ditugaskan_ke IN (
    'peralatan_terminal',
    'perencanaan_persediaan',
    'fasilitas'
  )),
  CONSTRAINT chk_status_kerusakan CHECK (status_kerusakan IN (
    'DIPERIKSA',
    'DITINDAKLANJUTI',
    'SELESAI'
  ))
);

CREATE INDEX idx_laporan_kerusakan_tanggal ON laporan_kerusakan(tanggal_laporan DESC);
CREATE INDEX idx_laporan_kerusakan_status ON laporan_kerusakan(status_kerusakan);
CREATE INDEX idx_laporan_kerusakan_ditugaskan ON laporan_kerusakan(ditugaskan_ke);
```

**Perubahan dari temuan_rtg:**
- `pelapor_id` (FK) → `dilaporkan_oleh` (text input manual)
- Add `nama_pelapor`, `email_pelapor` (manual input)
- Add `ditugaskan_ke` (enum role baru)
- `status_temuan` → `status_kerusakan` (3 status saja, no DITUTUP)
- `jenis_temuan` → `jenis_kerusakan`
- `foto` → `foto_laporan`

### 3. Penindaklanjut Kerusakan Table

```sql
CREATE TABLE penindaklanjut_kerusakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_kerusakan_id UUID NOT NULL REFERENCES laporan_kerusakan(id) ON DELETE CASCADE,
  ditangani_oleh_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_selesai DATE NOT NULL,
  deskripsi_tindakan TEXT NOT NULL,
  foto_bukti JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_penindaklanjut_laporan ON penindaklanjut_kerusakan(laporan_kerusakan_id);
CREATE INDEX idx_penindaklanjut_penangan ON penindaklanjut_kerusakan(ditangani_oleh_id);
```

**Penjelasan:**
- `laporan_kerusakan_id` - FK ke laporan_kerusakan
- `ditangani_oleh_id` - FK ke users (role yang menyelesaikan)
- `tanggal_selesai` - Tanggal penyelesaian
- `deskripsi_tindakan` - Deskripsi tindakan yang dilakukan
- `foto_bukti` - Array foto bukti penyelesaian (required)

## Routes & Pages Structure

### DELETE (Removed Routes):
- `/app/admin/` - Admin pages deleted
- `/app/operator/` - Operator pages deleted

### `/app/operasional/` (Role: operasional)
- `/dashboard` - Overview statistik RTG dan laporan
- `/rtg-groups` - Manage RTG Groups (dari admin)
- `/rtg-units` - Manage RTG Units (dari admin)
- `/buat-laporan` - Form buat laporan kerusakan
- `/daftar-laporan` - Semua laporan, assign ke role baru
- `/riwayat-laporan` - History laporan yang dibuat

### `/app/peralatan-terminal/` (Role: peralatan_terminal)
- `/dashboard` - Overview
- `/tugas-saya` - Laporan yang ditugaskan ke role ini
- `/riwayat` - History penyelesaian

### `/app/perencanaan-persediaan/` (Role: perencanaan_persediaan)
- `/dashboard` - Overview
- `/tugas-saya` - Laporan yang ditugaskan ke role ini
- `/riwayat` - History penyelesaian

### `/app/fasilitas/` (Role: fasilitas)
- `/dashboard` - Overview
- `/tugas-saya` - Laporan yang ditugaskan ke role ini
- `/riwayat` - History penyelesaian

## Workflow & Business Logic

### Status Workflow:

1. **DIPERIKSA** (Default)
   - Status awal saat laporan dibuat
   - Location: `/operasional/daftar-laporan`
   - Action: Operasional assign ke salah satu role

2. **DITINDAKLANJUTI**
   - Status setelah di-assign
   - Location: `/{role}/tugas-saya`
   - Action: Role yang ditugaskan buka form penindaklanjut

3. **SELESAI**
   - Status setelah form penindaklanjut disubmit
   - Final state

### Form Flow: Operasional → Buat Laporan

```
Route: /operasional/buat-laporan
Method: POST (Server Action)

Form Fields:
- RTG Unit (Select dropdown dari rtg_units)
- Dilaporkan oleh (Text input)
- Nama pelapor (Text input)
- Email pelapor (Text input, optional)
- Tanggal laporan (Date input, default today)
- Waktu laporan (Time input, default now)
- Jenis kerusakan (Text input, required)
- Deskripsi (Textarea, optional)
- Foto laporan (File upload, optional, max 3)
- Ditugaskan ke (Select: peralatan_terminal | perencanaan_persediaan | fasilitas)

Submit Action:
1. Create record laporan_kerusakan
2. Set status_kerusakan = 'DIPERIKSA'
3. Redirect to /operasional/daftar-laporan
```

### Form Flow: Role Baru → Penindaklanjut

```
Route: /{role}/tugas-saya
Method: POST (Server Action)

From list laporan, click "Tindak Lanjut" button → Open form

Form Fields:
- Tanggal selesai (Date input, default today)
- Deskripsi tindakan (Textarea, required)
- Foto bukti (File upload, required, max 3)

Submit Action:
1. Create record penindaklanjut_kerusakan
2. Update laporan_kerusakan:
   - status_kerusakan = 'SELESAI'
3. Redirect to /{role}/tugas-saya
```

## TypeScript Types

### Update types/auth.ts

```typescript
export type UserRole = 'operasional' | 'peralatan_terminal' | 'perencanaan_persediaan' | 'fasilitas';
```

### Replace types/rtg.ts

```typescript
// Delete: TemuanRTG, TemuanRTGWithDetails, TemuanRTGInput, StatusTemuan

// Add:
export type StatusKerusakan = 'DIPERIKSA' | 'DITINDAKLANJUTI' | 'SELESAI';
export type RoleTugas = 'peralatan_terminal' | 'perencanaan_persediaan' | 'fasilitas';

export interface LaporanKerusakan {
  id: string;
  rtg_unit_id: string;
  dilaporkan_oleh: string;
  nama_pelapor: string;
  email_pelapor: string | null;
  ditugaskan_ke: RoleTugas;
  tanggal_laporan: string;
  waktu_laporan: string;
  jenis_kerusakan: string;
  deskripsi: string | null;
  foto_laporan: string[];
  status_kerusakan: StatusKerusakan;
  created_at: string;
}

export interface LaporanKerusakanWithRTG extends LaporanKerusakan {
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
  };
}

export interface LaporanKerusakanInput {
  rtg_unit_id: string;
  dilaporkan_oleh: string;
  nama_pelapor: string;
  email_pelapor?: string;
  ditugaskan_ke: RoleTugas;
  tanggal_laporan: string;
  waktu_laporan: string;
  jenis_kerusakan: string;
  deskripsi?: string;
  foto_laporan?: string[];
}

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
  tanggal_selesai: string;
  deskripsi_tindakan: string;
  foto_bukti: string[];
}
```

## Implementation Strategy

### Phase 1: Database Reset
1. Stop dev server
2. Drop existing tables: `users`, `temuan_rtg`
3. Create new tables: `users`, `laporan_kerusakan`, `penindaklanjut_kerusakan`
4. Insert seed users untuk 4 roles
5. Start dev server

### Phase 2: TypeScript Types
1. Update `types/auth.ts` - New UserRole type
2. Replace `types/rtg.ts` - Delete old types, add new LaporanKerusakan types
3. Add PenindaklanjutKerusakan types

### Phase 3: Service Layer
1. Update `lib/auth.ts` - Handle new roles in login/session
2. Replace temuan functions in `lib/rtg.ts` with laporan functions:
   - getAllLaporanKerusakan()
   - getLaporanKerusakanById()
   - getLaporanByDitugaskan()
   - createLaporanKerusakan()
   - updateStatusKerusakan()
3. Add penindaklanjut functions:
   - createPenindaklanjut()
   - getPenindaklanjutByLaporan()

### Phase 4: Pages - Delete
1. DELETE folder: `/app/admin/`
2. DELETE folder: `/app/operator/`

### Phase 5: Pages - Create Operasional
1. CREATE: `/app/operasional/dashboard/page.tsx`
2. CREATE: `/app/operasional/rtg-groups/page.tsx` (move from admin)
3. CREATE: `/app/operasional/rtg-units/page.tsx` (move from admin)
4. CREATE: `/app/operasional/buat-laporan/page.tsx`
5. CREATE: `/app/operasional/daftar-laporan/page.tsx`
6. CREATE: `/app/operasional/riwayat-laporan/page.tsx`

### Phase 6: Pages - Create Role Baru
1. CREATE: `/app/peralatan-terminal/tugas-saya/page.tsx`
2. CREATE: `/app/perencanaan-persediaan/tugas-saya/page.tsx`
3. CREATE: `/app/fasilitas/tugas-saya/page.tsx`
4. Each with form penindaklanjut

### Phase 7: Components Update
1. UPDATE: `components/app-sidebar.tsx` - New role-based menus
2. UPDATE: `components/nav-user.tsx` - Handle new roles
3. UPDATE: `middleware.ts` - Update role checks

### Phase 8: Testing
1. Test operasional flow: buat laporan → assign → view daftar
2. Test role baru flow: view tugas → tindak lanjut → selesaikan
3. Verify status transitions
4. Verify role-based access control

## Migration Notes

**Data Loss Warning:**
- Dropping `users` table akan menghapus semua user accounts
- Dropping `temuan_rtg` table akan menghapus semua existing laporan

**Rollback Strategy:**
- Backup database sebelum migration
- Save SQL dump dari existing tables
- Document migration date untuk reference

## Success Criteria

✅ 4 roles baru berfungsi dengan correct permissions
✅ Operasional dapat buat laporan dan assign ke role baru
✅ Role baru dapat view tugas dan submit penindaklanjut
✅ Status transitions: DIPERIKSA → DITINDAKLANJUTI → SELESAI
✅ All role-based access controls berfungsi
✅ Sidebar menus correct per role
✅ No errors di build dan runtime

## Next Steps

Setelah design disetujui:
1. Create implementation plan menggunakan writing-plans skill
2. Execute migration dan development
3. Test thoroughly
4. Deploy
