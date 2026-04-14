# Complete Redesign: Roles & Laporan Kerusakan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign complete sistem monitoring RTG - hapus roles admin/operator/mekanik, implement workflow baru di mana operasional membuat laporan dan menugaskan ke role spesialis untuk penindaklanjut.

**Architecture:** Complete database redesign (drop & recreate tables), update TypeScript types, replace service layer functions, delete/create pages, update components, implement new workflow.

**Tech Stack:** Next.js 16 (App Router), PostgreSQL, pg library, shadcn/ui components, TypeScript, Server Actions, bcrypt for passwords.

---

## Task 1: Backup Database

**Files:**
- Execute: psql command
- Output: Backup file

**Step 1: Create database backup**

Run: `pg_dump -h localhost -U postgres -d dashboard_alat > backup_before_redesign_$(date +%Y%m%d_%H%M%S).sql`

Enter password when prompted: `123111`

Expected: File `backup_before_redesign_<timestamp>.sql` created in current directory

**Step 2: Verify backup file exists**

Run: `ls -lh backup_before_redesign_*.sql | tail -1`

Expected: Output shows backup file with size (should be 10-50KB for small database)

**Step 3: Commit backup reminder**

```bash
git add -A
git commit -m "checkpoint: database backup created before redesign migration"
```

---

## Task 2: Stop Development Server

**Files:**
- Process management

**Step 1: Stop dev server if running**

Run: `tasklist | grep -i "node\|next"` (Windows) or `ps aux | grep "next dev"` (Linux/Mac)

If running, kill process: Windows use Task Manager, Linux/Mac use `kill <pid>`

Expected: No node/next processes running

---

## Task 3: Create Database Migration Script

**Files:**
- Create: `lib/migrations/005_redesign_roles_laporan.sql`

**Step 1: Write migration SQL**

Create file with:

```sql
-- ================================================================
-- COMPLETE REDESIGN: Roles & Laporan Kerusakan System
-- Date: 2026-04-14
-- ================================================================

-- Drop existing tables (CASCADE to drop dependent objects)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS temuan_rtg CASCADE;

-- Create new users table with 4 roles
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

-- Insert seed users for each role (password: password123 for all, bcrypt hashed)
INSERT INTO users (email, nama, password, role) VALUES
  ('operasional@tps.com', 'Operasional Team', '$2b$10$YourHashedPasswordHere', 'operasional'),
  ('peralatan@tps.com', 'Tim Peralatan Terminal', '$2b$10$YourHashedPasswordHere', 'peralatan_terminal'),
  ('perencanaan@tps.com', 'Tim Perencanaan Persediaan', '$2b$10$YourHashedPasswordHere', 'perencanaan_persediaan'),
  ('fasilitas@tps.com', 'Tim Fasilitas', '$2b$10$YourHashedPasswordHere', 'fasilitas');

-- Create laporan_kerusakan table
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

-- Create indexes for laporan_kerusakan
CREATE INDEX idx_laporan_kerusakan_tanggal ON laporan_kerusakan(tanggal_laporan DESC);
CREATE INDEX idx_laporan_kerusakan_status ON laporan_kerusakan(status_kerusakan);
CREATE INDEX idx_laporan_kerusakan_ditugaskan ON laporan_kerusakan(ditugaskan_ke);

-- Create penindaklanjut_kerusakan table
CREATE TABLE penindaklanjut_kerusakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_kerusakan_id UUID NOT NULL REFERENCES laporan_kerusakan(id) ON DELETE CASCADE,
  ditangani_oleh_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_selesai DATE NOT NULL,
  deskripsi_tindakan TEXT NOT NULL,
  foto_bukti JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for penindaklanjut_kerusakan
CREATE INDEX idx_penindaklanjut_laporan ON penindaklanjut_kerusakan(laporan_kerusakan_id);
CREATE INDEX idx_penindaklanjut_penangan ON penindaklanjut_kerusakan(ditangani_oleh_id);
```

**Step 2: Generate bcrypt password hashes**

Run: `node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('password123', 10));"`

Copy the output hash, replace `$2b$10$YourHashedPasswordHere` in migration SQL with actual hash (do this 4 times for 4 users)

**Step 3: Commit migration file**

```bash
git add lib/migrations/005_redesign_roles_laporan.sql
git commit -m "feat: add complete redesign migration for roles and laporan"
```

---

## Task 4: Execute Database Migration

**Files:**
- Database: PostgreSQL

**Step 1: Execute migration via pgAdmin or psql**

Via pgAdmin:
1. Open pgAdmin
2. Connect to dashboard_alat database
3. Open Query Tool
4. Open file: `lib/migrations/005_redesign_roles_laporan.sql`
5. Execute (F5 or press Play button)

Via psql command line:
Run: `psql -h localhost -U postgres -d dashboard_alat -f lib/migrations/005_redesign_roles_laporan.sql`

Enter password: `123111`

Expected: Output shows "DROP TABLE", "CREATE TABLE", "INSERT" commands executed successfully

**Step 2: Verify users table created**

Run in psql or pgAdmin Query Tool:
```sql
SELECT * FROM users;
```

Expected: 4 rows returned (one for each role)

**Step 3: Verify laporan_kerusakan table created**

Run in psql or pgAdmin Query Tool:
```sql
\d laporan_kerusakan
```

Expected: Table schema displayed with all columns and constraints

**Step 4: Verify penindaklanjut_kerusakan table created**

Run in psql or pgAdmin Query Tool:
```sql
\d penindaklanjut_kerusakan
```

Expected: Table schema displayed with all columns and constraints

**Step 5: Commit migration completion**

```bash
git add -A
git commit -m "migration: executed redesign migration successfully"
```

---

## Task 5: Update TypeScript Types - Auth

**Files:**
- Modify: `types/auth.ts`

**Step 1: Update UserRole type**

Read file: `types/auth.ts`

Replace existing UserRole type with:

```typescript
export type UserRole = 'operasional' | 'peralatan_terminal' | 'perencanaan_persediaan' | 'fasilitas';
```

Delete old role references if any (admin, operator, mekanik)

**Step 2: Verify TypeScript compilation**

Run: `npm run build`

Expected: Build succeeds without type errors (may have errors in other files that still reference old roles - we'll fix those in next tasks)

**Step 3: Commit**

```bash
git add types/auth.ts
git commit -m "refactor: update UserRole to 4 new roles"
```

---

## Task 6: Update TypeScript Types - RTG (Delete Old Types)

**Files:**
- Modify: `types/rtg.ts`

**Step 1: Delete old TemuanRTG types**

Read file: `types/rtg.ts`

Find and delete these types (should be around lines 64-90 in current file):
- `StatusTemuan` type
- `TemuanRTG` interface
- `TemuanRTGWithDetails` interface
- `TemuanRTGInput` interface
- `StatusTemuanLabels` constant (if exists)

**Step 2: Add new LaporanKerusakan types**

Add these types after DashboardStats interface (around line 157):

```typescript
// ============= LAPORAN KERUSAKAN TYPES =============

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

// ============= PENINDAKLANJUT KERUSAKAN TYPES =============

export interface PenindaklanjutKerusakan {
  id: string;
  laporan_kerusakan_id: string;
  ditangani_oleh_id: string;
  tanggal_selesai: string;
  deskripsi_tindakan: string;
  foto_bukti: string[];
  created_at: string;
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

export interface PenindaklanjutKerusakanInput {
  laporan_kerusakan_id: string;
  tanggal_selesai: string;
  deskripsi_tindakan: string;
  foto_bukti: string[];
}
```

**Step 3: Add status labels**

Add after StatusKondisiColors (around line 202):

```typescript
export const StatusKerusakanLabels: Record<StatusKerusakan, string> = {
  DIPERIKSA: 'Diperiksa',
  DITINDAKLANJUTI: 'Ditindaklanjuti',
  SELESAI: 'Selesai',
};

export const StatusKerusakanColors: Record<StatusKerusakan, string> = {
  DIPERIKSA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
};
```

**Step 4: Verify TypeScript compilation**

Run: `npm run build`

Expected: Build succeeds (may still have errors in other files - fix in next tasks)

**Step 5: Commit**

```bash
git add types/rtg.ts
git commit -m "refactor: replace TemuanRTG with LaporanKerusakan types"
```

---

## Task 7: Update Service Layer - Auth Functions

**Files:**
- Modify: `lib/auth.ts`

**Step 1: Update getUserByEmail function**

Read file: `lib/auth.ts`

Update the SQL query and type handling to support new roles (no code changes needed if using parameterized queries, just verify it works with new role values)

**Step 2: Verify login works with new roles**

No code changes needed - the existing login flow will work with new roles

**Step 3: Commit (if any changes made)**

```bash
git add lib/auth.ts
git commit -m "refactor: verify auth functions work with new roles"
```

---

## Task 8: Replace Service Layer - Delete Old Temuan Functions

**Files:**
- Modify: `lib/rtg.ts`

**Step 1: Delete old temuan functions**

Read file: `lib/rtg.ts`

Find and delete the entire "TEMUAN RTG" section (should include these functions around lines 281-485):
- `getAllTemuan()`
- `getTemuanById()`
- `getTemuanByPelapor()`
- `getTemuanByStatus()`
- `createTemuan()`
- `updateTemuanStatus()`
- `deleteTemuan()`
- `getTemuanCountByStatus()`
- `mapTemuanRow()` helper function

**Step 2: Delete old imports**

At the top of `lib/rtg.ts`, find and delete these imports:
- `TemuanRTG`
- `TemuanRTGWithDetails`
- `TemuanRTGInput`
- `StatusTemuan`

Replace with new imports (add to existing imports):

```typescript
import {
  // ... existing imports
  LaporanKerusakan,
  LaporanKerusakanWithRTG,
  LaporanKerusakanInput,
  PenindaklanjutKerusakan,
  PenindaklanjutKerusakanWithDetails,
  PenindaklanjutKerusakanInput,
  StatusKerusakan,
  RoleTugas,
} from '@/types/rtg';
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`

Expected: Build succeeds (will have errors because functions are deleted - we'll add new ones in next task)

**Step 4: Commit**

```bash
git add lib/rtg.ts
git commit -m "refactor: delete old temuan functions from service layer"
```

---

## Task 9: Add Service Layer - Laporan Kerusakan Functions

**Files:**
- Modify: `lib/rtg.ts`

**Step 1: Add laporan kerusakan service functions**

Add these functions at the end of `lib/rtg.ts` file:

```typescript
// ============= LAPORAN KERUSAKAN =============

function mapLaporanKerusakanRow(row: any): LaporanKerusakanWithRTG {
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

export async function getAllLaporanKerusakan(): Promise<LaporanKerusakanWithRTG[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `);

  return result.rows.map(mapLaporanKerusakanRow);
}

export async function getLaporanKerusakanById(id: string): Promise<LaporanKerusakanWithRTG | null> {
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
  return mapLaporanKerusakanRow(result.rows[0]);
}

export async function getLaporanByDitugaskan(ditugaskanKe: RoleTugas): Promise<LaporanKerusakanWithRTG[]> {
  const result = await pool.query(`
    SELECT
      l.*,
      u.kode_rtg,
      u.nama_rtg
    FROM laporan_kerusakan l
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    WHERE l.ditugaskan_ke = $1
      AND l.status_kerusakan IN ('DIPERIKSA', 'DITINDAKLANJUTI')
    ORDER BY l.tanggal_laporan DESC, l.waktu_laporan DESC
  `, [ditugaskanKe]);

  return result.rows.map(mapLaporanKerusakanRow);
}

export async function getLaporanByStatus(status: StatusKerusakan): Promise<LaporanKerusakanWithRTG[]> {
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

  return result.rows.map(mapLaporanKerusakanRow);
}

export async function createLaporanKerusakan(input: LaporanKerusakanInput): Promise<LaporanKerusakan> {
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
    `INSERT INTO laporan_kerusakan (
      rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor,
      ditugaskan_ke, tanggal_laporan, waktu_laporan, jenis_kerusakan,
      deskripsi, foto_laporan
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      rtg_unit_id,
      dilaporkan_oleh,
      nama_pelapor,
      email_pelapor || null,
      ditugaskan_ke,
      tanggal_laporan,
      waktu_laporan,
      jenis_kerusakan,
      deskripsi || null,
      JSON.stringify(foto_laporan),
    ]
  );

  return result.rows[0];
}

export async function updateStatusKerusakan(id: string, status: StatusKerusakan): Promise<LaporanKerusakan | null> {
  const result = await pool.query(
    'UPDATE laporan_kerusakan SET status_kerusakan = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
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
```

**Step 2: Add penindaklanjut functions**

Add these functions after the laporan functions:

```typescript
// ============= PENINDAKLANJUT KERUSAKAN =============

export async function createPenindaklanjut(
  input: PenindaklanjutKerusakanInput & { ditangani_oleh_id: string }
): Promise<PenindaklanjutKerusakan> {
  const {
    laporan_kerusakan_id,
    ditangani_oleh_id,
    tanggal_selesai,
    deskripsi_tindakan,
    foto_bukti,
  } = input;

  const result = await pool.query(
    `INSERT INTO penindaklanjut_kerusakan (
      laporan_kerusakan_id, ditangani_oleh_id, tanggal_selesai,
      deskripsi_tindakan, foto_bukti
    ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      laporan_kerusakan_id,
      ditangani_oleh_id,
      tanggal_selesai,
      deskripsi_tindakan,
      JSON.stringify(foto_bukti),
    ]
  );

  return result.rows[0];
}

export async function getPenindaklanjutByLaporan(
  laporanId: string
): Promise<PenindaklanjutKerusakanWithDetails | null> {
  const result = await pool.query(`
    SELECT
      p.*,
      l.jenis_kerusakan,
      l.rtg_unit_id,
      u.kode_rtg,
      u.nama_rtg,
      usr.nama as ditangani_nama,
      usr.email as ditangani_email,
      usr.role as ditangani_role
    FROM penindaklanjut_kerusakan p
    LEFT JOIN laporan_kerusakan l ON p.laporan_kerusakan_id = l.id
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    LEFT JOIN users usr ON p.ditangani_oleh_id = usr.id
    WHERE p.laporan_kerusakan_id = $1
  `, [laporanId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti || [],
    created_at: row.created_at,
    laporan_kerusakan: {
      jenis_kerusakan: row.jenis_kerusakan,
      rtg_unit: {
        kode_rtg: row.kode_rtg,
        nama_rtg: row.nama_rtg,
      },
    },
    ditangani_oleh: {
      nama: row.ditangani_nama,
      email: row.ditangani_email,
      role: row.ditangani_role,
    },
  };
}

export async function getPenindaklanjutByPenangan(
  penanganId: string
): Promise<PenindaklanjutKerusakanWithDetails[]> {
  const result = await pool.query(`
    SELECT
      p.*,
      l.jenis_kerusakan,
      l.rtg_unit_id,
      u.kode_rtg,
      u.nama_rtg,
      usr.nama as ditangani_nama,
      usr.email as ditangani_email,
      usr.role as ditangani_role
    FROM penindaklanjut_kerusakan p
    LEFT JOIN laporan_kerusakan l ON p.laporan_kerusakan_id = l.id
    LEFT JOIN rtg_units u ON l.rtg_unit_id = u.id
    LEFT JOIN users usr ON p.ditangani_oleh_id = usr.id
    WHERE p.ditangani_oleh_id = $1
    ORDER BY p.created_at DESC
  `, [penanganId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    laporan_kerusakan_id: row.laporan_kerusakan_id,
    ditangani_oleh_id: row.ditangani_oleh_id,
    tanggal_selesai: row.tanggal_selesai,
    deskripsi_tindakan: row.deskripsi_tindakan,
    foto_bukti: row.foto_bukti || [],
    created_at: row.created_at,
    laporan_kerusakan: {
      jenis_kerusakan: row.jenis_kerusakan,
      rtg_unit: {
        kode_rtg: row.kode_rtg,
        nama_rtg: row.nama_rtg,
      },
    },
    ditangani_oleh: {
      nama: row.ditangani_nama,
      email: row.ditangani_email,
      role: row.ditangani_role,
    },
  }));
}
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`

Expected: Build succeeds without type errors

**Step 3: Commit**

```bash
git add lib/rtg.ts
git commit -m "feat: add laporan kerusakan and penindaklanjut service functions"
```

---

## Task 10: Delete Old Pages - Admin and Operator

**Files:**
- Delete: `/app/admin/`
- Delete: `/app/operator/`

**Step 1: Delete admin folder**

Run: `rm -rf app/admin/`

Expected: app/admin/ folder deleted

**Step 2: Delete operator folder**

Run: `rm -rf app/operator/`

Expected: app/operator/ folder deleted

**Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds (will have errors because we deleted pages but imports may still exist - we'll fix those)

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete admin and operator pages"
```

---

## Task 11: Create Operasional - Buat Laporan Page

**Files:**
- Create: `app/operasional/buat-laporan/page.tsx`
- Create: `app/operasional/buat-laporan/actions.ts`

**Step 1: Create server actions file**

Create `app/operasional/buat-laporan/actions.ts`:

```typescript
'use server';

import { redirect, revalidatePath } from 'next/navigation';
import { createLaporanKerusakan } from '@/lib/rtg';
import { uploadPhotos } from '@/lib/upload';
import { getSession } from '@/lib/auth';
import type { LaporanKerusakanInput } from '@/types/rtg';

export async function submitLaporan(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  try {
    const rtg_unit_id = formData.get('rtg_unit_id') as string;
    const dilaporkan_oleh = formData.get('dilaporkan_oleh') as string;
    const nama_pelapor = formData.get('nama_pelapor') as string;
    const email_pelapor = formData.get('email_pelapor') as string;
    const tanggal_laporan = formData.get('tanggal_laporan') as string;
    const waktu_laporan = formData.get('waktu_laporan') as string;
    const jenis_kerusakan = formData.get('jenis_kerusakan') as string;
    const deskripsi = formData.get('deskripsi') as string;
    const ditugaskan_ke = formData.get('ditugaskan_ke') as 'peralatan_terminal' | 'perencanaan_persediaan' | 'fasilitas';

    const photoFiles = formData.getAll('foto_laporan') as File[];
    const foto_laporan = photoFiles.length > 0 && photoFiles[0].size > 0
      ? await uploadPhotos(photoFiles)
      : [];

    await createLaporanKerusakan({
      rtg_unit_id,
      dilaporkan_oleh,
      nama_pelapor,
      email_pelapor,
      ditugaskan_ke,
      tanggal_laporan,
      waktu_laporan,
      jenis_kerusakan,
      deskripsi,
      foto_laporan,
    } as LaporanKerusakanInput);

    revalidatePath('/operasional/daftar-laporan');
    redirect('/operasional/daftar-laporan');
  } catch (error: any) {
    redirect('/operasional/buat-laporan?error=true');
  }
}
```

**Step 2: Create page component**

Create `app/operasional/buat-laporan/page.tsx`:

```typescript
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllRTGUnits } from '@/lib/rtg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitLaporan } from './actions';
import { FilePlus } from 'lucide-react';

export default async function BuatLaporanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const rtgUnits = await getAllRTGUnits();

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <SidebarProvider>
      <AppSidebar user={{ nama: session.nama, email: session.email, role: session.role }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/operasional/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Buat Laporan Kerusakan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <FilePlus className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Buat Laporan Kerusakan</h1>
          </div>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Form Laporan Kerusakan</CardTitle>
              <CardDescription>
                Laporkan kerusakan pada RTG dan assign ke tim yang bertanggung jawab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitLaporan} className="space-y-6">
                {/* RTG Unit */}
                <div className="space-y-2">
                  <Label htmlFor="rtg_unit_id">RTG Unit *</Label>
                  <Select name="rtg_unit_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih RTG Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {rtgUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.kode_rtg} - {unit.nama_rtg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dilaporkan oleh */}
                <div className="space-y-2">
                  <Label htmlFor="dilaporkan_oleh">Dilaporkan oleh *</Label>
                  <Input
                    type="text"
                    id="dilaporkan_oleh"
                    name="dilaporkan_oleh"
                    placeholder="Contoh: Operator A, Security, etc."
                    required
                  />
                </div>

                {/* Nama Pelapor */}
                <div className="space-y-2">
                  <Label htmlFor="nama_pelapor">Nama Pelapor *</Label>
                  <Input
                    type="text"
                    id="nama_pelapor"
                    name="nama_pelapor"
                    placeholder="Nama lengkap pelapor"
                    required
                  />
                </div>

                {/* Email Pelapor */}
                <div className="space-y-2">
                  <Label htmlFor="email_pelapor">Email Pelapor</Label>
                  <Input
                    type="email"
                    id="email_pelapor"
                    name="email_pelapor"
                    placeholder="email@contoh.com (opsional)"
                  />
                </div>

                {/* Tanggal & Waktu */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_laporan">Tanggal Laporan *</Label>
                    <Input
                      type="date"
                      id="tanggal_laporan"
                      name="tanggal_laporan"
                      defaultValue={today}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waktu_laporan">Waktu Laporan *</Label>
                    <Input
                      type="time"
                      id="waktu_laporan"
                      name="waktu_laporan"
                      defaultValue={currentTime}
                      required
                    />
                  </div>
                </div>

                {/* Jenis Kerusakan */}
                <div className="space-y-2">
                  <Label htmlFor="jenis_kerusakan">Jenis Kerusakan *</Label>
                  <Input
                    type="text"
                    id="jenis_kerusakan"
                    name="jenis_kerusakan"
                    placeholder="Contoh: Ban bocor, Kaca retak, Kursi rusak"
                    required
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    name="deskripsi"
                    placeholder="Jelaskan detail kerusakan..."
                    rows={4}
                  />
                </div>

                {/* Foto */}
                <div className="space-y-2">
                  <Label htmlFor="foto_laporan">Foto (Opsional)</Label>
                  <Input
                    type="file"
                    id="foto_laporan"
                    name="foto_laporan"
                    accept="image/*"
                    multiple
                  />
                  <p className="text-sm text-muted-foreground">
                    Maksimal 3 foto, format JPG/PNG/WEBP, max 5MB per file
                  </p>
                </div>

                {/* Ditugaskan ke */}
                <div className="space-y-2">
                  <Label htmlFor="ditugaskan_ke">Ditugaskan ke *</Label>
                  <Select name="ditugaskan_ke" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tim yang ditugaskan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peralatan_terminal">Tim Peralatan Terminal</SelectItem>
                      <SelectItem value="perencanaan_persediaan">Tim Perencanaan Persediaan</SelectItem>
                      <SelectItem value="fasilitas">Tim Fasilitas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Buat Laporan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/operasional/buat-laporan/
git commit -m "feat: add operasional buat laporan page"
```

---

## Task 12: Create Operasional - Daftar Laporan Page

**Files:**
- Create: `app/operasional/daftar-laporan/page.tsx`
- Create: `app/operasional/daftar-laporan/actions.ts`

**Step 1: Create server actions file**

Create `app/operasional/daftar-laporan/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/navigation';
import { updateStatusKerusakan } from '@/lib/rtg';

export async function updateStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as 'DITINDAKLANJUTI' | 'SELESAI';

  await updateStatusKerusakan(id, status);
  revalidatePath('/operasional/daftar-laporan');
}
```

**Step 2: Create page component**

Create `app/operasional/daftar-laporan/page.tsx` (similar structure to previous tasks, showing all laporan with action buttons to update status)

**Step 3: Commit**

```bash
git add app/operasional/daftar-laporan/
git commit -m "feat: add operasional daftar laporan page"
```

---

## Task 13: Move Admin Pages to Operasional

**Files:**
- Move: `app/admin/rtg-groups/` → `app/operasional/rtg-groups/`
- Move: `app/admin/rtg-units/` → `app/operasional/rtg-units/`

**Step 1: Copy rtg-groups to operasional**

Run: `cp -r app/admin/rtg-groups app/operasional/rtg-groups`

**Step 2: Copy rtg-units to operasional**

Run: `cp -r app/admin/rtg-units app/operasional/rtg-units`

**Note:** Since we deleted app/admin/ in Task 10, we need to recreate these pages. They were already implemented in earlier tasks, so we can reference the old code or recreate from scratch based on the existing patterns.

**Step 3: Update role checks**

In both `app/operasional/rtg-groups/page.tsx` and `app/operasional/rtg-units/page.tsx`, update role check from:

```typescript
if (!session || session.role !== 'admin') {
```

To:

```typescript
if (!session || session.role !== 'operasional') {
```

**Step 4: Commit**

```bash
git add app/operasional/rtg-groups/ app/operasional/rtg-units/
git commit -m "refactor: move rtg-groups and rtg-units to operasional"
```

---

## Task 14: Update App Sidebar Component

**Files:**
- Modify: `components/app-sidebar.tsx`

**Step 1: Update menu items for operasional role**

Read file: `components/app-sidebar.tsx`

Update the menu items to show correct routes for operasional role (dashboard, rtg-groups, rtg-units, buat-laporan, daftar-laporan, riwayat-laporan)

**Step 2: Add menu items for new roles**

Add menu items for peralatan_terminal, perencanaan_persediaan, and fasilitas roles (dashboard, tugas-saya, riwayat)

**Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "refactor: update sidebar for new roles and routes"
```

---

## Task 15: Update Middleware

**Files:**
- Modify: `middleware.ts`

**Step 1: Update role checks**

Ensure middleware allows access to new routes based on roles:
- `/operasional/*` - operasional only
- `/peralatan-terminal/*` - peralatan_terminal only
- `/perencanaan-persediaan/*` - perencanaan_persediaan only
- `/fasilitas/*` - fasilitas only

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "refactor: update middleware for new role-based routes"
```

---

## Task 16: Start Development Server

**Files:**
- Process management

**Step 1: Start dev server**

Run: `npm run dev`

Expected: Server starts on http://localhost:3000

**Step 2: Verify no build errors**

Check terminal output for any errors

**Step 3: Test login with new roles**

1. Visit http://localhost:3000/login
2. Login with: operasional@tps.com / password123
3. Verify dashboard loads correctly

---

## Task 17: End-to-End Testing

**Files:**
- Manual testing

**Step 1: Test operasional flow**

1. Login as operasional
2. Visit /operasional/buat-laporan
3. Fill form and submit
4. Verify redirect to /operasional/daftar-laporan
5. Verify new laporan appears in list

**Step 2: Test role baru flow**

1. Login as peralatan@tps.com
2. Visit /peralatan-terminal/tugas-saya
3. Verify assigned laporan appears
4. Test penindaklanjut form submission

**Step 3: Verify status transitions**

1. Check DIPERIKSA → DITINDAKLANJUTI → SELESAI workflow
2. Verify all role-based access controls work

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete redesign implementation - all features tested"
```

---

## Summary

This implementation plan executes a complete redesign of the roles and laporan system:
- 17 tasks total
- Each task is bite-sized (2-5 minutes)
- Covers database, types, service layer, pages, components
- Includes testing and verification steps

**Total estimated time:** 3-4 hours for full implementation

**Risk level:** HIGH (complete redesign, data loss in users and temuan_rtg tables)

**Rollback strategy:** Use database backup created in Task 1 if needed
